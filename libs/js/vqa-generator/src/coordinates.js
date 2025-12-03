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
  const xmin = normalizeCoordinate(bbox.x, imageWidth);
  const ymin = normalizeCoordinate(bbox.y, imageHeight);
  const xmax = normalizeCoordinate(bbox.x + bbox.width, imageWidth);
  const ymax = normalizeCoordinate(bbox.y + bbox.height, imageHeight);

  return { xmin, ymin, xmax, ymax };
}

/**
 * Format bounding box as array for Qwen3-VL
 * Format: [y1, x1, y2, x2] in [0, 1000] range
 * @param {Object} normalizedBox - Normalized bounding box {xmin, ymin, xmax, ymax}
 * @returns {Array<number>} Formatted bounding box array [y1, x1, y2, x2]
 */
export function formatBoundingBox(normalizedBox) {
  const { xmin, ymin, xmax, ymax } = normalizedBox;
  return [ymin, xmin, ymax, xmax];
}

/**
 * Complete pipeline: normalize and format bounding box
 * @param {Object} bbox - Raw bounding box with x, y, width, height
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {Array<number>} Formatted bounding box array [y1, x1, y2, x2]
 */
export function processBoundingBox(bbox, imageWidth, imageHeight) {
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
  return [...bboxes].sort((a, b) => {
    // Sort by y first (top to bottom)
    if (Math.abs(a.y - b.y) > 5) {
      return a.y - b.y;
    }
    // Then by x (left to right) if y is similar
    return a.x - b.x;
  });
}
