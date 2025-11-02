#!/usr/bin/env node

/**
 * @file batch-render.js
 * @description Batch render widgets from DSL specs (DSL → Compiler → JSX → Renderer → PNG)
 * @author Houston Zhang
 * @date 2025-10-29
 */

import { PlaywrightRenderer } from '@widget-factory/renderer';
import { compileWidgetDSLToJSX } from '@widget-factory/compiler';
import { validateAndFix } from '@widget-factory/validator';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function findWidgetsToProcess(inputPath, options = {}) {
  const { force = false } = options;
  const stats = await fs.stat(inputPath);

  if (stats.isFile()) {
    throw new Error('Input must be a directory containing widget subdirectories');
  }

  if (stats.isDirectory()) {
    const entries = await fs.readdir(inputPath, { withFileTypes: true });
    const widgets = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const widgetDir = path.join(inputPath, entry.name);
      const widgetId = entry.name;
      const debugPath = path.join(widgetDir, 'log', 'debug.json');
      const dslFile = path.join(widgetDir, 'artifacts', '4-dsl', 'widget.json');

      const dslExists = await fs.access(dslFile).then(() => true).catch(() => false);
      if (!dslExists) continue;

      let shouldProcess = true;

      // Skip status check if force is enabled
      if (!force) {
        const debugExists = await fs.access(debugPath).then(() => true).catch(() => false);
        if (debugExists) {
          try {
            const debugData = JSON.parse(await fs.readFile(debugPath, 'utf-8'));
            const renderingStep = debugData.steps?.rendering;

            if (renderingStep && renderingStep.status === 'success') {
              shouldProcess = false;
            }
          } catch (error) {
            console.warn(`[${widgetId}] Warning: Failed to read debug.json, will process`);
          }
        }
      }

      if (shouldProcess) {
        widgets.push({ widgetId, widgetDir, dslFile });
      }
    }

    if (widgets.length === 0) {
      console.log('All widgets already processed. Use --force to reprocess.');
      return [];
    }

    return widgets;
  }

  throw new Error('Input must be a directory');
}

async function loadSpec(specPath) {
  const specData = await fs.readFile(specPath, 'utf-8');
  return JSON.parse(specData);
}

