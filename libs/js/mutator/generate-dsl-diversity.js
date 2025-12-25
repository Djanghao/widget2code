#!/usr/bin/env node

import { DSLMutator } from './src/index.js';

async function runCLI() {
  const args = process.argv.slice(2);
  const options = {
    count: 10000,
    vary: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-n':
      case '--count':
        if (i + 1 < args.length) {
          options.count = parseInt(args[++i]);
        }
        break;
      case '--vary':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options.vary = args[++i];
        } else {
          options.vary = 'all';
        }
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--count=')) {
          options.count = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--vary=')) {
          options.vary = arg.split('=')[1];
        } else if (!isNaN(parseInt(arg)) && !arg.startsWith('-')) {
          options.count = parseInt(arg);
        }
        break;
    }
  }

  if (options.help) {
    console.log(`
Usage: node generate-dsl-diversity.js [count] [options]

Arguments:
  count                    Number of base DSLs to generate (default: 10000)

Options:
  --vary [type]            Generate theme/size variants
                           themes  - 5 theme variants per DSL
                           sizes   - 3 size variants per DSL
                           all     - 15 variants (5 themes x 3 sizes) per DSL
  -n, --count <number>     Alias for count argument
  -h, --help               Show this help message

Examples:
  node generate-dsl-diversity.js 100                 # 100 random DSLs
  node generate-dsl-diversity.js 100 --vary themes   # 500 DSLs (100 x 5 themes)
  node generate-dsl-diversity.js 100 --vary sizes    # 300 DSLs (100 x 3 sizes)
  node generate-dsl-diversity.js 100 --vary all      # 1500 DSLs (100 x 5 x 3)
  node generate-dsl-diversity.js 100 --vary          # same as --vary all
`);
    process.exit(0);
  }

  if (isNaN(options.count) || options.count < 1) {
    console.error('Error: count must be a positive number');
    process.exit(1);
  }

  const validVary = ['themes', 'sizes', 'all'];
  if (options.vary && !validVary.includes(options.vary)) {
    console.error(`Error: --vary must be one of: ${validVary.join(', ')}`);
    process.exit(1);
  }

  const themes = ['light', 'dark', 'colorful', 'glassmorphism', 'minimal'];
  const sizes = ['compact', 'medium', 'large'];

  const useThemes = options.vary === 'themes' || options.vary === 'all';
  const useSizes = options.vary === 'sizes' || options.vary === 'all';
  const themeCount = useThemes ? themes.length : 1;
  const sizeCount = useSizes ? sizes.length : 1;
  const totalOutput = options.count * themeCount * sizeCount;

  console.log(`DSL Mutator`);
  console.log(`  Base count: ${options.count}`);
  if (options.vary) {
    console.log(`  Vary: ${options.vary} (${themeCount} themes x ${sizeCount} sizes)`);
    console.log(`  Total output: ${totalOutput} DSLs`);
  }
  console.log('');

  try {
    const mutator = new DSLMutator();
    await mutator.initialize();

    if (options.vary) {
      await mutator.generateWithControlled(options.count, {
        themes: useThemes ? themes : [null],
        sizes: useSizes ? sizes : [null],
        mode: 'controlled'
      });
    } else {
      await mutator.generate(options.count);
    }

    await mutator.generateReport();
    console.log('');
    console.log('Done.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runCLI();
