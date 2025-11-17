#!/usr/bin/env node

/**
 * @file index.js
 * @description Widget Factory CLI - Unified command-line interface
 * @author Houston Zhang
 * @date 2025-10-29
 */

import { compile } from './commands/compile.js';
import { render } from './commands/render.js';
import { batchRender } from '@widget-factory/renderer';

function printHelp() {
  console.log(`
Widget Factory CLI - Unified tools for widget compilation and rendering

Usage: widget-factory <command> [options]

Commands:
  compile <dsl.json> [output.jsx]
    Compile WidgetDSL to React JSX code
    Output defaults to same directory with .jsx extension

  render <widget-directory>
    Render a single widget from its directory (DSL → JSX → PNG)
    Widget directory must contain a DSL file at artifacts/4-dsl/widget.json
    Output will be saved in the same directory

  batch-render <directory> [options]
    Batch render widgets from DSL specs in-place
    Directory must contain widget subdirectories with DSL files
    Options: --concurrency N, --force

Examples:
  widget-factory compile widget.json
  widget-factory compile widget.json custom.jsx
  widget-factory render ./results/tmp/image_0001
  widget-factory batch-render ./results/tmp
  widget-factory batch-render ./results/tmp --concurrency 5 --force

Options:
  --help, -h    Show this help message
  --version, -v Show version number
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('0.4.0');
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'compile':
        if (commandArgs.length < 1) {
          console.error('Error: compile requires <dsl-json-path> [output-jsx-path]');
          process.exit(1);
        }
        await compile(commandArgs[0], commandArgs[1]);
        break;

      case 'render':
        if (commandArgs.length < 1) {
          console.error('Error: render requires <widget-directory>');
          process.exit(1);
        }
        await render(commandArgs[0]);
        break;

      case 'batch-render':
        if (commandArgs.length < 1) {
          console.error('Error: batch-render requires <directory> [options]');
          process.exit(1);
        }
        // Parse batch-render options
        let concurrency = 3;
        let force = false;
        const directory = commandArgs[0];

        for (let i = 1; i < commandArgs.length; i++) {
          if (commandArgs[i] === '--concurrency' && commandArgs[i + 1]) {
            concurrency = parseInt(commandArgs[i + 1]);
            i++; // Skip next arg
          } else if (commandArgs[i] === '--force') {
            force = true;
          } else if (!commandArgs[i].startsWith('--')) {
            // Legacy support: bare number is concurrency
            concurrency = parseInt(commandArgs[i]) || 3;
          }
        }

        const { failedCount } = await batchRender(directory, {
          concurrency,
          force
        });
        process.exit(failedCount > 0 ? 1 : 0);
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error('Run "widget-factory --help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
