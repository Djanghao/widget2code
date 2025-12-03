import fs from "fs";
import path from "path";
import crypto from "crypto";
import { validate } from "@widget-factory/validator";

class DSLDiversityGenerator {
  constructor() {
    this.palette = null;
    this.rulebook = null;
    this.seedDSLs = [];
    this.generatedDSLs = new Set(); // Use Set for O(1) duplicate checking
    this.stats = {
      attempted: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      mutations: {
        colorMutations: 0,
        sizeMutations: 0,
        layoutMutations: 0,
        contentMutations: 0,
        chartMutations: 0,
        structureMutations: 0,
      },
    };
  }

  /**
   * Initialize the generator with palette, rulebook, and seed DSLs
   */
  async initialize() {
    console.log("🚀 Initializing DSL Diversity Generator...");

    // Load palette and rulebook
    try {
      // Handle both running from root and from libs/js/mutator
      const scriptDir = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
      // Remove leading '/' on Windows (e.g., /C:/... -> C:/...)
      const cleanScriptDir = process.platform === 'win32' && scriptDir.startsWith('/')
        ? scriptDir.substring(1)
        : scriptDir;
      const projectRoot = cleanScriptDir.includes('libs')
        ? path.resolve(cleanScriptDir, '..', '..', '..')
        : process.cwd();
      const toolsDir = path.join(projectRoot, "libs", "js", "mutator");
      
      const paletteData = JSON.parse(
        fs.readFileSync(
          path.join(toolsDir, "dsl-mutation-palette.json"),
          "utf8"
        )
      );
      const rulebookData = JSON.parse(
        fs.readFileSync(
          path.join(toolsDir, "dsl-validation-rulebook.json"),
          "utf8"
        )
      );

      this.palette = paletteData.mutationPalette;
      this.rulebook = rulebookData.validationRulebook;
      this.projectRoot = projectRoot;

      console.log("✅ Loaded mutation palette and validation rulebook");
    } catch (error) {
      throw new Error(`Failed to load palette or rulebook: ${error.message}`);
    }

    // Load seed DSLs
    await this.loadSeedDSLs();
    console.log(`✅ Loaded ${this.seedDSLs.length} seed DSLs`);

    // If no seed DSLs were loaded, create a simple default one
    if (this.seedDSLs.length === 0) {
      console.log("⚠️  No seed DSLs loaded, creating default seed DSL");
      this.seedDSLs.push(this.createDefaultSeedDSL());
      const hash = this.hashDSL(this.seedDSLs[0]);
      this.generatedDSLs.add(hash);
    }

    console.log("🎯 Generator initialized successfully!");
  }

