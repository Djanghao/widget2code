import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRandomIcon } from "../data/descriptions/icons/getRandomIcon.js";
import { getRandomMegalithImage } from "../data/descriptions/image-urls/getRandomMonolithImage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

// Load environment variables
loadEnv();

const DESCRIPTIONS_DIR = path.join(__dirname, "../data/descriptions");
const DYNAMIC_DIR = path.join(DESCRIPTIONS_DIR, "dynamic");
const WITH_IMAGES_DIR = path.join(DESCRIPTIONS_DIR, "with-images");
const LLM_GENERATED_DIR = path.join(DESCRIPTIONS_DIR, "llm-generated");
const IMAGE_URLS_DIR = path.join(DESCRIPTIONS_DIR, "image-urls");
const PROMPTS_DIR = path.join(
  __dirname,
  "../../../python/generator/prompts/prompt2dsl/domains"
);
const OUTPUT_DIR = path.join(__dirname, "../../../output/1-synthesis/batch-generated");
const PRESETS_FILE = path.join(__dirname, "../config/prompt-presets.json");

/**
 * Batch widget generation system
 * Combines description libraries with domain-specific prompts to generate widgets
 */

const DEFAULT_DOMAINS = [
  // Completed domains commented out - resume from incomplete only
  // "health",
  // "finance",
  // "weather",
  // "productivity",
  // "media",
  // "communication",
  // "smart-home",
  // "navigation",
  "utilities",
  "sports",
  "travel",
  "food",
  "shopping",
  "social",
];

/**
 * Load descriptions for a domain
 */
