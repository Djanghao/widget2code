/**
 * @file binarySearch.js
 * @description Binary search algorithm to find optimal widget size based on aspect ratio
 */

import { applySizeAndMeasure } from './utils.js';

/**
 * Finds the optimal (minimum) size that fits content for a given aspect ratio
 * Uses binary search for efficiency
 *
 * @param {HTMLElement} element - The widget element to resize
 * @param {number} aspectRatio - Target aspect ratio (width / height)
 * @param {Object} options - Configuration options
 * @param {number} options.minSize - Minimum size to try (default: 40)
 * @param {number} options.maxSize - Maximum size cap (default: 4096)
 * @param {number} options.safetyMargin - Extra pixels to add to final size (default: 1)
 * @param {Function} options.shouldContinue - Callback to check if operation should continue (default: () => true)
 * @param {Object} options.logger - Logger object with log/warn methods (default: console)
 * @returns {Promise<Object|null>} Result object with { width, height, naturalSize } or null if cancelled
 */
export async function findOptimalSize(element, aspectRatio, options = {}) {
  const {
    minSize = 40,
    maxSize = 4096,
    safetyMargin = 1,
    shouldContinue = () => true,
    logger = console
  } = options;

  const r = aspectRatio;
  if (!r) {
    logger.warn(`⚠️ [AutoResize] No aspect ratio provided`);
    return null;
  }

  if (!element) {
    logger.log(`❌ [AutoResize] No widget element`);
    return null;
  }

  const rect = element.getBoundingClientRect();
  const startW = Math.max(minSize, Math.round(rect.width));
  const startH = Math.max(minSize, Math.round(startW / r));

  logger.log(`📐 [AutoResize] Natural size: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}, Starting: ${startW}×${startH}, Ratio: ${r}`);

  if (!shouldContinue()) {
    logger.log(`🚫 [AutoResize] Token mismatch, aborting`);
    return null;
  }

  let m = await applySizeAndMeasure(element, startW, startH);
  let best = { w: startW, h: startH };

  if (!shouldContinue()) return null;

  if (m.fits) {
    logger.log(`✓ [AutoResize] Initial size fits, searching for minimum...`);
    let low = minSize;
    let high = startW;

    const lm = await applySizeAndMeasure(element, low, Math.max(minSize, Math.round(low / r)));
    if (!shouldContinue()) return null;

    if (lm.fits) {
      best = { w: low, h: Math.max(minSize, Math.round(low / r)) };
      logger.log(`✓ [AutoResize] Minimum size (${low}) already fits`);
    } else {
      while (high - low > 1) {
        if (!shouldContinue()) return null;
        const mid = Math.floor((low + high) / 2);
        const mh = Math.max(minSize, Math.round(mid / r));
        const mm = await applySizeAndMeasure(element, mid, mh);
        if (mm.fits) {
          best = { w: mid, h: mh };
          high = mid;
        } else {
          low = mid;
        }
      }
      logger.log(`✓ [AutoResize] Found minimum fitting size: ${best.w}×${best.h}`);
    }
  } else {
    logger.log(`✗ [AutoResize] Initial size too small, expanding...`);
    let low = startW;
    let high = startW;
    let mm = m;

    while (!mm.fits && high < maxSize) {
      if (!shouldContinue()) return null;
      low = high;
      high = Math.min(maxSize, high * 2);
      const hh = Math.max(minSize, Math.round(high / r));
      mm = await applySizeAndMeasure(element, high, hh);
    }

    if (mm.fits) {
      best = { w: high, h: Math.max(minSize, Math.round(high / r)) };
      logger.log(`✓ [AutoResize] Found fitting size at ${high}, searching for minimum...`);

      while (high - low > 1) {
        if (!shouldContinue()) return null;
        const mid = Math.floor((low + high) / 2);
        const mh = Math.max(minSize, Math.round(mid / r));
        const m2 = await applySizeAndMeasure(element, mid, mh);
        if (m2.fits) {
          best = { w: mid, h: mh };
          high = mid;
        } else {
          low = mid;
        }
      }
      logger.log(`✓ [AutoResize] Found minimum fitting size: ${best.w}×${best.h}`);
    } else {
      best = { w: low, h: Math.max(minSize, Math.round(low / r)) };
      logger.log(`⚠️ [AutoResize] Could not fit within max cap, using: ${best.w}×${best.h}`);
    }
  }

  if (!shouldContinue()) return null;

  const safeW = best.w + safetyMargin;
  const safeH = best.h + safetyMargin;
  logger.log(`📝 [AutoResize] Optimal size with safety margin: ${safeW}×${safeH} (${best.w}×${best.h} + ${safetyMargin}px)`);

  return {
    width: safeW,
    height: safeH,
    naturalSize: {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  };
}