async function renderWidget(renderer, widgetInfo) {
  const { widgetId, widgetDir, dslFile } = widgetInfo;

  // New directory structure paths
  const debugPath = path.join(widgetDir, 'log', 'debug.json');
  const logFilePath = path.join(widgetDir, 'log', 'log');
  const compilationDir = path.join(widgetDir, 'artifacts', '5-compilation');
  const renderingDir = path.join(widgetDir, 'artifacts', '6-rendering');
  const jsxPath = path.join(compilationDir, 'widget.jsx');
  const outputPngPath = path.join(widgetDir, 'output.png');

  // Create directories
  await fs.mkdir(compilationDir, { recursive: true });
  await fs.mkdir(renderingDir, { recursive: true });

  let debugData = {
    widgetId,
    steps: {},
    files: {},
    metadata: {
      version: '0.4.0',
      pipeline: 'full'
    }
  };

  const debugExists = await fs.access(debugPath).then(() => true).catch(() => false);
  if (debugExists) {
    try {
      debugData = JSON.parse(await fs.readFile(debugPath, 'utf-8'));
      if (!debugData.steps) debugData.steps = {};
      if (!debugData.files) debugData.files = {};
      if (!debugData.metadata) debugData.metadata = {};
      debugData.metadata.pipeline = 'full';
    } catch (error) {
      console.warn(`[${widgetId}] Warning: Failed to read existing debug.json`);
    }
  }

  const compilationStartTime = new Date();

  try {
    console.log(`\n[${widgetId}] Starting compilation and rendering...`);

    const spec = await loadSpec(dslFile);

    const validation = validateAndFix(spec);
    if (validation.changes && validation.changes.length > 0) {
      console.log(`[${widgetId}] ⚠️  Auto-fixed ${validation.changes.length} issue(s):`);
      validation.changes.forEach(change => console.log(`  - ${change}`));
    }
    if (validation.warnings && validation.warnings.length > 0) {
      console.log(`[${widgetId}] ⚠️  Warnings:`);
      validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    if (!validation.canCompile) {
      throw new Error(`DSL validation failed: ${validation.errors.join(', ')}`);
    }

    const finalSpec = validation.fixed || spec;

    console.log(`[${widgetId}] Compiling DSL to JSX...`);
    const jsx = compileWidgetDSLToJSX(finalSpec);
    await fs.writeFile(jsxPath, jsx, 'utf-8');

    const compilationEndTime = new Date();
    const compilationDuration = (compilationEndTime - compilationStartTime) / 1000;

    debugData.steps.compilation = {
      status: 'success',
      startTime: compilationStartTime.toISOString(),
      endTime: compilationEndTime.toISOString(),
      duration: compilationDuration,
      output: {
        jsxFile: 'artifacts/5-compilation/widget.jsx',
        validation: {
          changes: validation.changes || [],
          warnings: validation.warnings || []
        }
      },
      error: null
    };

    console.log(`[${widgetId}] Rendering JSX to PNG (multiple versions)...`);
    const renderingStartTime = new Date();

    // Step 1: Render RAW version (natural layout, no autoresize)
    console.log(`[${widgetId}] - Rendering RAW (natural layout)...`);
    const rawResult = await renderer.renderWidgetFromJSX(jsx, {
      enableAutoResize: false,
      presetId: widgetId,
      spec: finalSpec
    });

    if (!rawResult.success) {
      throw new Error(`RAW render failed: ${rawResult.error}`);
    }

    const rawPath = path.join(renderingDir, '6.1-raw.png');
    await PlaywrightRenderer.saveImage(rawResult.imageBuffer, rawPath);
    console.log(`[${widgetId}] ✓ RAW: ${rawResult.metadata.width}×${rawResult.metadata.height}`);

    // Step 2: Render AUTORESIZE version (with autoresize enabled)
    console.log(`[${widgetId}] - Rendering AUTORESIZE...`);
    const result = await renderer.renderWidgetFromJSX(jsx, {
      enableAutoResize: true,
      presetId: widgetId,
      spec: finalSpec
    });

    if (!result.success) {
      throw new Error(`AUTORESIZE render failed: ${result.error}`);
    }

    const autoresizePath = path.join(renderingDir, '6.2-autoresize.png');
    await PlaywrightRenderer.saveImage(result.imageBuffer, autoresizePath);
    console.log(`[${widgetId}] ✓ AUTORESIZE: ${result.metadata.width}×${result.metadata.height}`);

    // Save the output PNG (same as autoresize)
    await PlaywrightRenderer.saveImage(result.imageBuffer, outputPngPath);
    await fs.writeFile(dslFile, JSON.stringify(result.spec, null, 2), 'utf-8');

    // Step 3: Create RESCALED version (resize to match original image size)
    const rescaledPath = path.join(renderingDir, '6.3-rescale.png');
    try {
      // Find original image file (should be at artifacts/1-preprocess/1.1-original.png)
      const originalPath = path.join(widgetDir, 'artifacts', '1-preprocess', '1.1-original.png');
      const originalExists = await fs.access(originalPath).then(() => true).catch(() => false);

      if (originalExists) {
        const originalMeta = await sharp(originalPath).metadata();

        // Resize autoresize PNG to match original dimensions
        await sharp(autoresizePath)
          .resize(originalMeta.width, originalMeta.height, {
            fit: 'fill',
            kernel: sharp.kernel.lanczos3
          })
          .png()
          .toFile(rescaledPath);

        console.log(`[${widgetId}] ✓ RESCALED: ${originalMeta.width}×${originalMeta.height}`);
      } else {
        console.warn(`[${widgetId}] ⚠️  Original image not found, skipping rescale`);
      }
    } catch (rescaleError) {
      console.warn(`[${widgetId}] ⚠️  Failed to create rescaled image: ${rescaleError.message}`);
    }

    const renderingEndTime = new Date();
    const renderingDuration = (renderingEndTime - renderingStartTime) / 1000;

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

    debugData.steps.rendering = {
      status: aspectRatioValid ? 'success' : 'failed',
      startTime: renderingStartTime.toISOString(),
      endTime: renderingEndTime.toISOString(),
      duration: renderingDuration,
      output: {
        naturalSize: result.naturalSize,
        finalSize: result.finalSize,
        aspectRatio: {
          expected: expectedAspectRatio || null,
          actual: actualAspectRatio,
          valid: aspectRatioValid,
          error: aspectRatioError
        },
        validation: result.validation
      },
      error: aspectRatioError ? { message: aspectRatioError, type: 'AspectRatioError' } : null
    };

    // Update files section in debug.json
    if (!debugData.files.artifacts) debugData.files.artifacts = {};
    debugData.files.artifacts['5_compilation'] = {
      jsx: 'artifacts/5-compilation/widget.jsx'
    };
    debugData.files.artifacts['6_rendering'] = {
      raw: 'artifacts/6-rendering/6.1-raw.png',
      autoresize: 'artifacts/6-rendering/6.2-autoresize.png',
      rescale: 'artifacts/6-rendering/6.3-rescale.png'
    };
    debugData.files.output = 'output.png';

    await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8');

    // Append to log file
    const logTimestamp = new Date().toISOString();
    const logEntry = `[${logTimestamp}] [${widgetId}] Compilation: ${compilationDuration.toFixed(2)}s | Rendering: ${renderingDuration.toFixed(2)}s | Status: ${aspectRatioValid ? 'SUCCESS' : 'FAILED'}\n`;
    await fs.appendFile(logFilePath, logEntry, 'utf-8');

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
    console.log(`  Ratio: ${actualAspectRatio.toFixed(4)}`);

    return { success: true, widgetId, widgetDir };

  } catch (error) {
    console.error(`[${widgetId}] ✗ Failed: ${error.message}`);

    const errorEndTime = new Date();
    const errorPath = path.join(widgetDir, 'log', 'error.txt');

    if (!debugData.steps.compilation) {
      const compilationDuration = (errorEndTime - compilationStartTime) / 1000;
      debugData.steps.compilation = {
        status: 'failed',
        startTime: compilationStartTime.toISOString(),
        endTime: errorEndTime.toISOString(),
        duration: compilationDuration,
        error: {
          message: error.message,
          type: error.constructor.name
        }
      };
    } else if (!debugData.steps.rendering) {
      const renderingDuration = (errorEndTime - new Date(debugData.steps.compilation.endTime)) / 1000;
      debugData.steps.rendering = {
        status: 'failed',
        startTime: debugData.steps.compilation.endTime,
        endTime: errorEndTime.toISOString(),
        duration: renderingDuration,
        error: {
          message: error.message,
          type: error.constructor.name
        }
      };
    }

    await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), 'utf-8');
    await fs.writeFile(errorPath, `Error: ${error.message}\n\n${error.stack || ''}`, 'utf-8');

    // Append error to log file
    const logTimestamp = new Date().toISOString();
    const logEntry = `[${logTimestamp}] [${widgetId}] ERROR: ${error.message}\n`;
    await fs.appendFile(logFilePath, logEntry, 'utf-8').catch(() => {});

    return { success: false, widgetId, error: error.message };
  }
}

