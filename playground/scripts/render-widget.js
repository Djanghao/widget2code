#!/usr/bin/env node

/**
 * @file render-widget.js
 * @description CLI tool for single widget rendering.
 * Renders a single widget from spec or preset.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import { PlaywrightRenderer } from './headless/PlaywrightRenderer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printUsage() {
  console.log(`
Usage: npm run render -- [options]

Options:
  --spec <path>           Path to widget spec JSON file
  --preset <name>         Preset name (e.g., weatherSmallLight)
  --output <path>         Output directory (default: ./output)
  --filename <name>       Output filename (auto-generated if not specified)
  --no-autoresize         Disable auto-resize
  --dev-server <url>      Dev server URL (default: http://localhost:5173)
  --timeout <ms>          Timeout in milliseconds (default: 30000)
  --verbose               Enable verbose logging
  --help                  Show this help message

Examples:
  npm run render -- --preset weatherSmallLight
  npm run render -- --spec my-widget.json --output ./renders
  npm run render -- --preset notesSmallDark --no-autoresize --verbose
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    spec: null,
    preset: null,
    output: './output',
    filename: null,
    autoResize: true,
    devServer: 'http://localhost:5173',
    timeout: 30000,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--spec':
        options.spec = args[++i];
        break;
      case '--preset':
        options.preset = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--filename':
        options.filename = args[++i];
        break;
      case '--no-autoresize':
        options.autoResize = false;
        break;
      case '--dev-server':
        options.devServer = args[++i];
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
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

async function loadSpec(specPath) {
  try {
    const absolutePath = path.resolve(specPath);
    const specData = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(specData);
  } catch (error) {
    console.error(`Failed to load spec file: ${error.message}`);
    process.exit(1);
  }
}

async function loadPreset(presetName) {
  try {
    const examplesDir = path.resolve(process.cwd(), 'src/examples');
    const files = await fs.readdir(examplesDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const basename = path.basename(file, '.json');
      const normalized = basename.replace(/-/g, '').toLowerCase();
      const targetNormalized = presetName.replace(/-/g, '').toLowerCase();

      if (normalized === targetNormalized) {
        const presetPath = path.join(examplesDir, file);
        const presetData = await fs.readFile(presetPath, 'utf-8');
        return JSON.parse(presetData);
      }
    }

    throw new Error(`Preset not found: ${presetName}`);
  } catch (error) {
    console.error(`Failed to load preset: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.spec && !options.preset) {
    console.error('Error: Either --spec or --preset option is required\n');
    printUsage();
    process.exit(1);
  }

  console.log('🚀 Widget Factory - Single Widget Renderer\n');

  let spec;
  let presetId;

  if (options.spec) {
    console.log(`Loading spec from: ${options.spec}`);
    spec = await loadSpec(options.spec);
    presetId = path.basename(options.spec, '.json');
  } else {
    console.log(`Loading preset: ${options.preset}`);
    spec = await loadPreset(options.preset);
    presetId = options.preset;
  }

  console.log(`Auto-resize: ${options.autoResize ? 'enabled' : 'disabled'}`);
  console.log(`Dev server: ${options.devServer}`);
  console.log(`Timeout: ${options.timeout}ms\n`);

  const renderer = new PlaywrightRenderer({
    devServerUrl: options.devServer,
    timeout: options.timeout,
    verbose: options.verbose
  });

  try {
    await renderer.initialize();

    console.log('Rendering widget...\n');

    const result = await renderer.renderWidget(spec, {
      enableAutoResize: options.autoResize,
      presetId
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const filename = options.filename || PlaywrightRenderer.generateFilename(
      presetId,
      result.metadata
    );
    const outputPath = path.resolve(options.output, filename);

    await PlaywrightRenderer.saveImage(result.imageBuffer, outputPath);

    console.log('\n✅ Rendering completed successfully\n');
    console.log('Details:');
    console.log(`  Natural size: ${result.naturalSize.width}×${result.naturalSize.height}`);
    console.log(`  Final size:   ${result.finalSize.width}×${result.finalSize.height}`);
    console.log(`  Aspect ratio: ${result.metadata.aspectRatio}`);
    console.log(`  Validation:   ${result.validation.valid ? '✓ PASSED' : '✗ FAILED'}`);

    if (!result.validation.valid) {
      console.log('\nValidation issues:');
      result.validation.issues.forEach(issue => {
        console.log(`  ✗ ${issue}`);
      });
    }

    if (result.validation.warnings.length > 0) {
      console.log('\nValidation warnings:');
      result.validation.warnings.forEach(warning => {
        console.log(`  ⚠ ${warning}`);
      });
    }

    console.log(`\nOutput: ${outputPath}\n`);

  } catch (error) {
    console.error('\n❌ Rendering failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await renderer.close();
  }
}

main();
