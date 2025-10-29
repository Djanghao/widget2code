#!/usr/bin/env node

/**
 * @file index.js
 * @description Widget Factory CLI - Unified command-line interface
 */

import { compile } from './commands/compile.js';
import { render } from './commands/render.js';
import { batchRender } from './commands/batch-render.js';

function printHelp() {
  console.log(`
Widget Factory CLI - Unified tools for widget compilation and rendering

Usage: widget-factory <command> [options]

Commands:
  compile <dsl.json> <output.jsx>
    Compile WidgetDSL to React JSX code

  render <input.jsx> <output.png> [dev-server-url]
    Render JSX widget to PNG image

  batch-render <input> <output> [concurrency]
    Batch render widgets from DSL specs
    Input can be a single JSON file or directory

Examples:
  widget-factory compile widget.json widget.jsx
  widget-factory render widget.jsx widget.png
  widget-factory batch-render ./widgets ./output 5

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
    console.log('0.3.0');
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'compile':
        if (commandArgs.length < 2) {
          console.error('Error: compile requires <dsl-json-path> and <output-jsx-path>');
          process.exit(1);
        }
        await compile(commandArgs[0], commandArgs[1]);
        break;

      case 'render':
        if (commandArgs.length < 2) {
          console.error('Error: render requires <jsx-file-path> and <output-png-path>');
          process.exit(1);
        }
        await render(commandArgs[0], commandArgs[1], {
          devServerUrl: commandArgs[2] || 'http://localhost:3060'
        });
        break;

      case 'batch-render':
        if (commandArgs.length < 2) {
          console.error('Error: batch-render requires <input> and <output>');
          process.exit(1);
        }
        const { failedCount } = await batchRender(commandArgs[0], commandArgs[1], {
          concurrency: parseInt(commandArgs[2]) || 3
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
