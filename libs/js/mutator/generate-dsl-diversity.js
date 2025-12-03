#!/usr/bin/env node

import DSLDiversityGenerator from './dsl-generator.js';

/**
 * CLI script for DSL diversity generation
 */
async function runCLI() {
  console.log('🎯 DSL Diversity Generation CLI');
  console.log('================================');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    targetCount: 10000,
    theme: null,
    size: null,
    mode: 'random',
    matrix: false,
    allThemes: false,
    allSizes: false,
    matchSeeds: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-n':
      case '--count':
        if (i + 1 < args.length) {
          options.targetCount = parseInt(args[++i]);
        }
        break;
      case '--theme':
        if (i + 1 < args.length) {
          options.theme = args[++i];
        }
        break;
      case '--size':
        if (i + 1 < args.length) {
          options.size = args[++i];
        }
        break;
      case '--mode':
        if (i + 1 < args.length) {
          options.mode = args[++i];
        }
        break;
      case '--matrix':
        options.matrix = true;
        break;
      case '--all-themes':
        options.allThemes = true;
        break;
      case '--all-sizes':
        options.allSizes = true;
        break;
      case '--match-seeds':
        options.matchSeeds = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--count=')) {
          const countValue = arg.split('=')[1];
          if (countValue) {
            options.targetCount = parseInt(countValue);
          }
        } else if (arg.startsWith('--theme=')) {
          options.theme = arg.split('=')[1];
        } else if (arg.startsWith('--size=')) {
          options.size = arg.split('=')[1];
        } else if (arg.startsWith('--mode=')) {
          options.mode = arg.split('=')[1];
        } else if (!isNaN(parseInt(arg))) {
          // Support bare number argument
          options.targetCount = parseInt(arg);
        }
        break;
    }
  }

  // Show help
  if (options.help) {
    console.log(`
Usage: node generate-dsl-diversity.js [options]

Options:
  -n, --count <number>     Number of DSLs to generate (default: 10000)
  --match-seeds            Use the number of seed DSLs as the count (overrides --count)
  --theme <name>           Apply theme transformation: light, dark, colorful, glassmorphism, minimal
  --size <name>            Apply size variant: compact, medium, large
  --mode <name>            Mutation mode: random (default), controlled, hybrid
  --matrix                 Generate all theme × size combinations
  --all-themes             Generate all theme variants
  --all-sizes              Generate all size variants
  -h, --help               Show this help message

Mutation Modes:
  random      Only random mutations (default behavior)
  controlled  Only theme/size transformations (no random mutations)
  hybrid      Theme/size transformations + random mutations

Examples:
  # Generate 10,000 random DSLs (default)
  node generate-dsl-diversity.js

  # Generate 100 dark mode variants
  node generate-dsl-diversity.js --count 100 --theme dark --mode controlled

  # Generate 100 dark + large with random mutations
  node generate-dsl-diversity.js --count 100 --theme dark --size large --mode hybrid

  # Generate all theme variants (5 themes × 100 = 500 DSLs)
  node generate-dsl-diversity.js --count 100 --all-themes --mode hybrid

  # Matrix generation: all combinations (5 themes × 3 sizes × 100 = 1500 DSLs)
  node generate-dsl-diversity.js --count 100 --matrix
`);
    process.exit(0);
  }

  // Validate target count
  if (isNaN(options.targetCount) || options.targetCount < 1) {
    console.error('❌ Invalid count. Please provide a positive number.');
    process.exit(1);
  }

  // Validate theme
  const validThemes = ['light', 'dark', 'colorful', 'glassmorphism', 'minimal'];
  if (options.theme && !validThemes.includes(options.theme)) {
    console.error(`❌ Invalid theme: ${options.theme}`);
    console.error(`   Valid themes: ${validThemes.join(', ')}`);
    process.exit(1);
  }

  // Validate size
  const validSizes = ['compact', 'medium', 'large'];
  if (options.size && !validSizes.includes(options.size)) {
    console.error(`❌ Invalid size: ${options.size}`);
    console.error(`   Valid sizes: ${validSizes.join(', ')}`);
    process.exit(1);
  }

  // Validate mode
  const validModes = ['random', 'controlled', 'hybrid'];
  if (!validModes.includes(options.mode)) {
    console.error(`❌ Invalid mode: ${options.mode}`);
    console.error(`   Valid modes: ${validModes.join(', ')}`);
    process.exit(1);
  }

  // Calculate actual target count for matrix mode
  let actualTargetCount = options.targetCount;
  if (options.matrix || options.allThemes || options.allSizes) {
    const themeCount = options.matrix || options.allThemes ? validThemes.length : 1;
    const sizeCount = options.matrix || options.allSizes ? validSizes.length : 1;
    actualTargetCount = options.targetCount * themeCount * sizeCount;
  }

  console.log(`🎯 Generation Plan:`);
  console.log(`   Target: ${options.targetCount} base DSLs`);
  if (options.theme) console.log(`   Theme: ${options.theme}`);
  if (options.size) console.log(`   Size: ${options.size}`);
  console.log(`   Mode: ${options.mode}`);
  if (options.matrix || options.allThemes || options.allSizes) {
    const themeCount = options.matrix || options.allThemes ? validThemes.length : 1;
    const sizeCount = options.matrix || options.allSizes ? validSizes.length : 1;
    console.log(`   Variants: ${themeCount} themes × ${sizeCount} sizes = ${themeCount * sizeCount} variants per DSL`);
    console.log(`   Total DSLs to generate: ${actualTargetCount}`);
  }
  console.log('');

  try {
    const generator = new DSLDiversityGenerator();
    await generator.initialize();

    // If --match-seeds is enabled, use the seed count
    if (options.matchSeeds) {
      options.targetCount = generator.seedDSLs.length;
      console.log(`📊 Using seed count as target: ${options.targetCount} DSLs`);
      console.log('');
    }

    // Determine which themes and sizes to use
    const themes = options.matrix || options.allThemes
      ? ['light', 'dark', 'colorful', 'glassmorphism', 'minimal']
      : options.theme ? [options.theme] : [null];

    const sizes = options.matrix || options.allSizes
      ? ['compact', 'medium', 'large']
      : options.size ? [options.size] : [null];

    // Generate DSLs with controlled mutations
    if (themes[0] !== null || sizes[0] !== null) {
      await generator.generateWithControlled(options.targetCount, {
        themes,
        sizes,
        mode: options.mode
      });
    } else {
      // Standard random generation
      await generator.generate(options.targetCount);
    }

    await generator.generateReport();

    console.log('');
    console.log('🎉 DSL diversity generation completed successfully!');
    console.log('');
    console.log('📁 Output files:');
    console.log('   libs/js/mutator/results/[RUN-ID]/batch-*.json - Generated DSL batches');
    console.log('   libs/js/mutator/results/[RUN-ID]/generation-report.json - Final report');

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the CLI
runCLI();