function loadDescriptions(domain, useDynamic = false, useWithImages = false, useLLM = false) {
  try {
    let fileName, filePath;

    if (useLLM) {
      fileName = `${domain}-llm-descriptions.json`;
      filePath = path.join(LLM_GENERATED_DIR, fileName);
    } else if (useWithImages) {
      fileName = `${domain}-with-images.json`;
      filePath = path.join(WITH_IMAGES_DIR, fileName);
    } else {
      fileName = useDynamic
        ? `${domain}-dynamic.json`
        : `${domain}-descriptions.json`;
      filePath = useDynamic
        ? path.join(DYNAMIC_DIR, fileName)
        : path.join(DESCRIPTIONS_DIR, fileName);
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  Description file not found: ${fileName}`);
      return [];
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return useDynamic ? data.variations : data.descriptions;
  } catch (error) {
    console.error(
      `  ❌ Error loading descriptions for ${domain}:`,
      error.message
    );
    return [];
  }
}

/**
 * Load prompt presets from configuration file
 */
function loadPromptPresets() {
  try {
    if (!fs.existsSync(PRESETS_FILE)) {
      console.warn(`  ⚠️  Presets file not found: ${PRESETS_FILE}`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(PRESETS_FILE, "utf-8"));
    return data.presets;
  } catch (error) {
    console.error(`  ❌ Error loading presets:`, error.message);
    return null;
  }
}

/**
 * Apply preset modifier to system prompt
 */
function applyPresetToPrompt(systemPrompt, presetName) {
  if (!presetName || presetName === "default") {
    return systemPrompt;
  }

  const presets = loadPromptPresets();
  if (!presets || !presets[presetName]) {
    console.warn(`  ⚠️  Preset "${presetName}" not found, using default`);
    return systemPrompt;
  }

  const preset = presets[presetName];
  return systemPrompt + preset.systemPromptModifier;
}

/**
 * Load domain-specific system prompt
 */
function loadDomainPrompt(domain, presetName = null) {
  try {
    const promptPath = path.join(PROMPTS_DIR, `prompt2dsl-${domain}.md`);

    if (!fs.existsSync(promptPath)) {
      console.warn(`  ⚠️  Domain prompt not found: prompt2dsl-${domain}.md`);
      return null;
    }

    let systemPrompt = fs.readFileSync(promptPath, "utf-8");

    // Apply preset modifier if specified
    if (presetName) {
      systemPrompt = applyPresetToPrompt(systemPrompt, presetName);
    }

    return systemPrompt;
  } catch (error) {
    console.error(`  ❌ Error loading prompt for ${domain}:`, error.message);
    return null;
  }
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Load image URLs from text file
 */
function loadImageUrls(urlsFilePath) {
  if (!fs.existsSync(urlsFilePath)) {
    return [];
  }

  try {
    return fs
      .readFileSync(urlsFilePath, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && isValidUrl(line));
  } catch (error) {
    console.error(
      `  ❌ Error loading image URLs from ${urlsFilePath}:`,
      error.message
    );
    return [];
  }
}

/**
 * Get domain-specific image URLs with fallback
 */
function getImageUrlsForDomain(domain, imageUrlsDir) {
  const domainFile = path.join(imageUrlsDir, `image-urls-${domain}.txt`);
  const allFile = path.join(imageUrlsDir, "image-urls-all.txt");

  // Try domain-specific first, fall back to all
  if (fs.existsSync(domainFile)) {
    const urls = loadImageUrls(domainFile);
    if (urls.length > 0) {
      return urls;
    }
  }

  return loadImageUrls(allFile);
}

/**
 * Select and consume image URL from pool
 */
function selectImageUrl(imageUrls, used = new Set()) {
  const available = imageUrls.filter((url) => !used.has(url));
  if (available.length === 0) {
    // Reset if we've used all URLs
    if (used.size > 0 && imageUrls.length > 0) {
      used.clear();
      return selectImageUrl(imageUrls, used);
    }
    return null;
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const selectedUrl = available[randomIndex];
  used.add(selectedUrl);
  return selectedUrl;
}

/**
 * Get placement guide text for prompt enhancement
 */
function getPlacementGuide(placement) {
  const guides = {
    "top-large":
      "Place the image as a large hero image at the top of the widget, full width",
    "left-thumbnail": "Place the image as a small thumbnail on the left side",
    background: "Use the image as a background with content overlay",
    center: "Center the image in the widget with text around it",
    grid: "Include the image as part of a grid layout with other content",
  };
  return guides[placement] || "Integrate the image naturally into the layout";
}

/**
 * Enhance user prompt with specific image URL and aspect ratio
 */
function enhancePromptWithImage(userPrompt, imageUrl, imagePlacement, aspectRatio = null) {
  if (!imageUrl && !aspectRatio) return userPrompt;

  let enhancement = `${userPrompt}\n`;

  if (imageUrl) {
    const placementGuide = getPlacementGuide(imagePlacement);
    enhancement += `\n**Image Requirements**:
- Use this specific image URL: ${imageUrl}
- Image placement: ${placementGuide}
- Integrate the image naturally into the widget layout\n`;
  }

  if (aspectRatio) {
    const aspectRatioDescription = getAspectRatioDescription(aspectRatio);
    enhancement += `\n**Layout Constraints**:
- Target aspect ratio: ${aspectRatio} (${aspectRatioDescription})
- Design the widget to fit this aspect ratio naturally
- Adjust layout orientation and spacing accordingly`;
  }

  return enhancement;
}

/**
 * Get aspect ratio description
 */
function getAspectRatioDescription(ratio) {
  if (ratio <= 0.67) return "tall portrait";
  if (ratio <= 0.9) return "portrait";
  if (ratio <= 1.1) return "square";
  if (ratio <= 1.5) return "slightly wide";
  if (ratio <= 2.0) return "landscape";
  if (ratio <= 2.5) return "wide";
  return "ultra-wide";
}

/**
 * Generate widget by calling the /api/generate-widget-text endpoint
 */
async function generateWidget(systemPrompt, userPrompt, port = null) {
  const BACKEND_PORT = port || process.env.BACKEND_PORT || "8010";
  const API_URL = `http://localhost:${BACKEND_PORT}/api/generate-widget-text`;
  const API_KEY = process.env.DASHSCOPE_API_KEY;

  try {
    const formData = new FormData();
    formData.append("system_prompt", systemPrompt);
    formData.append("user_prompt", userPrompt);

    // API key is required by the server (can be set in .env file)
    // If not provided as env var, server will use its own DASHSCOPE_API_KEY from .env
    if (API_KEY) {
      formData.append("api_key", API_KEY);
    }

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `API error (${response.status}): ${
          error.error || error.detail || "Unknown error"
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to generate widget: ${error.message}`);
    throw error;
  }
}

/**
 * Generate widget with reference image by calling the /api/generate-widget-text-with-reference endpoint
 */
async function generateWidgetWithReference(
  systemPrompt,
  userPrompt,
  referenceImagePath,
  port = null
) {
  const BACKEND_PORT = port || process.env.BACKEND_PORT || "8010";
  const API_URL = `http://localhost:${BACKEND_PORT}/api/generate-widget-text-with-reference`;
  const API_KEY = process.env.DASHSCOPE_API_KEY;

  try {
    const formData = new FormData();

    // Add reference image
    const imageBuffer = fs.readFileSync(referenceImagePath);
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });
    formData.append(
      "reference_image",
      imageBlob,
      path.basename(referenceImagePath)
    );

    // Add prompts
    if (systemPrompt) {
      formData.append("system_prompt", systemPrompt);
    }
    formData.append("user_prompt", userPrompt);

    // API key
    if (API_KEY) {
      formData.append("api_key", API_KEY);
    }

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `API error (${response.status}): ${
          error.error || error.detail || "Unknown error"
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to generate widget with reference: ${error.message}`);
    throw error;
  }
}

