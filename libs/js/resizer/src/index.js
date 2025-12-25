/**
 * @file index.js
 * @description Widget auto-resize utilities
 * Provides aspect-ratio-based resize with binary search optimization
 * @author Houston Zhang
 * @date 2025-10-23
 */

export { findOptimalSize } from './binarySearch.js';
export { measureOverflow } from './measureOverflow.js';
export { waitForLayoutStable, applySizeAndMeasure } from './utils.js';
export { waitForStable } from './waitForStable.js';
