import fs from "fs";
import path from "path";
import { validate } from "@widget-factory/validator";

import { loadConfig, getProjectRoot } from "./config/index.js";
import { RandomMutator } from "./mutators/random-mutator.js";
import { ThemeMutator } from "./mutators/theme-mutator.js";
import { hashDSL, generateRunId, createDefaultSeedDSL } from "./utils/index.js";
import { saveDSL, generateReport } from "./persistence/index.js";

export class DSLMutator {
  constructor() {
    this.palette = null;
    this.rulebook = null;
    this.randomMutator = null;
    this.themeMutator = null;
    this.seedDSLs = [];
    this.generatedDSLs = new Set();
    this.projectRoot = null;
    this.currentRunId = null;
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
        styleMutations: 0,
      },
    };
  }

  async initialize() {
    console.log("Initializing DSL Mutator...");

    const { palette, rulebook } = loadConfig();
    this.palette = palette;
    this.rulebook = rulebook;
    this.projectRoot = getProjectRoot();

    this.randomMutator = new RandomMutator(palette);
    this.themeMutator = new ThemeMutator(palette);

    console.log("Loaded mutation palette and validation rulebook");

    await this.loadSeedDSLs();
    console.log(`Loaded ${this.seedDSLs.length} seed DSLs`);

    if (this.seedDSLs.length === 0) {
      console.log("No seed DSLs loaded, creating default seed DSL");
      this.seedDSLs.push(createDefaultSeedDSL());
      const hash = hashDSL(this.seedDSLs[0]);
      this.generatedDSLs.add(hash);
    }

    console.log("Mutator initialized successfully!");
  }

  async loadSeedDSLs() {
    const examplesDir = path.join(this.projectRoot, "output/2-mutator/seeds");

    try {
      if (!fs.existsSync(examplesDir)) {
        console.warn(`Examples directory does not exist: ${examplesDir}`);
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

          if (this.isValid(dsl)) {
            this.seedDSLs.push(dsl);
            const hash = hashDSL(dsl);
            this.generatedDSLs.add(hash);
          }
        } catch (error) {
          console.warn(`Skipping ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.warn(`Could not load examples directory: ${error.message}`);
    }
  }

  async generate(targetCount = 10000) {
    if (!Number.isInteger(targetCount) || targetCount <= 0) {
      throw new Error(
        `Invalid targetCount: must be positive integer, got ${targetCount}`
      );
    }

    console.log(`Starting generation of ${targetCount} synthetic DSLs...`);

    const startTime = Date.now();
    const runId = generateRunId();
    this.currentRunId = runId;

    while (this.stats.valid < targetCount) {
      this.stats.attempted++;

      const seedDSL = this.pickRandomSeed();
      const seedHash = hashDSL(seedDSL);

      const mutationResult = this.randomMutator.mutate(seedDSL);

      this.trackMutationStats(mutationResult.mutations);

      if (this.isValid(mutationResult.dsl)) {
        const hash = hashDSL(mutationResult.dsl);
        if (!this.generatedDSLs.has(hash)) {
          this.generatedDSLs.add(hash);
          this.stats.valid++;

          saveDSL(
            {
              id: this.stats.valid,
              runId: runId,
              seedHash: seedHash,
              seedDSL: seedDSL,
              mutations: mutationResult.mutations,
              resultDSL: mutationResult.dsl,
              hash: hash,
              generatedAt: new Date().toISOString(),
            },
            this.projectRoot,
            runId
          );

          if (this.stats.valid % 100 === 0) {
            const progress = ((this.stats.valid / targetCount) * 100).toFixed(1);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (this.stats.valid / elapsed).toFixed(1);
            console.log(
              `Progress: ${progress}% (${this.stats.valid}/${targetCount}) - Rate: ${rate} DSL/sec`
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
    console.log(`\nGeneration completed in ${totalTime.toFixed(1)}s!`);
    this.printStats(targetCount, totalTime);

    return this.stats;
  }

  async generateWithControlled(targetCount, options = {}) {
    if (!Number.isInteger(targetCount) || targetCount <= 0) {
      throw new Error(
        `Invalid targetCount: must be positive integer, got ${targetCount}`
      );
    }

    const { themes = [null], sizes = [null], mode = "hybrid" } = options;

    console.log(`Starting controlled generation of ${targetCount} base DSLs...`);
    console.log(`   Themes: ${themes.filter((t) => t).join(", ") || "none"}`);
    console.log(`   Sizes: ${sizes.filter((s) => s).join(", ") || "none"}`);
    console.log(`   Mode: ${mode}`);

    const startTime = Date.now();
    const runId = generateRunId();
    this.currentRunId = runId;

    const totalVariants = targetCount * themes.length * sizes.length;
    let variantsGenerated = 0;

    for (let i = 0; i < targetCount; i++) {
      const seedDSL = this.pickRandomSeed();
      const seedHash = hashDSL(seedDSL);

      for (const theme of themes) {
        for (const size of sizes) {
          this.stats.attempted++;

          const controlledResult = this.themeMutator.applyControlledMutation(
            seedDSL,
            { theme, size, mode }
          );

          let finalDSL = controlledResult.dsl;
          let allMutations = [...controlledResult.mutations];

          if (controlledResult.requiresRandomMutation) {
            const randomResult = this.randomMutator.mutate(finalDSL);
            finalDSL = randomResult.dsl;
            randomResult.mutations.forEach((m) => {
              m.step = allMutations.length + 1;
              allMutations.push(m);
            });
            this.trackMutationStats(randomResult.mutations);
          }

          if (this.isValid(finalDSL)) {
            const hash = hashDSL(finalDSL);
            if (!this.generatedDSLs.has(hash)) {
              this.generatedDSLs.add(hash);
              this.stats.valid++;
              variantsGenerated++;

              saveDSL(
                {
                  id: this.stats.valid,
                  runId: runId,
                  seedHash: seedHash,
                  seedDSL: seedDSL,
                  mutations: allMutations,
                  resultDSL: finalDSL,
                  hash: hash,
                  generatedAt: new Date().toISOString(),
                  controlled: {
                    theme: theme,
                    size: size,
                    mode: mode,
                  },
                },
                this.projectRoot,
                runId
              );

              if (variantsGenerated % 100 === 0) {
                const progress = (
                  (variantsGenerated / totalVariants) *
                  100
                ).toFixed(1);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const rate = (variantsGenerated / elapsed).toFixed(1);
                console.log(
                  `Progress: ${progress}% (${variantsGenerated}/${totalVariants}) - Rate: ${rate} DSL/sec`
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
    console.log(`\nControlled generation completed in ${totalTime.toFixed(1)}s!`);
    console.log(`   Base seeds: ${targetCount}`);
    console.log(`   Variants per seed: ${themes.length * sizes.length}`);
    console.log(`   Total generated: ${variantsGenerated}`);
    this.printStats(totalVariants, totalTime);

    return this.stats;
  }

  trackMutationStats(mutations) {
    for (const mutation of mutations) {
      if (this.stats.mutations[mutation.type] !== undefined) {
        this.stats.mutations[mutation.type]++;
      }
    }
  }

  printStats(targetCount, totalTime) {
    console.log(`Final Stats:`);
    console.log(`   Total Attempts: ${this.stats.attempted}`);
    console.log(`   Valid Generated: ${this.stats.valid}`);
    console.log(`   Invalid: ${this.stats.invalid}`);
    console.log(`   Duplicates: ${this.stats.duplicates}`);

    const successRate =
      this.stats.attempted > 0
        ? ((this.stats.valid / this.stats.attempted) * 100).toFixed(1)
        : "0.0";
    console.log(`   Success Rate: ${successRate}%`);

    const genRate =
      totalTime > 0 ? (this.stats.valid / totalTime).toFixed(1) : "0.0";
    console.log(`   Generation Rate: ${genRate} DSL/sec`);

    console.log(`\nMutation Distribution:`);
    for (const [type, count] of Object.entries(this.stats.mutations)) {
      const percentage =
        this.stats.valid > 0 ? ((count / this.stats.valid) * 100).toFixed(1) : "0.0";
      console.log(`   ${type}: ${count} (${percentage}%)`);
    }
  }

  pickRandomSeed() {
    const randomIndex = Math.floor(Math.random() * this.seedDSLs.length);
    return JSON.parse(JSON.stringify(this.seedDSLs[randomIndex]));
  }

  isValid(dsl) {
    try {
      const result = validate(dsl);
      return result.canCompile;
    } catch (error) {
      return false;
    }
  }

  async generateReport() {
    return generateReport(
      this.stats,
      this.palette,
      this.rulebook,
      this.projectRoot,
      this.currentRunId
    );
  }
}

export default DSLMutator;