export async function batchRender(inputPath, options = {}) {
  const { concurrency = 3, devServerUrl = 'http://localhost:3060', force = false } = options;

  console.log('🚀 Widget Factory - Batch Renderer\n');
  console.log(`Directory: ${inputPath}`);
  console.log(`Concurrency: ${concurrency}\n`);

  const widgets = await findWidgetsToProcess(inputPath, { force });

  if (widgets.length === 0) {
    return { results: [], successCount: 0, failedCount: 0 };
  }

  console.log(`Found ${widgets.length} widget(s) to process\n`);

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
  console.log('Starting compilation and rendering...');
  console.log('========================================');

  const startTime = Date.now();
  const results = [];
  const queue = [...widgets];
  let completed = 0;

  const processWidget = async (renderer) => {
    while (queue.length > 0) {
      const widgetInfo = queue.shift();
      if (widgetInfo) {
        const result = await renderWidget(renderer, widgetInfo);
        results.push(result);
        completed++;
        console.log(`\nProgress: ${completed}/${widgets.length} (${Math.round(completed/widgets.length*100)}%)`);
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
  console.log(`Total:    ${widgets.length}`);
  console.log(`Success:  ${successCount} ✓`);
  console.log(`Failed:   ${failedCount} ✗`);
  console.log(`Duration: ${duration}s`);
  console.log(`Average:  ${(parseFloat(duration) / widgets.length).toFixed(2)}s per widget`);

  if (failedCount > 0) {
    console.log('\nFailed widgets:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ✗ ${r.widgetId}: ${r.error}`);
    });
  }

  console.log();

  return { results, successCount, failedCount };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Usage: widget-factory batch-render <directory> [options]

Arguments:
  directory     Path to directory containing widget subdirectories with DSL files

Options:
  --concurrency N   Number of concurrent renderers (default: 3)
  --force           Force reprocess all widgets, even if already completed

Description:
  Process widgets in-place within their own subdirectories.
  Each widget subdirectory must contain a {widgetId}.json DSL file.
  Renders will be saved in the same subdirectory.

Examples:
  widget-factory batch-render ./widgets
  widget-factory batch-render ./widgets --concurrency 5
  widget-factory batch-render ./widgets --force
  widget-factory batch-render ./widgets --concurrency 1 --force
`);
    process.exit(1);
  }

  // Parse arguments
  const inputPath = path.resolve(args[0]);
  let concurrency = 3;
  let force = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[i + 1]);
      i++; // Skip next arg
    } else if (args[i] === '--force') {
      force = true;
    } else if (!args[i].startsWith('--')) {
      // Legacy support: bare number is concurrency
      concurrency = parseInt(args[i]) || 3;
    }
  }

  batchRender(inputPath, { concurrency, force })
    .then(({ failedCount }) => process.exit(failedCount > 0 ? 1 : 0))
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}