/**
 * Load reference images from directory
 */
function loadReferenceImages(referenceImagesDir) {
  if (!referenceImagesDir || !fs.existsSync(referenceImagesDir)) {
    return [];
  }

  const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  const files = fs.readdirSync(referenceImagesDir);

  return files
    .filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase())
    )
    .map((file) => path.join(referenceImagesDir, file));
}

/**
 * Randomly select a reference image from the list
 */
function selectRandomReferenceImage(referenceImages) {
  if (!referenceImages || referenceImages.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * referenceImages.length);
  return referenceImages[randomIndex];
}

/**
 * Recursively transform widget tree to replace icons and fix image properties
 */
function transformGeneratedWidget(node) {
  if (!node || typeof node !== "object") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => transformGeneratedWidget(item));
  }

  const transformed = { ...node };

  if (transformed.type === "leaf" && transformed.component) {
    const component = transformed.component;

    if (
      (component === "Image" || component === "MapImage") &&
      transformed.props
    ) {
      transformed.props = { ...transformed.props };

      if (transformed.props.url) {
        transformed.props.src = transformed.props.url;
        delete transformed.props.url;
      }
    }

    if (component === "Icon" && transformed.props) {
      transformed.props = { ...transformed.props };

      const randomIcon = getRandomIcon();
      if (randomIcon) {
        transformed.props.name = randomIcon.id;
      }
    }
  }

  if (transformed.children) {
    transformed.children = transformGeneratedWidget(transformed.children);
  }

  if (transformed.root) {
    transformed.root = transformGeneratedWidget(transformed.root);
  }

  return transformed;
}

/**
 * Ensure widget padding is within acceptable range
 */
function normalizePadding(widget) {
  if (widget && widget.padding !== undefined) {
    widget.padding = Math.max(12, Math.min(20, widget.padding));
  }
  return widget;
}

/**
 * Generate widgets for a domain
 */
