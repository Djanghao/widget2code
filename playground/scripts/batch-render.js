#!/usr/bin/env node

/**
 * @file batch-render.js
 * @description CLI tool for batch widget rendering.
 * Processes multiple widgets in parallel using headless browser.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import { BatchRenderer } from './headless/BatchRenderer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printUsage() {
  console.log(`
Usage: npm run batch-render -- [options]

Options:
  --config <path>       Path to batch config JSON file (required)
  --output <path>       Override output directory
  --concurrency <num>   Override concurrency level (default: 3)
  --timeout <ms>        Override timeout in milliseconds (default: 30000)
  --report <path>       Save detailed report to JSON file
  --dev-server <url>    Dev server URL (default: http://localhost:5173)
  --verbose             Enable verbose logging
  --help                Show this help message

Examples:
  npm run batch-render -- --config config/batch-render.example.json
  npm run batch-render -- --config my-widgets.json --output ./renders --concurrency 5
  npm run batch-render -- --config batch.json --report report.json --verbose
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: null,
    output: null,
    concurrency: null,
    timeout: null,
    report: null,
    devServer: null,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--config':
        options.config = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--concurrency':
        options.concurrency = parseInt(args[++i]);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--report':
        options.report = args[++i];
        break;
      case '--dev-server':
        options.devServer = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

async function loadConfig(configPath) {
  try {
    const absolutePath = path.resolve(configPath);
    const configData = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Failed to load config file: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.config) {
    console.error('Error: --config option is required\n');
    printUsage();
    process.exit(1);
  }

  console.log('🚀 Widget Factory - Batch Renderer\n');

  const config = await loadConfig(options.config);

  if (options.output) {
    config.outputDir = options.output;
  }
  if (options.concurrency) {
    config.concurrency = options.concurrency;
  }
  if (options.timeout) {
    config.timeout = options.timeout;
  }
  if (options.devServer) {
    config.devServerUrl = options.devServer;
  }

  config.outputDir = config.outputDir || './output';
  config.concurrency = config.concurrency || 3;
  config.timeout = config.timeout || 30000;
  config.devServerUrl = config.devServerUrl || 'http://localhost:5173';

  if (!config.widgets || config.widgets.length === 0) {
    console.error('Error: Config must contain at least one widget');
    process.exit(1);
  }

  try {
    const batchRenderer = new BatchRenderer(config, {
      verbose: options.verbose
    });

    const result = await batchRenderer.processBatch();

    if (options.report) {
      const reportPath = path.resolve(options.report);
      await batchRenderer.saveReport(reportPath);
    }

    if (result.stats.failed > 0) {
      console.log('⚠️  Some widgets failed to render');
      process.exit(1);
    } else {
      console.log('✅ All widgets rendered successfully');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Batch rendering failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
