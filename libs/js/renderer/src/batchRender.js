/**
 * @file batchRender.js
 * @description Batch rendering logic for multiple widgets
 * Core business logic for batch widget rendering
 * @author Houston Zhang
 * @date 2025-11-17
 */

import { PlaywrightRenderer } from './PlaywrightRenderer.js';
import { renderSingleWidget } from './renderSingleWidget.js';
import fs from 'fs/promises';
import path from 'path';

// Track active renderers for graceful shutdown
let activeRenderers = [];
let isShuttingDown = false;
let signalHandlersRegistered = false;

/**
 * Cleanup function for graceful shutdown
 * @param {string} signal - Signal name (SIGINT, SIGTERM, etc.)
 */
async function cleanup(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n\n⚠️  Received ${signal}, cleaning up ${activeRenderers.length} renderer(s)...`);

  await Promise.allSettled(
    activeRenderers.map(r => r.close().catch(err => console.error('Cleanup error:', err.message)))
  );

  console.log('✓ Cleanup complete');
  process.exit(signal === 'SIGINT' ? 130 : 1);
}

/**
 * Register signal handlers for graceful shutdown
 * Only registers once, even if called multiple times
 */
function registerSignalHandlers() {
  if (signalHandlersRegistered) return;
  signalHandlersRegistered = true;

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
}

/**
 * Find all widget directories that need processing
 * @param {string} inputPath - Root directory to scan
 * @param {Object} options - Scan options
 * @param {boolean} options.force - Force reprocess all widgets
 * @returns {Array} Array of widget info objects
 */
async function findWidgetsToProcess(inputPath, options = {}) {
  const { force = false } = options;
  const stats = await fs.stat(inputPath);

  if (stats.isFile()) {
    throw new Error('Input must be a directory containing widget subdirectories');
  }

  if (stats.isDirectory()) {
    const widgets = [];

    // Recursively scan directories to find widget folders
    async function scanDirectory(dirPath) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const fullPath = path.join(dirPath, entry.name);
        const debugPath = path.join(fullPath, 'log', 'debug.json');
        const dslFile = path.join(fullPath, 'artifacts', '4-dsl', 'widget.json');

        const dslExists = await fs.access(dslFile).then(() => true).catch(() => false);

        if (dslExists) {
          // This is a widget directory
          const widgetId = entry.name;
          let shouldProcess = true;

          // Skip status check if force is enabled
          if (!force) {
            const outputPngPath = path.join(fullPath, 'output.png');
            const debugExists = await fs.access(debugPath).then(() => true).catch(() => false);
            const outputExists = await fs.access(outputPngPath).then(() => true).catch(() => false);

            // Only skip if both debug.json shows success AND output.png exists
            if (debugExists && outputExists) {
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
            widgets.push({ widgetId, widgetDir: fullPath, dslFile });
          }
        } else {
          // Not a widget directory, scan recursively for subdirectories
          await scanDirectory(fullPath);
        }
      }
    }

    await scanDirectory(inputPath);

    if (widgets.length === 0) {
      console.log('All widgets already processed. Use --force to reprocess.');
      return [];
    }

    return widgets;
  }

  throw new Error('Input must be a directory');
}

/**
 * Wrapper function for renderSingleWidget in batch context
 * @param {PlaywrightRenderer} renderer - Renderer instance
 * @param {Object} widgetInfo - Widget information
 * @param {Object} options - Rendering options
 * @returns {Object} Rendering result
 */
async function renderWidget(renderer, widgetInfo, options = {}) {
  const { widgetDir } = widgetInfo;
  return await renderSingleWidget(renderer, widgetDir, options);
}

/**
 * Batch render multiple widgets with concurrent processing
 * @param {string} inputPath - Directory containing widget subdirectories
 * @param {Object} options - Rendering options
 * @param {number} options.concurrency - Number of concurrent renderers (default: 3)
 * @param {string} options.devServerUrl - Dev server URL
 * @param {boolean} options.force - Force reprocess all widgets
 * @returns {Object} Results summary
 */
export async function batchRender(inputPath, options = {}) {
  const frontendPort = process.env.FRONTEND_PORT || '3060';
  const { concurrency = 3, devServerUrl = `http://localhost:${frontendPort}`, force = false } = options;

  // Register signal handlers for graceful shutdown
  registerSignalHandlers();

  console.log('🚀 Widget Factory - Batch Renderer\n');
  console.log(`Directory: ${inputPath}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Force: ${force}\n`);

  const widgets = await findWidgetsToProcess(inputPath, { force });

  if (widgets.length === 0) {
    return { results: [], successCount: 0, failedCount: 0 };
  }

  console.log(`Found ${widgets.length} widget(s) to process\n`);

  // Initialize renderers
  for (let i = 0; i < concurrency; i++) {
    const renderer = new PlaywrightRenderer({
      devServerUrl,
      timeout: 30000,
      verbose: false
    });
    await renderer.initialize();
    activeRenderers.push(renderer);
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
        const result = await renderWidget(renderer, widgetInfo, { force });
        results.push(result);
        completed++;
        console.log(`\nProgress: ${completed}/${widgets.length} (${Math.round(completed/widgets.length*100)}%)`);
      }
    }
  };

  try {
    const workers = activeRenderers.map(renderer => processWidget(renderer));
    await Promise.all(workers);
  } finally {
    // Ensure cleanup even if errors occur
    console.log('\nCleaning up renderers...');
    await Promise.allSettled(
      activeRenderers.map(r => r.close())
    );
    activeRenderers = [];
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
