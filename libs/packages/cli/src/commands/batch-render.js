#!/usr/bin/env node

/**
 * @file batch-render.js
 * @description Batch render widgets from DSL specs
 * Workflow: DSL → Compiler → JSX → Renderer → PNG
 */

import { PlaywrightRenderer } from '@widget-factory/renderer';
import { compileWidgetDSLToJSX } from '@widget-factory/compiler';
import fs from 'fs/promises';
import path from 'path';

async function findJsonFiles(inputPath) {
  const stats = await fs.stat(inputPath);

  if (stats.isFile()) {
    if (!inputPath.endsWith('.json')) {
      throw new Error('Input file must be a JSON file');
    }
    return [inputPath];
  }

  if (stats.isDirectory()) {
    const entries = await fs.readdir(inputPath, { withFileTypes: true });
    const jsonFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => path.join(inputPath, entry.name));

    if (jsonFiles.length === 0) {
      throw new Error('No JSON files found in directory');
    }

    return jsonFiles;
  }

  throw new Error('Input must be a file or directory');
}

async function loadSpec(specPath) {
  const specData = await fs.readFile(specPath, 'utf-8');
  return JSON.parse(specData);
}

async function renderWidget(renderer, specPath, outputDir) {
  const spec = await loadSpec(specPath);
  const widgetId = path.basename(specPath, '.json');
  const widgetOutputDir = path.resolve(outputDir, widgetId);

  await fs.mkdir(widgetOutputDir, { recursive: true });

  try {
    console.log(`\n[${widgetId}] Starting render...`);

    // Step 1: Compile DSL to JSX
    console.log(`[${widgetId}] Compiling DSL to JSX...`);
    const jsx = compileWidgetDSLToJSX(spec);

    // Step 2: Render JSX to PNG
    console.log(`[${widgetId}] Rendering JSX to PNG...`);
    const result = await renderer.renderWidgetFromJSX(jsx, {
      enableAutoResize: true,
      presetId: widgetId,
      spec: spec  // Pass full spec for writebackSpecSize
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const pngPath = path.join(widgetOutputDir, `${widgetId}.png`);
    const jsonPath = path.join(widgetOutputDir, `${widgetId}.json`);
    const jsxPath = path.join(widgetOutputDir, `${widgetId}.jsx`);
    const metaPath = path.join(widgetOutputDir, 'meta.json');

    await PlaywrightRenderer.saveImage(result.imageBuffer, pngPath);
    await fs.writeFile(jsonPath, JSON.stringify(result.spec, null, 2), 'utf-8');
    await fs.writeFile(jsxPath, jsx, 'utf-8');

    const expectedAspectRatio = spec.widget?.aspectRatio;
    const actualAspectRatio = result.metadata.aspectRatio;

    let aspectRatioValid = true;
    let aspectRatioError = null;

    if (expectedAspectRatio && typeof expectedAspectRatio === 'number' && isFinite(expectedAspectRatio)) {
      const deviation = Math.abs(actualAspectRatio - expectedAspectRatio) / expectedAspectRatio;
      if (deviation > 0.05) {
        aspectRatioValid = false;
        aspectRatioError = `Aspect ratio mismatch: expected ${expectedAspectRatio.toFixed(4)}, got ${actualAspectRatio.toFixed(4)} (${(deviation * 100).toFixed(2)}% deviation)`;
      }
    }

    const metadata = {
      id: widgetId,
      timestamp: new Date().toISOString(),
      status: (result.validation.valid && aspectRatioValid) ? 'success' : 'failed',
      naturalSize: result.naturalSize,
      finalSize: result.finalSize,
      aspectRatio: {
        expected: expectedAspectRatio || null,
        actual: actualAspectRatio,
        valid: aspectRatioValid,
        error: aspectRatioError
      },
      autoResize: true,
      validation: result.validation,
      files: {
        spec: `${widgetId}.json`,
        jsx: `${widgetId}.jsx`,
        image: `${widgetId}.png`
      }
    };

    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

    if (!aspectRatioValid) {
      throw new Error(aspectRatioError);
    }

    console.log(`[${widgetId}] ✓ Success`);
    if (result.naturalSize) {
      console.log(`  Natural: ${result.naturalSize.width}×${result.naturalSize.height}`);
    }
    if (result.finalSize) {
      console.log(`  Final: ${result.finalSize.width}×${result.finalSize.height}`);
    }
    console.log(`  Rendered: ${result.metadata.width}×${result.metadata.height}`);
    console.log(`  Ratio: ${actualAspectRatio}`);

    return { success: true, widgetId, outputDir: widgetOutputDir };

  } catch (error) {
    console.error(`[${widgetId}] ✗ Failed: ${error.message}`);

    const jsonPath = path.join(widgetOutputDir, `${widgetId}.json`);
    const metaPath = path.join(widgetOutputDir, 'meta.json');
    const errorPath = path.join(widgetOutputDir, 'error.txt');

    await fs.writeFile(jsonPath, JSON.stringify(spec, null, 2), 'utf-8');

    const errorMetadata = {
      id: widgetId,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: {
        message: error.message,
        stack: null
      },
      files: {
        spec: `${widgetId}.json`,
        error: 'error.txt'
      }
    };

    await fs.writeFile(metaPath, JSON.stringify(errorMetadata, null, 2), 'utf-8');
    await fs.writeFile(errorPath, `Error: ${error.message}\n\n${error.stack || ''}`, 'utf-8');

    return { success: false, widgetId, error: error.message };
  }
}

export async function batchRender(inputPath, outputDir, options = {}) {
  const { concurrency = 3, devServerUrl = 'http://localhost:3060' } = options;

  console.log('🚀 Widget Factory - Batch Renderer\n');
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Concurrency: ${concurrency}\n`);

  const jsonFiles = await findJsonFiles(inputPath);
  console.log(`Found ${jsonFiles.length} widget spec(s)\n`);

  const renderers = [];
  for (let i = 0; i < concurrency; i++) {
    const renderer = new PlaywrightRenderer({
      devServerUrl,
      timeout: 30000,
      verbose: false
    });
    await renderer.initialize();
    renderers.push(renderer);
  }

  console.log('========================================');
  console.log('Starting rendering...');
  console.log('========================================');

  const startTime = Date.now();
  const results = [];
  const queue = [...jsonFiles];
  let completed = 0;

  const processWidget = async (renderer) => {
    while (queue.length > 0) {
      const specPath = queue.shift();
      if (specPath) {
        const result = await renderWidget(renderer, specPath, outputDir);
        results.push(result);
        completed++;
        console.log(`\nProgress: ${completed}/${jsonFiles.length} (${Math.round(completed/jsonFiles.length*100)}%)`);
      }
    }
  };

  const workers = renderers.map(renderer => processWidget(renderer));
  await Promise.all(workers);

  for (const renderer of renderers) {
    await renderer.close();
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  console.log('\n========================================');
  console.log('📊 Rendering Summary');
  console.log('========================================\n');
  console.log(`Total:    ${jsonFiles.length}`);
  console.log(`Success:  ${successCount} ✓`);
  console.log(`Failed:   ${failedCount} ✗`);
  console.log(`Duration: ${duration}s`);
  console.log(`Average:  ${(parseFloat(duration) / jsonFiles.length).toFixed(2)}s per widget`);

  if (failedCount > 0) {
    console.log('\nFailed widgets:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ✗ ${r.widgetId}: ${r.error}`);
    });
  }

  console.log(`\nOutput directory: ${outputDir}\n`);

  return { results, successCount, failedCount };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: widget-factory batch-render <input> <output> [concurrency]

Arguments:
  input         Path to widget spec JSON file or directory containing JSON files
  output        Output directory for rendered widgets
  concurrency   Number of concurrent renderers (default: 3)

Examples:
  widget-factory batch-render ./my-widget.json ./output
  widget-factory batch-render ./widgets-folder ./output 5
`);
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);
  const concurrency = parseInt(args[2]) || 3;

  batchRender(inputPath, outputDir, { concurrency })
    .then(({ failedCount }) => process.exit(failedCount > 0 ? 1 : 0))
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}