async function generateWidgetsForDomain(domain, options = {}) {
  const {
    useStatic = true,
    useDynamic = false,
    useWithImages = false,
    useLLM = false,
    limit = null,
    referenceImages = [],
    imageUrlsDir = null,
    referencesPerDescription = 1,
    promptPreset = null,
    port = null,
  } = options;

  console.log(`\n📦 Processing domain: ${domain}`);
  const sources = [];
  if (useStatic) sources.push("static");
  if (useDynamic) sources.push("dynamic");
  if (useWithImages) sources.push("with-images");
  if (useLLM) sources.push("llm-generated");
  console.log(`   Sources: ${sources.join(" + ")}`);

  if (promptPreset) {
    console.log(`   🎨 Prompt preset: ${promptPreset}`);
  }

  if (port) {
    console.log(`   🔌 API port: ${port}`);
  }

  if (referenceImages.length > 0) {
    console.log(`   🎨 Reference images: ${referenceImages.length} available`);
    if (referencesPerDescription > 1) {
      console.log(`   🔄 Generating ${referencesPerDescription} variants per description`);
    }
  }

  // Load domain prompt (optional when using reference images)
  const systemPrompt = loadDomainPrompt(domain, promptPreset);
  if (!systemPrompt && referenceImages.length === 0) {
    console.log(
      `   ⚠️  Skipping - no system prompt found and no reference images`
    );
    return { domain, generated: 0, skipped: 0 };
  }

  // Load descriptions
  let descriptions = [];
  if (useStatic) {
    descriptions = descriptions.concat(loadDescriptions(domain, false, false, false));
  }
  if (useDynamic) {
    descriptions = descriptions.concat(loadDescriptions(domain, true, false, false));
  }
  if (useWithImages) {
    descriptions = descriptions.concat(loadDescriptions(domain, false, true, false));
  }
  if (useLLM) {
    descriptions = descriptions.concat(loadDescriptions(domain, false, false, true));
  }

  if (descriptions.length === 0) {
    console.log(`   ⚠️  No descriptions found`);
    return { domain, generated: 0, skipped: 0 };
  }

  // Apply limit if specified
  if (limit) {
    const shuffled = descriptions.sort(() => Math.random() - 0.5);
    descriptions = shuffled.slice(0, limit);
  }

  console.log(`   📝 Loaded ${descriptions.length} descriptions`);

  // Load image URLs for this domain if with-images mode enabled
  const imageUrls =
    useWithImages && imageUrlsDir
      ? getImageUrlsForDomain(domain, imageUrlsDir)
      : [];
  const usedUrls = new Set();

  if (useWithImages && imageUrls.length > 0) {
    console.log(`   🖼️  Loaded ${imageUrls.length} image URLs`);
  } else if (useWithImages) {
    console.log(`   ⚠️  No image URLs found - using default Unsplash URLs`);
  }

  // Create output directory for this domain
  const domainOutputDir = path.join(OUTPUT_DIR, domain);
  if (!fs.existsSync(domainOutputDir)) {
    fs.mkdirSync(domainOutputDir, { recursive: true });
  }

  // Generate widgets
  const results = [];
  let generated = 0;
  let skipped = 0;

  for (const desc of descriptions) {
    // Generate N variants per description with different reference images
    for (let refIndex = 0; refIndex < referencesPerDescription; refIndex++) {
      try {
        let userPrompt = desc.prompt;
        // Build filename with optional preset and reference variant (do this first to check if exists)
        let outputFileName = desc.id;

        // Add preset to filename if specified
        if (promptPreset) {
          outputFileName += `-${promptPreset}`;
        }

        // Add reference variant number if multiple variants per description
        if (referencesPerDescription > 1) {
          outputFileName += `-ref${refIndex + 1}`;
        }

        outputFileName += ".json";
        const outputPath = path.join(domainOutputDir, outputFileName);

        // Check if widget already exists (resume capability)
        if (fs.existsSync(outputPath)) {
          console.log(`   ⏭️  Skipping ${outputFileName} (already exists)`);
          skipped++;
          continue;
        }

        let selectedImageUrl = null;
        const aspectRatio = desc.aspectRatio || null;

        // Inject image URL if description requires it
        if (desc.requiresImage) {
          try {
            selectedImageUrl = await getRandomMegalithImage();
            if (selectedImageUrl) {
              userPrompt = enhancePromptWithImage(
                userPrompt,
                selectedImageUrl,
                desc.imagePlacement,
                aspectRatio
              );
            } else {
              console.warn(`   ⚠️  Failed to get image from Megalith for ${desc.id}`);
            }
          } catch (error) {
            console.warn(`   ⚠️  Error fetching Megalith image for ${desc.id}: ${error.message}`);
            if (imageUrls.length > 0) {
              selectedImageUrl = selectImageUrl(imageUrls, usedUrls);
              if (selectedImageUrl) {
                userPrompt = enhancePromptWithImage(
                  userPrompt,
                  selectedImageUrl,
                  desc.imagePlacement,
                  aspectRatio
                );
              }
            }
          }
        } else if (aspectRatio) {
          userPrompt = enhancePromptWithImage(userPrompt, null, null, aspectRatio);
        }

        // Generate widget
        let widget;
        let referenceImageUsed = null;

        if (referenceImages.length > 0) {
          // Use reference-guided generation
          const referenceImage = selectRandomReferenceImage(referenceImages);
          referenceImageUsed = path.basename(referenceImage);
          widget = await generateWidgetWithReference(
            systemPrompt,
            userPrompt,
            referenceImage,
            port
          );
        } else {
          // Use standard text generation
          widget = await generateWidget(systemPrompt, userPrompt, port);
        }

        // Transform widget: replace icons, fix image properties, normalize padding
        if (widget.widgetDSL && widget.widgetDSL.widget) {
          widget.widgetDSL.widget = transformGeneratedWidget(widget.widgetDSL.widget);
          widget.widgetDSL.widget = normalizePadding(widget.widgetDSL.widget);

          if (aspectRatio && widget.widgetDSL.metadata) {
            widget.widgetDSL.metadata.aspectRatio = aspectRatio;
          } else if (aspectRatio) {
            widget.widgetDSL.metadata = { aspectRatio };
          }
        } else if (widget.widget) {
          widget.widget = transformGeneratedWidget(widget.widget);
          widget.widget = normalizePadding(widget.widget);
        }

        // Save widget with metadata

        const widgetWithMetadata = {
          ...widget,
          _metadata: {
            descriptionId: desc.id,
            originalPrompt: desc.prompt,
            complexity: desc.complexity,
            ...(aspectRatio && { aspectRatio }),
            ...(promptPreset && { promptPreset }),
            ...(referencesPerDescription > 1 && { referenceVariant: refIndex + 1 }),
            ...(selectedImageUrl && {
              imageUrl: selectedImageUrl,
              imagePlacement: desc.imagePlacement,
              imageContext: desc.imageContext,
            }),
            ...(referenceImageUsed && { referenceImage: referenceImageUsed }),
            generatedAt: new Date().toISOString(),
          },
        };

        fs.writeFileSync(
          outputPath,
          JSON.stringify(widgetWithMetadata, null, 2),
          "utf-8"
        );

        results.push({
          id: desc.id,
          prompt: desc.prompt,
          complexity: desc.complexity,
          outputPath: outputFileName,
          ...(referencesPerDescription > 1 && { referenceVariant: refIndex + 1 }),
          ...(selectedImageUrl && { imageUrl: selectedImageUrl }),
          ...(referenceImageUsed && { referenceImage: referenceImageUsed }),
        });

        generated++;
      } catch (error) {
        console.error(`   ❌ Failed to generate ${desc.id} variant ${refIndex + 1}:`, error.message);
        skipped++;
      }
    }
  }

  // Save generation manifest
  // Include preset in manifest filename if specified
  const manifestFileName = promptPreset
    ? `_manifest-${promptPreset}.json`
    : "_manifest.json";
  const manifestPath = path.join(domainOutputDir, manifestFileName);
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        domain,
        promptPreset: promptPreset || "default",
        generatedAt: new Date().toISOString(),
        total: descriptions.length,
        referencesPerDescription,
        totalVariantsGenerated: generated,
        generated: generated,
        skipped,
        results,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`   ✓ Generated ${generated} widgets (${skipped} skipped)`);
  console.log(`   📁 Output: ${domainOutputDir}`);
  console.log(`   📄 Manifest: ${manifestFileName}`);

  return { domain, generated, skipped };
}