  /**
   * Load existing DSL examples to use as seed data
   */
  async loadSeedDSLs() {
    const examplesDir = path.join(
      this.projectRoot,
      "output/2-mutator/seeds"
    );

    try {
      if (!fs.existsSync(examplesDir)) {
        console.warn(`⚠️  Examples directory does not exist: ${examplesDir}`);
        return;
      }

      const files = fs
        .readdirSync(examplesDir)
        .filter((file) => file.endsWith(".json"));

      for (const file of files) {
        try {
          const filePath = path.join(examplesDir, file);
          const content = fs.readFileSync(filePath, "utf8");
          const dsl = JSON.parse(content);

          // Validate the seed DSL before adding
          if (this.isValid(dsl)) {
            this.seedDSLs.push(dsl);
            const hash = this.hashDSL(dsl);
            this.generatedDSLs.add(hash);
          }
        } catch (error) {
          // Silently skip problematic files
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not load examples directory: ${error.message}`);
    }
  }

  /**
   * Create a simple default seed DSL when no seeds are available
   */
  createDefaultSeedDSL() {
    return {
      widget: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 16,
        aspectRatio: 1.0,
        root: {
          type: "container",
          direction: "col",
          gap: 8,
          children: [
            {
              type: "leaf",
              component: "Text",
              flex: 0,
              props: {
                fontSize: 16,
                color: "#333333",
                fontWeight: 600,
              },
              content: "Sample Widget",
            },
            {
              type: "leaf",
              component: "Icon",
              flex: 0,
              props: {
                name: "sf:star.fill",
                size: 20,
                color: "#FFCC00",
              },
            },
          ],
        },
      },
    };
  }

  /**
   * Generate synthetic DSLs using the Mutate-and-Validate approach
   */
  async generate(targetCount = 10000) {
    console.log(`🎲 Starting generation of ${targetCount} synthetic DSLs...`);

    const startTime = Date.now();
    const runId = this.generateRunId();
    this.currentRunId = runId;

    while (this.stats.valid < targetCount) {
      this.stats.attempted++;

      // Pick a random seed DSL
      const seedDSL = this.pickRandomSeed();
      const seedHash = this.hashDSL(seedDSL);

      // Apply mutations
      const mutationResult = this.mutate(seedDSL);

      // Validate the mutant
      if (this.isValid(mutationResult.dsl)) {
        // Check for duplicates
        const hash = this.hashDSL(mutationResult.dsl);
        if (!this.generatedDSLs.has(hash)) {
          this.generatedDSLs.add(hash);
          this.stats.valid++;

          // Save the valid DSL with full tracking
          await this.saveDSL({
            id: this.stats.valid,
            runId: runId,
            seedHash: seedHash,
            seedDSL: seedDSL,
            mutations: mutationResult.mutations,
            resultDSL: mutationResult.dsl,
            hash: hash,
            generatedAt: new Date().toISOString(),
          });

          // Progress reporting
          if (this.stats.valid % 100 === 0) {
            const progress = ((this.stats.valid / targetCount) * 100).toFixed(
              1
            );
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (this.stats.valid / elapsed).toFixed(1);
            console.log(
              `📈 Progress: ${progress}% (${this.stats.valid}/${targetCount}) - Rate: ${rate} DSL/sec`
            );
          }
        } else {
          this.stats.duplicates++;
        }
      } else {
        this.stats.invalid++;
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n🎉 Generation completed in ${totalTime.toFixed(1)}s!`);
    this.printStats(targetCount, totalTime);

    return this.stats;
  }

  /**
   * Generate synthetic DSLs with controlled theme/size mutations
   */
  async generateWithControlled(targetCount, options = {}) {
    const { themes = [null], sizes = [null], mode = 'hybrid' } = options;
    
    console.log(`🎨 Starting controlled generation of ${targetCount} base DSLs...`);
    console.log(`   Themes: ${themes.filter(t => t).join(', ') || 'none'}`);
    console.log(`   Sizes: ${sizes.filter(s => s).join(', ') || 'none'}`);
    console.log(`   Mode: ${mode}`);

    const startTime = Date.now();
    const runId = this.generateRunId();
    this.currentRunId = runId;

    const totalVariants = targetCount * themes.length * sizes.length;
    let variantsGenerated = 0;

    for (let i = 0; i < targetCount; i++) {
      // Pick a random seed DSL
      const seedDSL = this.pickRandomSeed();
      const seedHash = this.hashDSL(seedDSL);

      // Generate all theme × size combinations
      for (const theme of themes) {
        for (const size of sizes) {
          this.stats.attempted++;

          // Apply controlled mutation
          const mutationResult = this.applyControlledMutation(seedDSL, {
            theme,
            size,
            mode
          });

          // Validate the mutant
          if (this.isValid(mutationResult.dsl)) {
            // Check for duplicates
            const hash = this.hashDSL(mutationResult.dsl);
            if (!this.generatedDSLs.has(hash)) {
              this.generatedDSLs.add(hash);
              this.stats.valid++;
              variantsGenerated++;

              // Save the valid DSL with full tracking
              await this.saveDSL({
                id: this.stats.valid,
                runId: runId,
                seedHash: seedHash,
                seedDSL: seedDSL,
                mutations: mutationResult.mutations,
                resultDSL: mutationResult.dsl,
                hash: hash,
                generatedAt: new Date().toISOString(),
                controlled: {
                  theme: theme,
                  size: size,
                  mode: mode
                }
              });

              // Progress reporting
              if (variantsGenerated % 100 === 0) {
                const progress = ((variantsGenerated / totalVariants) * 100).toFixed(1);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const rate = (variantsGenerated / elapsed).toFixed(1);
                console.log(
                  `📈 Progress: ${progress}% (${variantsGenerated}/${totalVariants}) - Rate: ${rate} DSL/sec`
                );
              }
            } else {
              this.stats.duplicates++;
            }
          } else {
            this.stats.invalid++;
          }
        }
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n🎉 Controlled generation completed in ${totalTime.toFixed(1)}s!`);
    console.log(`   Base seeds: ${targetCount}`);
    console.log(`   Variants per seed: ${themes.length * sizes.length}`);
    console.log(`   Total generated: ${variantsGenerated}`);
    this.printStats(totalVariants, totalTime);

    return this.stats;
  }

  /**
   * Print generation statistics
   */
  printStats(targetCount, totalTime) {
    console.log(`📊 Final Stats:`);
    console.log(`   Total Attempts: ${this.stats.attempted}`);
    console.log(`   Valid Generated: ${this.stats.valid}`);
    console.log(`   Invalid: ${this.stats.invalid}`);
    console.log(`   Duplicates: ${this.stats.duplicates}`);
    console.log(
      `   Success Rate: ${(
        (this.stats.valid / this.stats.attempted) *
        100
      ).toFixed(1)}%`
    );
    console.log(
      `   Generation Rate: ${(this.stats.valid / totalTime).toFixed(1)} DSL/sec`
    );

    // Print mutation statistics
    console.log(`\n🧬 Mutation Distribution:`);
    for (const [type, count] of Object.entries(this.stats.mutations)) {
      const percentage = this.stats.valid > 0 
        ? ((count / this.stats.valid) * 100).toFixed(1)
        : 0;
      console.log(`   ${type}: ${count} (${percentage}%)`);
    }
  }

  /**
   * Pick a random seed DSL from the available pool
   */
  pickRandomSeed() {
    const randomIndex = Math.floor(Math.random() * this.seedDSLs.length);
    return JSON.parse(JSON.stringify(this.seedDSLs[randomIndex])); // Deep clone
  }

  /**
   * Apply controlled theme and size transformations
   * @param {Object} dsl - The DSL to transform
   * @param {Object} options - Transformation options
   * @returns {Object} - Transformed DSL with mutation history
   */
  applyControlledMutation(dsl, options = {}) {
    const {
      theme = null,      // 'light' | 'dark' | 'colorful' | 'glassmorphism' | 'minimal'
      size = null,       // 'compact' | 'medium' | 'large'
      mode = 'hybrid'    // 'random' | 'controlled' | 'hybrid'
    } = options;

    let mutant = JSON.parse(JSON.stringify(dsl));
    const mutationHistory = [];

    // Phase 1: Apply theme transformation (if specified)
    if (theme && this.palette.themes && this.palette.themes[theme]) {
      mutant = this.applyTheme(mutant, theme);
      mutationHistory.push({
        step: mutationHistory.length + 1,
        mutation: 'applyTheme',
        type: 'controlled',
        theme: theme,
        description: `Applied ${this.palette.themes[theme].name}`
      });
    }

    // Phase 2: Apply size transformation (if specified)
    if (size && this.palette.sizeVariants && this.palette.sizeVariants[size]) {
      mutant = this.applySize(mutant, size);
      mutationHistory.push({
        step: mutationHistory.length + 1,
        mutation: 'applySize',
        type: 'controlled',
        size: size,
        description: `Applied ${this.palette.sizeVariants[size].name} sizing`
      });
    }

    // Phase 3: Apply random mutations (if hybrid mode)
    if (mode === 'random' || mode === 'hybrid') {
      const randomResult = this.mutate(mutant);
      mutant = randomResult.dsl;
      // Renumber steps for random mutations
      randomResult.mutations.forEach(m => {
        m.step = mutationHistory.length + 1;
        mutationHistory.push(m);
      });
    }

    return {
      dsl: mutant,
      mutations: mutationHistory
    };
  }

  /**
   * Apply theme preset to DSL
   * @param {Object} dsl - The DSL to theme
   * @param {string} themeName - Name of the theme
   * @returns {Object} - Themed DSL
   */
  applyTheme(dsl, themeName) {
    const theme = this.palette.themes[themeName];
    if (!theme) return dsl;

    const transformations = theme;

    // Transform widget-level properties
    if (dsl.widget) {
      dsl.widget.backgroundColor = transformations.widget.backgroundColor;
      dsl.widget.borderRadius = transformations.widget.borderRadius;
    }

    // Traverse and update all nodes
    this.traverseAndApplyTheme(dsl.widget?.root, theme, 0);

    return dsl;
  }

  /**
   * Traverse DSL tree and apply theme transformations
   * @param {Object} node - Current node
   * @param {Object} theme - Theme configuration
   * @param {number} depth - Current depth in tree
   */
  traverseAndApplyTheme(node, theme, depth = 0) {
    if (!node) return;

    if (node.type === 'container') {
      // Update container backgrounds based on depth
      if (node.backgroundColor) {
        if (depth === 0) {
          node.backgroundColor = theme.backgrounds.primary;
        } else if (depth === 1) {
          node.backgroundColor = theme.backgrounds.secondary;
        } else {
          node.backgroundColor = theme.backgrounds.tertiary;
        }
      }

      // Recurse to children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => {
          this.traverseAndApplyTheme(child, theme, depth + 1);
        });
      }
    }

    if (node.type === 'leaf') {
      // Update text colors
      if (node.component === 'Text' && node.props?.color) {
        const textLevel = this.getTextImportance(node);
        node.props.color = theme.text[textLevel];
        
        // Update font weight if in theme
        if (node.props.fontWeight && theme.text.fontWeights) {
          node.props.fontWeight = this.selectFromArray(theme.text.fontWeights);
        }
      }

      // Update icon colors
      if (node.component === 'Icon' && node.props?.color) {
        const iconCategory = this.categorizeIcon(node.props.name);
        
        if (iconCategory === 'decorative' || iconCategory === 'generic') {
          // Use accent colors for decorative icons
          node.props.color = this.selectFromArray(theme.accents);
        } else {
          // Use text colors for functional icons
          node.props.color = theme.text.secondary;
        }
      }

      // Update chart colors
      if (this.isChartComponent(node.component) && node.props?.colors) {
        const colorCount = node.props.colors.length;
        node.props.colors = theme.accents.slice(0, colorCount);
      }
    }
  }

  /**
   * Apply size variant to DSL
   * @param {Object} dsl - The DSL to resize
   * @param {string} sizeName - Name of the size variant
   * @returns {Object} - Resized DSL
   */
  applySize(dsl, sizeName) {
    const size = this.palette.sizeVariants[sizeName];
    if (!size) return dsl;

    // Traverse and update all nodes
    this.traverseAndApplySize(dsl.widget?.root, size);

    // Update widget border radius
    if (dsl.widget?.borderRadius) {
      dsl.widget.borderRadius = Math.round(
        dsl.widget.borderRadius * size.borderRadius.multiplier
      );
    }

    return dsl;
  }

  /**
   * Traverse DSL tree and apply size transformations
   * @param {Object} node - Current node
   * @param {Object} size - Size configuration
   */
  traverseAndApplySize(node, size) {
    if (!node) return;

    if (node.type === 'container') {
      // Update spacing
      if (node.gap !== undefined) {
        node.gap = this.selectFromArray(size.spacing.gap);
      }
      if (node.padding !== undefined) {
        node.padding = this.selectFromArray(size.spacing.padding);
      }

      // Recurse to children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => {
          this.traverseAndApplySize(child, size);
        });
      }
    }

    if (node.type === 'leaf') {
      // Update text sizes
      if (node.component === 'Text' && node.props?.fontSize) {
        const textRole = this.getTextRole(node);
        const sizeArray = size.fontSize[textRole] || size.fontSize.base;
        node.props.fontSize = this.selectFromArray(sizeArray);
      }

      // Update icon sizes
      if (node.component === 'Icon' && node.props?.size) {
        const iconCategory = this.categorizeIconSize(node.props.size);
        node.props.size = this.selectFromArray(size.iconSize[iconCategory]);
      }
    }
  }

  /**
   * Helper: Determine text importance level
   * @param {Object} node - Text node
   * @returns {string} - 'primary' | 'secondary' | 'tertiary'
   */
  getTextImportance(node) {
    if (!node.props) return 'tertiary';
    
    const fontSize = node.props.fontSize || 14;
    const fontWeight = node.props.fontWeight || 400;
    
    if (fontSize >= 24 || fontWeight >= 600) return 'primary';
    if (fontSize >= 16 || fontWeight >= 500) return 'secondary';
    return 'tertiary';
  }

  /**
   * Helper: Determine text role (title/subtitle/base)
   * @param {Object} node - Text node
   * @returns {string} - 'title' | 'subtitle' | 'base'
   */
  getTextRole(node) {
    if (!node.props) return 'base';
    
    const fontSize = node.props.fontSize || 14;
    if (fontSize >= 20) return 'title';
    if (fontSize >= 16) return 'subtitle';
    return 'base';
  }

  /**
   * Helper: Categorize icon size
   * @param {number} size - Icon size in pixels
   * @returns {string} - 'small' | 'medium' | 'large'
   */
  categorizeIconSize(size) {
    if (size < 20) return 'small';
    if (size < 32) return 'medium';
    return 'large';
  }

  /**
   * Helper: Categorize icon by name
   * @param {string} iconName - Icon name
   * @returns {string} - Icon category
   */
  categorizeIcon(iconName) {
    if (!iconName) return 'generic';
    
    const patterns = {
      status: /check|x\.circle|alert|warning|error|success/,
      weather: /sun|cloud|rain|snow|wind|moon/,
      navigation: /arrow|chevron|caret|triangle/,
      data: /chart|graph|bar|line|pie|percent/,
      decorative: /star|heart|sparkle|flame|leaf/
    };
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(iconName)) return category;
    }
    return 'generic';
  }

  /**
   * Helper: Select random item from array
   * @param {Array} arr - Array to select from
   * @returns {*} - Random item
   */
  selectFromArray(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Apply mutations to a DSL
   */
  mutate(dsl) {
    const mutant = JSON.parse(JSON.stringify(dsl)); // Deep clone
    const numMutations = Math.floor(Math.random() * 5) + 2; // 2-6 mutations for more complexity
    const mutationHistory = [];

    for (let i = 0; i < numMutations; i++) {
      // Try to select an applicable mutation (max 10 attempts)
      let mutation;
      let attempts = 0;
      do {
        mutation = this.selectMutation();
        attempts++;
      } while (
        !this.isMutationApplicable(mutant, mutation.operation) &&
        attempts < 10
      );

      // Skip if no applicable mutation found after 10 attempts
      if (!this.isMutationApplicable(mutant, mutation.operation)) {
        continue;
      }

      const beforeState = this.captureMutationState(mutant, mutation);

      this.applyMutation(mutant, mutation);

      const afterState = this.captureMutationState(mutant, mutation);

      mutationHistory.push({
        step: i + 1,
        mutation: mutation.operation,
        type: mutation.type,
        description: this.getMutationDescription(mutation),
        before: beforeState,
        after: afterState,
        change: this.describeChange(beforeState, afterState),
      });
    }

    return {
      dsl: mutant,
      mutations: mutationHistory,
    };
  }

  /**
   * Get a human-readable description of a mutation
   */
  getMutationDescription(mutation) {
    const descriptions = {
      mutateBackgroundColor: "Changed background color",
      mutateTextColor: "Changed text color",
      mutateFontSize: "Changed font size",
      mutateGap: "Changed gap spacing",
      mutatePadding: "Changed padding",
      mutateFlex: "Changed flex property",
      mutateDirection: "Changed layout direction",
      mutateAlignment: "Changed alignment",
      mutateBorderRadius: "Changed border radius",
      mutateSize: "Changed component size",
      mutateIconName: "Changed icon",
      mutateIconSize: "Changed icon size",
      mutateContent: "Changed text content",
      mutateChartData: "Generated new chart data",
      mutateChartColors: "Changed chart colors",
      mutateChartOrientation: "Changed chart orientation",
      addNode: "Added new component",
      removeNode: "Removed component",
      swapNodes: "Swapped component positions",
      changeComponentType: "Changed component type",
      mutateWidgetProperties: "Changed widget properties",
      mutateFontWeight: "Changed font weight",
      mutateLineHeight: "Changed line height",
      mutateTextAlignment: "Changed text alignment",
      mutateWidgetAspectRatio: "Changed widget aspect ratio",
      duplicateNode: "Duplicated component",
      nestNode: "Nested component in container",
      flattenNode: "Flattened container",
      mutateChartVariant: "Changed chart variant",
    };

    return descriptions[mutation.operation] || "Applied mutation";
  }

  /**
   * Capture the state before a mutation is applied
   */
  captureMutationState(dsl, mutation) {
    // Find the target node that will be mutated
    const targetInfo = this.findMutationTarget(dsl, mutation);

    switch (mutation.operation) {
      case "mutateBackgroundColor":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateTextColor":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateFontSize":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateGap":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutatePadding":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateFlex":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateDirection":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateAlignment":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateBorderRadius":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateSize":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateIconName":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateIconSize":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateContent":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateChartData":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateChartColors":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateChartOrientation":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "addNode":
        return { action: "add", parent: targetInfo.path };
      case "removeNode":
        return { action: "remove", target: targetInfo.path };
      case "swapNodes":
        return { action: "swap", targets: targetInfo.paths };
      case "changeComponentType":
        return { target: targetInfo.path, from: targetInfo.currentValue };
      case "mutateWidgetProperties":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      default:
        return {};
    }
  }

  /**
   * Find the target node for a specific mutation
   */
  findMutationTarget(dsl, mutation) {
    switch (mutation.operation) {
      case "mutateBackgroundColor":
        return this.findBackgroundColorTarget(dsl);
      case "mutateTextColor":
        return this.findTextColorTarget(dsl);
      case "mutateFontSize":
        return this.findFontSizeTarget(dsl);
      case "mutateGap":
        return this.findGapTarget(dsl);
      case "mutatePadding":
        return this.findPaddingTarget(dsl);
      case "mutateFlex":
        return this.findFlexTarget(dsl);
      case "mutateDirection":
        return this.findDirectionTarget(dsl);
      case "mutateAlignment":
        return this.findAlignmentTarget(dsl);
      case "mutateBorderRadius":
        return {
          path: "widget.borderRadius",
          currentValue: dsl.widget?.borderRadius,
        };
      case "mutateSize":
        return this.findSizeTarget(dsl);
      case "mutateIconName":
        return this.findIconNameTarget(dsl);
      case "mutateIconSize":
        return this.findIconSizeTarget(dsl);
      case "mutateContent":
        return this.findContentTarget(dsl);
      case "mutateChartData":
        return this.findChartDataTarget(dsl);
      case "mutateChartColors":
        return this.findChartColorTarget(dsl);
      case "mutateChartOrientation":
        return this.findChartOrientationTarget(dsl);
      case "swapNodes":
        return { paths: ["unknown", "unknown"] };
      case "addNode":
        return { path: "unknown" };
      case "removeNode":
        return { path: "unknown" };
      case "changeComponentType":
        const leaf = this.findRandomLeaf(dsl.widget?.root);
        return leaf
          ? { path: "unknown", currentValue: leaf.component }
          : { path: "unknown", currentValue: null };
      case "mutateWidgetProperties":
        return { path: "widget", currentValue: dsl.widget };
      case "mutateFontWeight":
        return this.findTextColorTarget(dsl); // Reuse text finding logic
      case "mutateLineHeight":
        return this.findTextColorTarget(dsl); // Reuse text finding logic
      case "mutateWidgetAspectRatio":
        return {
          path: "widget.aspectRatio",
          currentValue: dsl.widget?.aspectRatio,
        };
      case "duplicateNode":
        return { path: "unknown" };
      case "nestNode":
        return { path: "unknown" };
      default:
        return { path: "unknown", currentValue: null };
    }
  }

  /**
   * Describe the change between before and after states
   */
  describeChange(before, after) {
    if (before.action === "add") {
      return `Added new component to ${before.parent}`;
    }
    if (before.action === "remove") {
      return `Removed component at ${before.target}`;
    }
    if (before.action === "swap") {
      return `Swapped components at ${before.targets.join(" and ")}`;
    }
    if (before.from) {
      return `Changed component type from "${before.from}" to "${after.value}" at ${before.target}`;
    }

    const beforeValue = before.value;
    const afterValue = after.value;

    if (beforeValue !== afterValue) {
      return `${before.target}: "${beforeValue}" → "${afterValue}"`;
    }

    return "Applied change";
  }

  /**
   * Target finder methods for specific mutations
   */
  findBackgroundColorTarget(dsl) {
    // First check if we're mutating widget background
    if (Math.random() < 0.5 && dsl.widget) {
      return {
        path: "widget.backgroundColor",
        currentValue: dsl.widget.backgroundColor,
      };
    }

    // Find a random container with background color
    const containers = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.backgroundColor !== undefined) {
        containers.push({ path, value: node.backgroundColor });
      }
    });

    if (containers.length > 0) {
      const target = containers[Math.floor(Math.random() * containers.length)];
      return { path: target.path, currentValue: target.value };
    }

    return {
      path: "widget.backgroundColor",
      currentValue: dsl.widget?.backgroundColor,
    };
  }

  findTextColorTarget(dsl) {
    const textComponents = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "Text" &&
        node.props?.color
      ) {
        textComponents.push({ path, value: node.props.color });
      }
    });

    if (textComponents.length > 0) {
      const target =
        textComponents[Math.floor(Math.random() * textComponents.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findFontSizeTarget(dsl) {
    const textComponents = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "Text" &&
        node.props?.fontSize
      ) {
        textComponents.push({ path, value: node.props.fontSize });
      }
    });

    if (textComponents.length > 0) {
      const target =
        textComponents[Math.floor(Math.random() * textComponents.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findGapTarget(dsl) {
    const containers = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.gap !== undefined) {
        containers.push({ path, value: node.gap });
      }
    });

    if (containers.length > 0) {
      const target = containers[Math.floor(Math.random() * containers.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findPaddingTarget(dsl) {
    // Check widget padding first
    if (Math.random() < 0.5 && dsl.widget?.padding !== undefined) {
      return { path: "widget.padding", currentValue: dsl.widget.padding };
    }

    const containers = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.padding !== undefined) {
        containers.push({ path, value: node.padding });
      }
    });

    if (containers.length > 0) {
      const target = containers[Math.floor(Math.random() * containers.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "widget.padding", currentValue: dsl.widget?.padding };
  }

  findFlexTarget(dsl) {
    const nodes = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.flex !== undefined) {
        nodes.push({ path, value: node.flex });
      }
    });

    if (nodes.length > 0) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findDirectionTarget(dsl) {
    const containers = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.direction) {
        containers.push({ path, value: node.direction });
      }
    });

    if (containers.length > 0) {
      const target = containers[Math.floor(Math.random() * containers.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findAlignmentTarget(dsl) {
    const containers = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container") {
        if (node.alignMain) {
          containers.push({ path: `${path}.alignMain`, value: node.alignMain });
        }
        if (node.alignCross) {
          containers.push({
            path: `${path}.alignCross`,
            value: node.alignCross,
          });
        }
      }
    });

    if (containers.length > 0) {
      const target = containers[Math.floor(Math.random() * containers.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findSizeTarget(dsl) {
    const nodes = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.width) nodes.push({ path: `${path}.width`, value: node.width });
      if (node.height)
        nodes.push({ path: `${path}.height`, value: node.height });
    });

    if (nodes.length > 0) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findIconNameTarget(dsl) {
    const icons = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "Icon" &&
        node.props?.name
      ) {
        icons.push({ path, value: node.props.name });
      }
    });

    if (icons.length > 0) {
      const target = icons[Math.floor(Math.random() * icons.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findIconSizeTarget(dsl) {
    const icons = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "Icon" &&
        node.props?.size
      ) {
        icons.push({ path, value: node.props.size });
      }
    });

    if (icons.length > 0) {
      const target = icons[Math.floor(Math.random() * icons.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findContentTarget(dsl) {
    const textNodes = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && node.component === "Text") {
        if (node.content)
          textNodes.push({ path: `${path}.content`, value: node.content });
        if (node.props?.children)
          textNodes.push({
            path: `${path}.props.children`,
            value: node.props.children,
          });
      }
    });

    if (textNodes.length > 0) {
      const target = textNodes[Math.floor(Math.random() * textNodes.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findChartDataTarget(dsl) {
    const charts = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        this.isChartComponent(node.component) &&
        node.props?.data
      ) {
        const preview = `[${node.props.data.slice(0, 3).join(", ")}${
          node.props.data.length > 3 ? "..." : ""
        }]`;
        charts.push({ path: `${path}.props.data`, value: preview });
      }
    });

    if (charts.length > 0) {
      const target = charts[Math.floor(Math.random() * charts.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findChartColorTarget(dsl) {
    const charts = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && this.isChartComponent(node.component)) {
        if (node.props?.color)
          charts.push({ path: `${path}.props.color`, value: node.props.color });
        if (node.props?.colors) {
          const preview = `[${node.props.colors.slice(0, 3).join(", ")}${
            node.props.colors.length > 3 ? "..." : ""
          }]`;
          charts.push({ path: `${path}.props.colors`, value: preview });
        }
      }
    });

    if (charts.length > 0) {
      const target = charts[Math.floor(Math.random() * charts.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  findChartOrientationTarget(dsl) {
    const charts = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "BarChart" &&
        node.props?.orientation
      ) {
        charts.push({ path, value: node.props.orientation });
      }
    });

    if (charts.length > 0) {
      const target = charts[Math.floor(Math.random() * charts.length)];
      return { path: target.path, currentValue: target.value };
    }

    return { path: "unknown", currentValue: null };
  }

  /**
   * Methods to extract specific state information
   */
  getBackgroundColors(dsl) {
    const colors = {};
    if (dsl.widget?.backgroundColor) {
      colors.widget = dsl.widget.backgroundColor;
    }
    this.traverseDSL(dsl, (node, path) => {
      if (node.backgroundColor) {
        colors[path] = node.backgroundColor;
      }
    });
    return colors;
  }

  getTextColors(dsl) {
    const colors = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && node.props?.color) {
        colors[path] = node.props.color;
      }
    });
    return colors;
  }

  getFontSizes(dsl) {
    const sizes = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && node.props?.fontSize) {
        sizes[path] = node.props.fontSize;
      }
    });
    return sizes;
  }

  getGaps(dsl) {
    const gaps = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.gap !== undefined) {
        gaps[path] = node.gap;
      }
    });
    return gaps;
  }

  getPaddings(dsl) {
    const paddings = {};
    if (dsl.widget?.padding !== undefined) {
      paddings.widget = dsl.widget.padding;
    }
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.padding !== undefined) {
        paddings[path] = node.padding;
      }
    });
    return paddings;
  }

  getFlexValues(dsl) {
    const flexValues = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.flex !== undefined) {
        flexValues[path] = node.flex;
      }
    });
    return flexValues;
  }

  getDirections(dsl) {
    const directions = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container" && node.direction) {
        directions[path] = node.direction;
      }
    });
    return directions;
  }

  getAlignments(dsl) {
    const alignments = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "container") {
        if (node.alignMain) alignments[`${path}.alignMain`] = node.alignMain;
        if (node.alignCross) alignments[`${path}.alignCross`] = node.alignCross;
      }
    });
    return alignments;
  }

  getBorderRadii(dsl) {
    const radii = {};
    if (dsl.widget?.borderRadius !== undefined) {
      radii.widget = dsl.widget.borderRadius;
    }
    return radii;
  }

  getSizes(dsl) {
    const sizes = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.width) sizes[`${path}.width`] = node.width;
      if (node.height) sizes[`${path}.height`] = node.height;
    });
    return sizes;
  }

  getIconNames(dsl) {
    const icons = {};
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "Icon" &&
        node.props?.name
      ) {
        icons[path] = node.props.name;
      }
    });
    return icons;
  }

  getIconSizes(dsl) {
    const sizes = {};
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "Icon" &&
        node.props?.size
      ) {
        sizes[path] = node.props.size;
      }
    });
    return sizes;
  }

  getTextContent(dsl) {
    const content = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf") {
        if (node.content) content[`${path}.content`] = node.content;
        if (node.props?.children)
          content[`${path}.props.children`] = node.props.children;
      }
    });
    return content;
  }

  getChartData(dsl) {
    const data = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && this.isChartComponent(node.component)) {
        if (node.props?.data)
          data[`${path}.data`] = `[${node.props.data.slice(0, 3).join(", ")}${
            node.props.data.length > 3 ? "..." : ""
          }]`;
        if (node.props?.labels)
          data[`${path}.labels`] = `[${node.props.labels
            .slice(0, 3)
            .join(", ")}${node.props.labels.length > 3 ? "..." : ""}]`;
      }
    });
    return data;
  }

  getChartColors(dsl) {
    const colors = {};
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && this.isChartComponent(node.component)) {
        if (node.props?.color) colors[`${path}.color`] = node.props.color;
        if (node.props?.colors)
          colors[`${path}.colors`] = `[${node.props.colors
            .slice(0, 3)
            .join(", ")}${node.props.colors.length > 3 ? "..." : ""}]`;
      }
    });
    return colors;
  }

  getChartOrientations(dsl) {
    const orientations = {};
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        node.component === "BarChart" &&
        node.props?.orientation
      ) {
        orientations[path] = node.props.orientation;
      }
    });
    return orientations;
  }

  /**
   * Helper method to traverse DSL and collect information
   */
  traverseDSL(node, callback, path = "root", depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion

    if (!node) return;

    callback(node, path);

    if (node.type === "container" && node.children) {
      node.children.forEach((child, index) => {
        this.traverseDSL(
          child,
          callback,
          `${path}.children[${index}]`,
          depth + 1
        );
      });
    }
  }

  /**
   * Check if a component is a chart type
   */
  isChartComponent(component) {
    const chartComponents = [
      "BarChart",
      "LineChart",
      "PieChart",
      "RadarChart",
      "StackedBarChart",
      "Sparkline",
      "ProgressBar",
      "ProgressRing",
    ];
    return chartComponents.includes(component);
  }

  /**
   * Check if DSL contains any chart components
   */
  hasChartComponents(dsl) {
    let hasChart = false;
    this.traverseDSL(dsl?.widget?.root, (node) => {
      if (node.type === "leaf" && this.isChartComponent(node.component)) {
        hasChart = true;
      }
    });
    return hasChart;
  }

  /**
   * Check if mutation is applicable to the DSL
   */
  isMutationApplicable(dsl, operation) {
    // Chart-specific mutations require chart components
    const chartMutations = [
      "mutateChartData",
      "mutateChartColors",
      "mutateChartOrientation",
      "mutateChartVariant",
    ];
    if (chartMutations.includes(operation)) {
      return this.hasChartComponents(dsl);
    }

    // Add more validation rules as needed
    return true;
  }

  /**
   * Select a mutation based on weights
   */
  selectMutation() {
    const weights = this.palette.mutationWeights;
    const operations = this.palette.mutationOperations;

    // Group operations by type
    const mutationsByType = {
      colorMutations: [
        "mutateBackgroundColor",
        "mutateTextColor",
        "mutateChartColors",
      ],
      sizeMutations: [
        "mutateFontSize",
        "mutateIconSize",
        "mutateSize",
        "mutateBorderRadius",
      ],
      layoutMutations: [
        "mutateGap",
        "mutatePadding",
        "mutateFlex",
        "mutateDirection",
        "mutateAlignment",
      ],
      contentMutations: ["mutateContent", "mutateChartData"],
      chartMutations: ["mutateChartOrientation", "mutateChartVariant"],
      structureMutations: [
        "addNode",
        "removeNode",
        "swapNodes",
        "changeComponentType",
        "mutateWidgetProperties",
        "duplicateNode",
        "nestNode",
        "flattenNode",
      ],
      styleMutations: [
        "mutateFontWeight",
        "mutateLineHeight",
        "mutateTextAlignment",
        "mutateWidgetAspectRatio",
      ],
    };

    // Select type based on weights
    const rand = Math.random();
    let cumulative = 0;
    let selectedType = null;

    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        selectedType = type;
        break;
      }
    }

    // Select specific operation from that type
    const typeOperations = mutationsByType[selectedType];
    const operation =
      typeOperations[Math.floor(Math.random() * typeOperations.length)];

    return { type: selectedType, operation };
  }

  /**
   * Apply a specific mutation to a DSL
   */
  applyMutation(dsl, mutation) {
    this.stats.mutations[mutation.type]++;

    switch (mutation.operation) {
      case "mutateBackgroundColor":
        this.mutateBackgroundColor(dsl);
        break;
      case "mutateTextColor":
        this.mutateTextColor(dsl);
        break;
      case "mutateFontSize":
        this.mutateFontSize(dsl);
        break;
      case "mutateGap":
        this.mutateGap(dsl);
        break;
      case "mutatePadding":
        this.mutatePadding(dsl);
        break;
      case "mutateFlex":
        this.mutateFlex(dsl);
        break;
      case "mutateDirection":
        this.mutateDirection(dsl);
        break;
      case "mutateAlignment":
        this.mutateAlignment(dsl);
        break;
      case "mutateBorderRadius":
        this.mutateBorderRadius(dsl);
        break;
      case "mutateSize":
        this.mutateSize(dsl);
        break;
      case "mutateIconName":
        this.mutateIconName(dsl);
        break;
      case "mutateIconSize":
        this.mutateIconSize(dsl);
        break;
      case "mutateContent":
        this.mutateContent(dsl);
        break;
      case "mutateChartData":
        this.mutateChartData(dsl);
        break;
      case "mutateChartColors":
        this.mutateChartColors(dsl);
        break;
      case "mutateChartOrientation":
        this.mutateChartOrientation(dsl);
        break;
      case "addNode":
        this.addNode(dsl);
        break;
      case "removeNode":
        this.removeNode(dsl);
        break;
      case "swapNodes":
        this.swapNodes(dsl);
        break;
      case "changeComponentType":
        this.changeComponentType(dsl);
        break;
      case "mutateWidgetProperties":
        this.mutateWidgetProperties(dsl);
        break;
      case "mutateFontWeight":
        this.mutateFontWeight(dsl);
        break;
      case "mutateLineHeight":
        this.mutateLineHeight(dsl);
        break;
      case "mutateWidgetAspectRatio":
        this.mutateWidgetAspectRatio(dsl);
        break;
      case "duplicateNode":
        this.duplicateNode(dsl);
        break;
      case "nestNode":
        this.nestNode(dsl);
        break;
      case "flattenNode":
        this.flattenNode(dsl);
        break;
      case "mutateChartVariant":
        this.mutateChartVariant(dsl);
        break;
      case "mutateTextAlignment":
        this.mutateTextAlignment(dsl);
        break;
    }
  }

  /**
   * Mutation implementation methods
   */
  mutateBackgroundColor(dsl) {
    const colors = this.palette.containerValues.backgroundColor;
    const newColor = colors[Math.floor(Math.random() * colors.length)];

    if (Math.random() < 0.5 && dsl.widget) {
      // Mutate widget background
      dsl.widget.backgroundColor = newColor;
    } else {
      // Mutate a random container background
      const container = this.findRandomContainer(dsl.widget?.root);
      if (container) {
        container.backgroundColor = newColor;
      }
    }
  }

  mutateTextColor(dsl) {
    const colors = this.palette.textProps.color;
    const newColor = colors[Math.floor(Math.random() * colors.length)];

    // Find a random text component
    const textComponent = this.findRandomComponent(dsl.widget?.root, "Text");
    if (textComponent && textComponent.props) {
      textComponent.props.color = newColor;
    }
  }

  mutateFontSize(dsl) {
    const fontSizes = this.palette.textProps.fontSize;
    const newSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];

    const textComponent = this.findRandomComponent(dsl.widget?.root, "Text");
    if (textComponent && textComponent.props) {
      textComponent.props.fontSize = newSize;
    }
  }

  mutateGap(dsl) {
    const gaps = this.palette.containerValues.gap;
    const newGap = gaps[Math.floor(Math.random() * gaps.length)];

    const container = this.findRandomContainer(dsl.widget?.root);
    if (container) {
      container.gap = newGap;
    }
  }

  mutatePadding(dsl) {
    const paddings = this.palette.containerValues.padding;
    const newPadding = paddings[Math.floor(Math.random() * paddings.length)];

    if (Math.random() < 0.5 && dsl.widget) {
      // Mutate widget padding
      dsl.widget.padding = newPadding;
    } else {
      // Mutate a random container padding
      const container = this.findRandomContainer(dsl.widget?.root);
      if (container) {
        container.padding = newPadding;
      }
    }
  }

  mutateFlex(dsl) {
    const flexValues = this.palette.containerValues.flex;
    const newFlex = flexValues[Math.floor(Math.random() * flexValues.length)];

    const randomNode = this.findRandomNode(dsl.widget?.root);
    if (randomNode) {
      randomNode.flex = newFlex;
    }
  }

  mutateDirection(dsl) {
    const directions = this.palette.containerValues.direction;
    const newDirection =
      directions[Math.floor(Math.random() * directions.length)];

    const container = this.findRandomContainer(dsl.widget?.root);
    if (container) {
      container.direction = newDirection;
    }
  }

  mutateAlignment(dsl) {
    if (Math.random() < 0.5) {
      const alignMains = this.palette.containerValues.alignMain;
      const newAlignMain =
        alignMains[Math.floor(Math.random() * alignMains.length)];
      const container = this.findRandomContainer(dsl.widget?.root);
      if (container) {
        container.alignMain = newAlignMain;
      }
    } else {
      const alignCrosses = this.palette.containerValues.alignCross;
      const newAlignCross =
        alignCrosses[Math.floor(Math.random() * alignCrosses.length)];
      const container = this.findRandomContainer(dsl.widget?.root);
      if (container) {
        container.alignCross = newAlignCross;
      }
    }
  }

  mutateBorderRadius(dsl) {
    const borderRadii = this.palette.widgetProperties.borderRadius;
    const newBorderRadius =
      borderRadii[Math.floor(Math.random() * borderRadii.length)];

    if (dsl.widget) {
      dsl.widget.borderRadius = newBorderRadius;
    }
  }

  mutateSize(dsl) {
    const sizes = [100, 150, 200, 250, 300, 350, 400];
    const newSize = sizes[Math.floor(Math.random() * sizes.length)];

    const randomNode = this.findRandomNode(dsl.widget?.root);
    if (randomNode) {
      if (Math.random() < 0.5) {
        randomNode.width = newSize;
      } else {
        randomNode.height = newSize;
      }
    }
  }

  mutateIconName(dsl) {
    const sfNames = this.palette.iconProps.sfNames;
    const lucideNames = this.palette.iconProps.lucideNames;

    let newName;
    if (Math.random() < 0.7) {
      // 70% SF Symbols
      const name = sfNames[Math.floor(Math.random() * sfNames.length)];
      newName = `sf:${name}`;
    } else {
      // 30% Lucide
      const name = lucideNames[Math.floor(Math.random() * lucideNames.length)];
      newName = `lucide:${name}`;
    }

    const iconComponent = this.findRandomComponent(dsl.widget?.root, "Icon");
    if (iconComponent && iconComponent.props) {
      iconComponent.props.name = newName;
    }
  }

  mutateIconSize(dsl) {
    const sizes = this.palette.iconProps.size;
    const newSize = sizes[Math.floor(Math.random() * sizes.length)];

    const iconComponent = this.findRandomComponent(dsl.widget?.root, "Icon");
    if (iconComponent && iconComponent.props) {
      iconComponent.props.size = newSize;
    }
  }

  mutateContent(dsl) {
    const contentCategories = Object.keys(this.palette.textContent);
    const category =
      contentCategories[Math.floor(Math.random() * contentCategories.length)];
    const contents = this.palette.textContent[category];
    const newContent = contents[Math.floor(Math.random() * contents.length)];

    const textComponent = this.findRandomComponent(dsl.widget?.root, "Text");
    if (textComponent) {
      if (Math.random() < 0.5 && textComponent.props) {
        textComponent.props.children = newContent;
      } else {
        textComponent.content = newContent;
      }
    }
  }

  mutateChartData(dsl) {
    const chartTypes = [
      "BarChart",
      "LineChart",
      "PieChart",
      "Sparkline",
      "ProgressBar",
      "ProgressRing",
    ];
    const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];

    const chartComponent = this.findRandomComponent(
      dsl.widget?.root,
      chartType
    );
    if (chartComponent && chartComponent.props) {
      const pattern = Math.random() < 0.5 ? "small" : "medium";
      const dataConfig = this.palette.dataPatterns[pattern];
      const count =
        dataConfig.count[Math.floor(Math.random() * dataConfig.count.length)];
      const range = dataConfig.range;

      // Generate new data
      const newData = [];
      for (let i = 0; i < count; i++) {
        newData.push(Math.floor(Math.random() * range));
      }

      chartComponent.props.data = newData;

      // Also update labels if needed
      if (
        chartType !== "Sparkline" &&
        chartType !== "ProgressBar" &&
        chartType !== "ProgressRing"
      ) {
        const labels = this.generateLabels(count);
        chartComponent.props.labels = labels;
      }
    }
  }

  mutateChartColors(dsl) {
    const colors = [
      "#007bff",
      "#28a745",
      "#dc3545",
      "#ffc107",
      "#17a2b8",
      "#6f42c1",
      "#fd7e14",
      "#20c997",
    ];
    const newColor = colors[Math.floor(Math.random() * colors.length)];

    const chartTypes = ["BarChart", "LineChart", "PieChart", "Sparkline"];
    const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];

    const chartComponent = this.findRandomComponent(
      dsl.widget?.root,
      chartType
    );
    if (chartComponent && chartComponent.props) {
      if (Math.random() < 0.5) {
        chartComponent.props.color = newColor;
      } else {
        chartComponent.props.colors = [newColor, this.adjustColor(newColor)];
      }
    }
  }

  mutateChartOrientation(dsl) {
    const chartComponent = this.findRandomComponent(
      dsl.widget?.root,
      "BarChart"
    );
    if (chartComponent && chartComponent.props) {
      const orientations = ["vertical", "horizontal"];
      const currentOrientation = chartComponent.props.orientation || "vertical";
      const newOrientation = orientations.find((o) => o !== currentOrientation);
      chartComponent.props.orientation = newOrientation;
    }
  }

  addNode(dsl) {
    const container = this.findRandomContainer(dsl.widget?.root);
    if (container && container.children && container.children.length < 10) {
      const newNode = this.generateRandomNode();
      const insertIndex = Math.floor(
        Math.random() * (container.children.length + 1)
      );
      container.children.splice(insertIndex, 0, newNode);
    }
  }

  removeNode(dsl) {
    const container = this.findRandomContainer(dsl.widget?.root);
    if (container && container.children && container.children.length > 1) {
      const removeIndex = Math.floor(Math.random() * container.children.length);
      container.children.splice(removeIndex, 1);
    }
  }

  swapNodes(dsl) {
    const container = this.findRandomContainer(dsl.widget?.root);
    if (container && container.children && container.children.length >= 2) {
      const index1 = Math.floor(Math.random() * container.children.length);
      let index2 = Math.floor(Math.random() * container.children.length);
      while (index2 === index1) {
        index2 = Math.floor(Math.random() * container.children.length);
      }

      // Swap the nodes
      const temp = container.children[index1];
      container.children[index1] = container.children[index2];
      container.children[index2] = temp;
    }
  }

  changeComponentType(dsl) {
    const allComponents = [
      ...this.palette.components.basic,
      ...this.palette.components.charts,
    ];
    const newComponent =
      allComponents[Math.floor(Math.random() * allComponents.length)];

    const leafComponent = this.findRandomLeaf(dsl.widget?.root);
    if (leafComponent) {
      leafComponent.component = newComponent;

      // Reset props to be appropriate for the new component type
      leafComponent.props = this.generateDefaultProps(newComponent);
    }
  }

  mutateWidgetProperties(dsl) {
    if (!dsl.widget) return;

    const mutations = [
      () => {
        const aspectRatios = this.palette.widgetProperties.aspectRatio;
        dsl.widget.aspectRatio =
          aspectRatios[Math.floor(Math.random() * aspectRatios.length)];
      },
      () => {
        const widths = this.palette.widgetProperties.width;
        dsl.widget.width = widths[Math.floor(Math.random() * widths.length)];
      },
      () => {
        const heights = this.palette.widgetProperties.height;
        dsl.widget.height = heights[Math.floor(Math.random() * heights.length)];
      },
    ];

    const mutation = mutations[Math.floor(Math.random() * mutations.length)];
    mutation();
  }

  /**
   * New mutation methods for added complexity
   */
  mutateFontWeight(dsl) {
    const textComponents = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && node.component === "Text" && node.props) {
        textComponents.push({ path, node });
      }
    });

    if (textComponents.length > 0) {
      const target =
        textComponents[Math.floor(Math.random() * textComponents.length)];
      const fontWeights = this.palette.textProps.fontWeight;
      const oldWeight = target.node.props.fontWeight || 400;
      const newWeight =
        fontWeights[Math.floor(Math.random() * fontWeights.length)];

      target.node.props.fontWeight = newWeight;

      this.lastMutation = {
        type: "mutateFontWeight",
        targetPath: target.path,
        oldValue: oldWeight,
        newValue: newWeight,
        description: `Changed font weight from ${oldWeight} to ${newWeight}`,
      };
    }
  }

  mutateLineHeight(dsl) {
    const textComponents = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && node.component === "Text" && node.props) {
        textComponents.push({ path, node });
      }
    });

    if (textComponents.length > 0) {
      const target =
        textComponents[Math.floor(Math.random() * textComponents.length)];
      const lineHeights = this.palette.textProps.lineHeight;
      const oldLineHeight = target.node.props.lineHeight || 1.4;
      const newLineHeight =
        lineHeights[Math.floor(Math.random() * lineHeights.length)];

      target.node.props.lineHeight = newLineHeight;

      this.lastMutation = {
        type: "mutateLineHeight",
        targetPath: target.path,
        oldValue: oldLineHeight,
        newValue: newLineHeight,
        description: `Changed line height from ${oldLineHeight} to ${newLineHeight}`,
      };
    }
  }

  mutateTextAlignment(dsl) {
    const textComponents = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf" && node.component === "Text" && node.props) {
        textComponents.push({ path, node });
      }
    });

    if (textComponents.length > 0) {
      const target =
        textComponents[Math.floor(Math.random() * textComponents.length)];
      const alignments = this.palette.textProps.align;
      const oldAlign = target.node.props.align || "left";
      const newAlign =
        alignments[Math.floor(Math.random() * alignments.length)];

      target.node.props.align = newAlign;

      this.lastMutation = {
        type: "mutateTextAlignment",
        targetPath: target.path,
        oldValue: oldAlign,
        newValue: newAlign,
        description: `Changed text alignment from ${oldAlign} to ${newAlign}`,
      };
    }
  }

  mutateWidgetAspectRatio(dsl) {
    if (!dsl.widget) return;

    const aspectRatios = this.palette.widgetProperties.aspectRatio;
    const oldAspectRatio = dsl.widget.aspectRatio;
    const newAspectRatio =
      aspectRatios[Math.floor(Math.random() * aspectRatios.length)];

    dsl.widget.aspectRatio = newAspectRatio;

    this.lastMutation = {
      type: "mutateWidgetAspectRatio",
      targetPath: "widget.aspectRatio",
      oldValue: oldAspectRatio,
      newValue: newAspectRatio,
      description: `Changed widget aspect ratio from ${oldAspectRatio} to ${newAspectRatio}`,
    };
  }

  mutateChartVariant(dsl) {
    const charts = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "leaf" &&
        (node.component === "PieChart" || node.component === "ProgressBar") &&
        node.props
      ) {
        charts.push({ path, node });
      }
    });

    if (charts.length > 0) {
      const target = charts[Math.floor(Math.random() * charts.length)];
      const oldVariant = target.node.props.variant;

      if (target.node.component === "PieChart") {
        const variants = this.palette.chartProps.pieChart.variant;
        target.node.props.variant =
          variants[Math.floor(Math.random() * variants.length)];

        this.lastMutation = {
          type: "mutateChartVariant",
          targetPath: target.path,
          oldValue: oldVariant,
          newValue: target.node.props.variant,
          description: `Changed PieChart variant from ${oldVariant} to ${target.node.props.variant}`,
        };
      } else if (target.node.component === "ProgressBar") {
        const variants = this.palette.chartProps.progressBar.variant;
        target.node.props.variant =
          variants[Math.floor(Math.random() * variants.length)];

        this.lastMutation = {
          type: "mutateChartVariant",
          targetPath: target.path,
          oldValue: oldVariant,
          newValue: target.node.props.variant,
          description: `Changed ProgressBar variant from ${oldVariant} to ${target.node.props.variant}`,
        };
      }
    }
  }

  duplicateNode(dsl) {
    const nodes = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf") {
        nodes.push({ path, node, parent: this.getParentNode(dsl, path) });
      }
    });

    if (nodes.length > 0) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      const duplicatedNode = JSON.parse(JSON.stringify(target.node));

      // Add to parent's children array
      if (target.parent && Array.isArray(target.parent.children)) {
        const index = target.parent.children.indexOf(target.node);
        target.parent.children.splice(index + 1, 0, duplicatedNode);

        this.lastMutation = {
          type: "duplicateNode",
          targetPath: target.path,
          oldValue: null,
          newValue: duplicatedNode,
          description: `Duplicated node at ${target.path}`,
        };
      }
    }
  }

  nestNode(dsl) {
    const leafNodes = [];
    this.traverseDSL(dsl, (node, path) => {
      if (node.type === "leaf") {
        leafNodes.push({ path, node, parent: this.getParentNode(dsl, path) });
      }
    });

    if (leafNodes.length >= 2) {
      const target = leafNodes[Math.floor(Math.random() * leafNodes.length)];

      // Create a new container to wrap the node
      const newContainer = {
        type: "container",
        direction:
          this.palette.containerValues.direction[
            Math.floor(
              Math.random() * this.palette.containerValues.direction.length
            )
          ],
        gap: this.palette.containerValues.gap[
          Math.floor(Math.random() * this.palette.containerValues.gap.length)
        ],
        children: [target.node],
      };

      // Replace the node with the new container in parent
      if (target.parent && Array.isArray(target.parent.children)) {
        const index = target.parent.children.indexOf(target.node);
        target.parent.children[index] = newContainer;

        this.lastMutation = {
          type: "nestNode",
          targetPath: target.path,
          oldValue: target.node,
          newValue: newContainer,
          description: `Nested node in new container at ${target.path}`,
        };
      }
    }
  }

  flattenNode(dsl) {
    const containers = [];
    this.traverseDSL(dsl, (node, path) => {
      if (
        node.type === "container" &&
        Array.isArray(node.children) &&
        node.children.length === 1
      ) {
        containers.push({ path, node, parent: this.getParentNode(dsl, path) });
      }
    });

    if (containers.length > 0) {
      const target = containers[Math.floor(Math.random() * containers.length)];
      const childNode = target.node.children[0];

      // Replace container with its only child in parent
      if (target.parent && Array.isArray(target.parent.children)) {
        const index = target.parent.children.indexOf(target.node);
        target.parent.children[index] = childNode;

        this.lastMutation = {
          type: "flattenNode",
          targetPath: target.path,
          oldValue: target.node,
          newValue: childNode,
          description: `Flattened container at ${target.path}, promoting single child`,
        };
      }
    }
  }

  /**
   * Helper methods for finding nodes and components
   */
  findRandomContainer(node, depth = 0) {
    if (depth > 5) return null; // Prevent infinite recursion

    const containers = [];
    this.collectContainers(node, containers);

    if (containers.length === 0) return null;
    return containers[Math.floor(Math.random() * containers.length)];
  }

  collectContainers(node, containers) {
    if (node && node.type === "container") {
      containers.push(node);
      if (node.children) {
        for (const child of node.children) {
          this.collectContainers(child, containers);
        }
      }
    }
  }

  findRandomComponent(node, componentType, depth = 0) {
    if (depth > 5) return null;

    const components = [];
    this.collectComponents(node, components, componentType);

    if (components.length === 0) return null;
    return components[Math.floor(Math.random() * components.length)];
  }

  collectComponents(node, components, componentType = null) {
    if (node) {
      if (
        node.type === "leaf" &&
        (!componentType || node.component === componentType)
      ) {
        components.push(node);
      }

      if (node.type === "container" && node.children) {
        for (const child of node.children) {
          this.collectComponents(child, components, componentType);
        }
      }
    }
  }

  findRandomNode(node, depth = 0) {
    if (depth > 5) return null;

    const nodes = [];
    this.collectNodes(node, nodes);

    if (nodes.length === 0) return null;
    return nodes[Math.floor(Math.random() * nodes.length)];
  }

  collectNodes(node, nodes) {
    if (node) {
      nodes.push(node);

      if (node.type === "container" && node.children) {
        for (const child of node.children) {
          this.collectNodes(child, nodes);
        }
      }
    }
  }

  getParentNode(dsl, targetPath) {
    const pathParts = targetPath.match(/\d+/g);
    if (!pathParts || pathParts.length === 0) return null;

    let current = dsl.widget.root;
    let parent = null;

    for (let i = 0; i < pathParts.length - 1; i++) {
      parent = current;
      if (current.type === "container" && current.children) {
        const index = parseInt(pathParts[i]);
        current = current.children[index];
      } else {
        return null;
      }
    }

    return parent;
  }

  findRandomLeaf(node, depth = 0) {
    if (depth > 5) return null;

    const leafs = [];
    this.collectLeafs(node, leafs);

    if (leafs.length === 0) return null;
    return leafs[Math.floor(Math.random() * leafs.length)];
  }

  collectLeafs(node, leafs) {
    if (node) {
      if (node.type === "leaf") {
        leafs.push(node);
      } else if (node.type === "container" && node.children) {
        for (const child of node.children) {
          this.collectLeafs(child, leafs);
        }
      }
    }
  }

  /**
   * Generate a random node
   */
  generateRandomNode() {
    if (Math.random() < 0.3) {
      // 30% chance of container
      return {
        type: "container",
        direction:
          this.palette.containerValues.direction[
            Math.floor(
              Math.random() * this.palette.containerValues.direction.length
            )
          ],
        gap: this.palette.containerValues.gap[
          Math.floor(Math.random() * this.palette.containerValues.gap.length)
        ],
        children: [],
      };
    } else {
      // 70% chance of leaf
      const allComponents = [
        ...this.palette.components.basic,
        ...this.palette.components.charts,
      ];
      const component =
        allComponents[Math.floor(Math.random() * allComponents.length)];

      return {
        type: "leaf",
        component: component,
        props: this.generateDefaultProps(component),
        flex: this.palette.containerValues.flex[
          Math.floor(Math.random() * this.palette.containerValues.flex.length)
        ],
      };
    }
  }

  /**
   * Generate default props for a component
   */
  generateDefaultProps(componentType) {
    const chartComponents = this.palette.components.charts;

    if (componentType === "Text") {
      return {
        fontSize:
          this.palette.textProps.fontSize[
            Math.floor(Math.random() * this.palette.textProps.fontSize.length)
          ],
        color:
          this.palette.textProps.color[
            Math.floor(Math.random() * this.palette.textProps.color.length)
          ],
      };
    } else if (componentType === "Icon") {
      const sfNames = this.palette.iconProps.sfNames;
      const name = sfNames[Math.floor(Math.random() * sfNames.length)];
      return {
        name: `sf:${name}`,
        size: this.palette.iconProps.size[
          Math.floor(Math.random() * this.palette.iconProps.size.length)
        ],
        color:
          this.palette.iconProps.color[
            Math.floor(Math.random() * this.palette.iconProps.color.length)
          ],
      };
    } else if (chartComponents.includes(componentType)) {
      return this.generateChartProps(componentType);
    }

    return {};
  }

  /**
   * Generate props for chart components
   */
  generateChartProps(chartType) {
    const pattern = "small";
    const dataConfig = this.palette.dataPatterns[pattern];
    const count =
      dataConfig.count[Math.floor(Math.random() * dataConfig.count.length)];
    const range = dataConfig.range;

    const data = [];
    for (let i = 0; i < count; i++) {
      data.push(Math.floor(Math.random() * range));
    }

    const props = { data };

    if (
      chartType !== "Sparkline" &&
      chartType !== "ProgressBar" &&
      chartType !== "ProgressRing"
    ) {
      props.labels = this.generateLabels(count);
    }

    if (chartType === "BarChart") {
      props.orientation =
        this.palette.chartProps.barChart.orientation[
          Math.floor(
            Math.random() * this.palette.chartProps.barChart.orientation.length
          )
        ];
    } else if (chartType === "PieChart") {
      props.variant =
        this.palette.chartProps.pieChart.variant[
          Math.floor(
            Math.random() * this.palette.chartProps.pieChart.variant.length
          )
        ];
    } else if (chartType === "ProgressBar" || chartType === "ProgressRing") {
      props.value = Math.floor(Math.random() * 100);
    }

    return props;
  }

  /**
   * Generate labels for charts
   */
  generateLabels(count) {
    const labelCategories = Object.values(this.palette.textContent).flat();
    const labels = [];

    for (let i = 0; i < count; i++) {
      const label =
        labelCategories[Math.floor(Math.random() * labelCategories.length)];
      labels.push(label);
    }

    return labels;
  }

  /**
   * Adjust color slightly for variations
   */
  adjustColor(color) {
    // Simple color adjustment - in a real implementation, you might want more sophisticated color manipulation
    const colors = [
      "#007bff",
      "#28a745",
      "#dc3545",
      "#ffc107",
      "#17a2b8",
      "#6f42c1",
      "#fd7e14",
      "#20c997",
    ];
    const adjustedColors = colors.filter((c) => c !== color);
    return adjustedColors[Math.floor(Math.random() * adjustedColors.length)];
  }

  /**
   * Validation method using standardized validator from @widget-factory/validator
   */
  isValid(dsl) {
    try {
      const result = validate(dsl);
      // Consider a DSL valid if it can compile (has no critical errors)
      return result.canCompile;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a hash for duplicate detection
   */
  hashDSL(dsl) {
    const str = JSON.stringify(dsl);
    return crypto.createHash("md5").update(str).digest("hex");
  }

  /**
   * Generate a unique run ID for each generation session
   */
  generateRunId() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `run-${timestamp}-${randomSuffix}`;
  }

  /**
   * Save a generated DSL to file
   */
  async saveDSL(dslData) {
    const resultsDir = path.join(this.projectRoot, "output/2-mutator/batch-generated", this.currentRunId);

    // Create directory if it doesn't exist
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save to batch files (100 DSLs per file for better granularity)
    const batchIndex = Math.ceil(dslData.id / 100);
    const filename = `${this.currentRunId}-batch-${batchIndex
      .toString()
      .padStart(3, "0")}.json`;
    const filepath = path.join(resultsDir, filename);

    try {
      let existingData = [];
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, "utf8");
        existingData = JSON.parse(content);
      }

      existingData.push(dslData);

      fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error(`❌ Failed to save DSL ${dslData.id}: ${error.message}`);
    }
  }

  /**
   * Generate a final report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      paletteInfo: {
        totalComponents:
          this.palette.components.basic.length +
          this.palette.components.charts.length,
        totalMutations: this.palette.mutationOperations.length,
        totalColors: this.palette.containerValues.backgroundColor.length,
        totalIcons:
          this.palette.iconProps.sfNames.length +
          this.palette.iconProps.lucideNames.length,
      },
      rulebookInfo: {
        maxDepth: this.rulebook.globalConstraints.maxDepth,
        maxChildren: this.rulebook.globalConstraints.maxChildrenPerContainer,
        validationRules: Object.keys(this.rulebook.componentSpecificRules)
          .length,
      },
    };

    const resultsDir = path.join(this.projectRoot, "output/2-mutator/batch-generated", this.currentRunId);
    const reportPath = path.join(resultsDir, "generation-report.json");

    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📋 Generation report saved to: ${reportPath}`);
    console.log(`📁 Results folder: ${resultsDir}`);
    return report;
  }
}

/**
 * Main execution function
 */
async function main() {
  const generator = new DSLDiversityGenerator();

  try {
    await generator.initialize();
    await generator.generate(10000); // Generate 10,000 DSLs
    await generator.generateReport();
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DSLDiversityGenerator;
