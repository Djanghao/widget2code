/**
 * @file api.js
 * @description Public API for renderer functionality
 * Provides a simple interface for rendering widgets programmatically
 * @author Claude Code
 * @date 2025-11-03
 */

import { PlaywrightRenderer } from './PlaywrightRenderer.js';

/**
 * Singleton renderer instance
 * @type {PlaywrightRenderer | null}
 */
let rendererInstance = null;

/**
 * Initialize the renderer
 * @param {Object} options - Renderer options
 * @returns {Promise<void>}
 */
export async function initializeRenderer(options = {}) {
  if (rendererInstance) {
    throw new Error('Renderer is already initialized. Call closeRenderer() first.');
  }

  rendererInstance = new PlaywrightRenderer(options);
  await rendererInstance.initialize();
  console.log('[Renderer API] Renderer initialized successfully');
}

/**
 * Render a widget from DSL spec
 * @param {Object} spec - Widget DSL specification
 * @param {Object} options - Rendering options
 * @returns {Promise<Object>} Rendering result with validation, metadata, and image buffer
 */
export async function renderWidget(spec, options = {}) {
  if (!rendererInstance) {
    throw new Error('Renderer not initialized. Call initializeRenderer() first.');
  }

  return await rendererInstance.renderWidget(spec, options);
}

/**
 * Render a widget from JSX code
 * @param {string} jsxCode - JSX code string
 * @param {Object} options - Rendering options
 * @returns {Promise<Object>} Rendering result with validation, metadata, and image buffer
 */
export async function renderWidgetFromJSX(jsxCode, options = {}) {
  if (!rendererInstance) {
    throw new Error('Renderer not initialized. Call initializeRenderer() first.');
  }

  return await rendererInstance.renderWidgetFromJSX(jsxCode, options);
}

/**
 * Close the renderer and cleanup resources
 * @returns {Promise<void>}
 */
export async function closeRenderer() {
  if (rendererInstance) {
    await rendererInstance.close();
    rendererInstance = null;
    console.log('[Renderer API] Renderer closed successfully');
  }
}

/**
 * Get the current renderer instance (for advanced usage)
 * @returns {PlaywrightRenderer | null}
 */
export function getRendererInstance() {
  return rendererInstance;
}

/**
 * Save an image buffer to a file
 * @param {Buffer} imageBuffer - Image buffer to save
 * @param {string} outputPath - Output file path
 * @returns {Promise<void>}
 */
export async function saveImage(imageBuffer, outputPath) {
  return await PlaywrightRenderer.saveImage(imageBuffer, outputPath);
}

/**
 * Generate a filename for a rendered widget
 * @param {string} presetId - Preset identifier
 * @param {Object} metadata - Widget metadata
 * @returns {string} Generated filename
 */
export function generateFilename(presetId, metadata) {
  return PlaywrightRenderer.generateFilename(presetId, metadata);
}

/**
 * Convenience function to render a widget and save to file
 * @param {Object} spec - Widget DSL specification
 * @param {string} outputPath - Output file path
 * @param {Object} options - Rendering options
 * @returns {Promise<Object>} Rendering result
 */
export async function renderAndSave(spec, outputPath, options = {}) {
  const result = await renderWidget(spec, options);

  if (result.success) {
    await saveImage(result.imageBuffer, outputPath);
  }

  return result;
}

/**
 * Batch render multiple widgets
 * @param {Array<Object>} specs - Array of widget DSL specifications
 * @param {Object} options - Rendering options (applied to all)
 * @returns {Promise<Array<Object>>} Array of rendering results
 */
export async function batchRender(specs, options = {}) {
  if (!rendererInstance) {
    throw new Error('Renderer not initialized. Call initializeRenderer() first.');
  }

  const results = [];

  for (let i = 0; i < specs.length; i++) {
    console.log(`[Renderer API] Rendering widget ${i + 1}/${specs.length}...`);
    const result = await renderWidget(specs[i], options);
    results.push(result);
  }

  return results;
}