/**
 * Generate widgets for all domains
 */
async function batchGenerateAll(options = {}) {
  console.log("🚀 Starting batch widget generation...\n");
  console.log(`Limit per domain: ${options.limit || "unlimited"}`);

  // Use specified domains or default
  const domains = options.domains || DEFAULT_DOMAINS;
  console.log(`Domains to process: ${domains.join(", ")}`);

  // Load reference images if directory provided
  if (options.referenceImagesDir) {
    console.log(`Reference images directory: ${options.referenceImagesDir}`);
    options.referenceImages = loadReferenceImages(options.referenceImagesDir);
    console.log(`Loaded ${options.referenceImages.length} reference images`);
    if (options.referencesPerDescription > 1) {
      console.log(`Variants per description: ${options.referencesPerDescription}`);
    }
    console.log();
  } else {
    console.log();
  }

  const startTime = Date.now();
  const summaries = [];

  for (const domain of domains) {
    const summary = await generateWidgetsForDomain(domain, options);
    summaries.push(summary);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 BATCH GENERATION SUMMARY");
  console.log("=".repeat(60));

  const totalGenerated = summaries.reduce((sum, s) => sum + s.generated, 0);
  const totalSkipped = summaries.reduce((sum, s) => sum + s.skipped, 0);

  summaries.forEach((s) => {
    console.log(
      `${s.domain.padEnd(15)} ${String(s.generated).padStart(4)} generated, ${
        s.skipped
      } skipped`
    );
  });

  console.log("=".repeat(60));
  console.log(
    `Total: ${totalGenerated} widgets generated, ${totalSkipped} skipped`
  );
  console.log(`Duration: ${duration}s`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log("=".repeat(60));
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  const options = {
    useStatic: false, // Changed from true to false
    useDynamic: false,
    useWithImages: false,
    useLLM: false,
    limit: null,
    referenceImagesDir: null,
    imageUrlsDir: null,
    referencesPerDescription: 1, // Number of reference variants per description
    promptPreset: null,
    port: null,
    domains: null, // Will use DEFAULT_DOMAINS if not specified
    force: false, // Force regeneration even if files exist
  };

  // Check if any mode is explicitly specified
  const hasModeFlag = args.some(
    (arg) =>
      arg === "--dynamic" ||
      arg === "--with-images" ||
      arg === "--llm" ||
      arg === "--both" ||
      arg === "--all"
  );

  args.forEach((arg) => {
    if (arg === "--dynamic") options.useDynamic = true;
    if (arg === "--with-images") options.useWithImages = true;
    if (arg === "--llm") options.useLLM = true;
    if (arg === "--both") {
      options.useStatic = true;
      options.useDynamic = true;
    }
    if (arg === "--all") {
      options.useStatic = true;
      options.useDynamic = true;
      options.useWithImages = true;
      options.useLLM = true;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1]);
    }
    if (arg.startsWith("--reference-images-dir=")) {
      options.referenceImagesDir = arg.split("=")[1];
    }
    if (arg.startsWith("--image-urls-dir=")) {
      options.imageUrlsDir = arg.split("=")[1];
    }
    if (arg.startsWith("--references-per-description=")) {
      options.referencesPerDescription = parseInt(arg.split("=")[1]);
    }
    if (arg.startsWith("--prompt-preset=")) {
      options.promptPreset = arg.split("=")[1];
    }
    if (arg.startsWith("--port=")) {
      options.port = arg.split("=")[1];
    }
    if (arg.startsWith("--domains=")) {
      options.domains = arg.split("=")[1].split(",");
    }
  });

  // If no mode flag specified, default to static
  if (!hasModeFlag) {
    options.useStatic = true;
  }

  return options;
}

