/**
 * @file utils.js
 * @description Utility functions for widget resizing operations
 */

import { measureOverflow } from './measureOverflow.js';

/**
 * Waits for layout to stabilize using requestAnimationFrame
 * @returns {Promise<void>}
 */
export async function waitForLayoutStable() {
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
}

/**
 * Applies size to element and measures overflow after layout stabilizes
 * @param {HTMLElement} element - The element to resize and measure
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {Promise<Object>} Measurement result from measureOverflow
 */
export async function applySizeAndMeasure(element, width, height) {
  if (!element) return { fits: false };

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  await waitForLayoutStable();
  const m = measureOverflow(element);
  return m;
}
