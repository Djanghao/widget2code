/**
 * Coordinate utilities for VQA dataset generation
 * Follows UI-UG paper conventions: normalized to 0-1000 range
 */

/**
 * Normalize pixel coordinates to 0-1000 range
 * @param {number} value - Pixel coordinate value
 * @param {number} dimension - Image dimension (width or height)
 * @returns {number} Normalized coordinate in 0-1000 range
 */
export function normalizeCoordinate(value, dimension) {
  if (!Number.isFinite(dimension) || dimension <= 0) {
    throw new Error(`Invalid dimension: must be positive finite number, got ${dimension}`);
  }
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid value: must be finite number, got ${value}`);
  }
  return Math.round((value / dimension) * 1000);
}

/**
 * Convert bounding box from (x, y, width, height) to (xmin, ymin, xmax, ymax)
 * and normalize to 0-1000 range
 * @param {Object} bbox - Bounding box with x, y, width, height
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {Object} Normalized bounding box {xmin, ymin, xmax, ymax}
 */
export function normalizeBoundingBox(bbox, imageWidth, imageHeight) {
  if (!bbox || typeof bbox !== 'object') {
    throw new Error('Invalid bbox: expected object');
  }
  if (bbox.x === undefined || bbox.y === undefined ||
      bbox.width === undefined || bbox.height === undefined) {
    throw new Error('Invalid bbox: missing required properties (x, y, width, height)');
  }
  if (bbox.width <= 0 || bbox.height <= 0) {
    throw new Error(
      `Invalid bbox: width and height must be positive (width: ${bbox.width}, height: ${bbox.height})`
    );
  }

  const x1 = bbox.x;
  const y1 = bbox.y;
  const x2 = bbox.x + bbox.width;
  const y2 = bbox.y + bbox.height;

  if (x1 < 0 || y1 < 0 || x2 > imageWidth || y2 > imageHeight) {
    throw new Error(
      `Bbox out of bounds: [${x1}, ${y1}, ${x2}, ${y2}] exceeds image dimensions [${imageWidth}, ${imageHeight}]`
    );
  }

  const xmin = normalizeCoordinate(x1, imageWidth);
  const ymin = normalizeCoordinate(y1, imageHeight);
  const xmax = normalizeCoordinate(x2, imageWidth);
  const ymax = normalizeCoordinate(y2, imageHeight);

  if (xmin >= xmax || ymin >= ymax) {
    throw new Error(
      `Invalid normalized bbox: x1 must be < x2, y1 must be < y2 (got [${xmin}, ${ymin}, ${xmax}, ${ymax}])`
    );
  }

  return { xmin, ymin, xmax, ymax };
}

/**
 * Format bounding box as array for Qwen3-VL
 * Format: [x1, y1, x2, y2] in [0, 1000] range
 * @param {Object} normalizedBox - Normalized bounding box {xmin, ymin, xmax, ymax}
 * @returns {Array<number>} Formatted bounding box array [x1, y1, x2, y2]
 */
export function formatBoundingBox(normalizedBox) {
  const { xmin, ymin, xmax, ymax } = normalizedBox;
  return [xmin, ymin, xmax, ymax];
}

/**
 * Complete pipeline: normalize and format bounding box
 * @param {Object} bbox - Raw bounding box with x, y, width, height
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {Array<number>} Formatted bounding box array [x1, y1, x2, y2]
 */
export function processBoundingBox(bbox, imageWidth, imageHeight) {
  if (!Number.isFinite(imageWidth) || imageWidth <= 0 ||
      !Number.isFinite(imageHeight) || imageHeight <= 0) {
    throw new Error(
      `Invalid image dimensions: must be positive finite numbers (width: ${imageWidth}, height: ${imageHeight})`
    );
  }
  const normalized = normalizeBoundingBox(bbox, imageWidth, imageHeight);
  return formatBoundingBox(normalized);
}

/**
 * Sort bounding boxes by top-left coordinates (reading order)
 * First by y-coordinate (top to bottom), then by x-coordinate (left to right)
 * @param {Array} bboxes - Array of bounding boxes
 * @returns {Array} Sorted bounding boxes
 */
export function sortBoundingBoxesByPosition(bboxes) {
  if (!Array.isArray(bboxes)) {
    throw new Error('bboxes must be an array');
  }
  if (bboxes.length === 0) {
    return [];
  }
  return [...bboxes].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 5) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
}