// Main execution
const options = parseArgs();

console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║         BATCH WIDGET GENERATION SYSTEM                    ║");
console.log("╚═══════════════════════════════════════════════════════════╝");
console.log();
console.log("Usage:");
console.log("  node batch-generate-widgets.js [options]");
console.log();
console.log("Options:");
console.log(
  "  --dynamic                      Use dynamic variations instead of static library"
);
console.log(
  "  --with-images                  Use image-focused widget descriptions"
);
console.log(
  "  --llm                          Use LLM-generated descriptions (Doubao/Qwen)"
);
console.log(
  "  --both                         Use both static and dynamic descriptions"
);
console.log(
  "  --all                          Use all sources (static + dynamic + images + llm)"
);
console.log(
  "  --limit=N                      Limit to N descriptions per domain"
);
console.log(
  "  --domains=domain1,domain2      Comma-separated list of domains to process (default: all domains)"
);
console.log(
  "  --prompt-preset=NAME           Use a specific prompt preset (e.g., apple-style, android-style, more-components)"
);
console.log(
  "  --port=PORT                    Backend API port (default: 8010)"
);
console.log(
  "  --reference-images-dir=PATH    Directory with reference images for style guidance"
);
console.log(
  "  --references-per-description=N Generate N variants per description using different references (default: 1)"
);
console.log(
  "  --image-urls-dir=PATH          Directory with image URL text files for content"
);
console.log();
console.log("Examples:");
console.log("  # Generate with static descriptions");
console.log("  node batch-generate-widgets.js --limit=5");
console.log();
console.log("  # Generate with Apple-style preset on custom port");
console.log(
  "  node batch-generate-widgets.js --prompt-preset=apple-style --port=8011 --limit=5"
);
console.log("  # Output: widget-id-apple-style.json");
console.log();
console.log("  # Generate with Android-style preset");
console.log(
  "  node batch-generate-widgets.js --prompt-preset=android-style --limit=5"
);
console.log("  # Output: widget-id-android-style.json");
console.log();
console.log("  # Generate with more-components preset");
console.log(
  "  node batch-generate-widgets.js --prompt-preset=more-components --limit=5"
);
console.log("  # Output: widget-id-more-components.json");
console.log();
console.log(
  "  # Multiple presets can be run on same domains without conflicts"
);
console.log();
console.log("  # Generate with image-focused descriptions ONLY");
console.log(
  "  node batch-generate-widgets.js --with-images --image-urls-dir=./scripts/synthesis/descriptions/image-urls --limit=10"
);
console.log();
console.log("  # Generate all types (static + dynamic + with-images)");
console.log(
  "  node batch-generate-widgets.js --all --image-urls-dir=./scripts/synthesis/descriptions/image-urls --limit=20"
);
console.log();
console.log("  # Combine reference images for style + image URLs for content");
console.log("  node batch-generate-widgets.js --with-images \\");
console.log("    --reference-images-dir=./test-reference-widgets \\");
console.log(
  "    --image-urls-dir=./scripts/synthesis/descriptions/image-urls \\"
);
console.log("    --limit=15");
console.log();
console.log("  # Generate 3 variants per description using different reference images");
console.log("  node batch-generate-widgets.js --all \\");
console.log("    --reference-images-dir=./reference-widgets \\");
console.log("    --references-per-description=3");
console.log();

batchGenerateAll(options).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
