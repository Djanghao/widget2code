/**
 * Answer generation for VQA dataset
 * Generates structured answers for referring and grounding tasks
 */

/**
 * Extract element content and properties from DSL
 * @param {string} elementPath - Element path (e.g., "root.0.1")
 * @param {Object} dsl - Widget DSL specification
 * @returns {Object|null} Element data or null if not found
 */
export function findElementInDSL(elementPath, dsl) {
  if (!elementPath || typeof elementPath !== 'string') {
    return null;
  }
  if (!dsl || typeof dsl !== 'object') {
    return null;
  }

  const parts = elementPath.split('.');

  let current = dsl.widget?.root;
  if (!current) return null;

  for (let i = 1; i < parts.length; i++) {
    const index = parseInt(parts[i], 10);
    if (isNaN(index) || index < 0 || !current.children || index >= current.children.length) {
      return null;
    }
    current = current.children[index];
  }

  return current;
}

/**
 * Generate answer for referring task (Box-to-Text: describe a specific region)
 * @param {Object} bbox - Bounding box data with type, component, etc.
 * @param {string} elementPath - Element path
 * @param {Object} dsl - Widget DSL specification
 * @returns {string} Natural language description of the element
 */
export function generateReferringAnswer(bbox, elementPath, dsl) {
  const element = findElementInDSL(elementPath, dsl);
  
  // Build a natural language description
  let description = `This is a ${bbox.component} element`;
  
  if (element) {
    if (element.content && typeof element.content === 'string' && element.content.trim()) {
      description += ` with the text "${element.content}"`;
    }
    
    // Add key properties
    if (element.props) {
      const props = element.props;
      const propDetails = [];
      
      if (props.color) propDetails.push(`color: ${props.color}`);
      if (props.fontSize) propDetails.push(`font size: ${props.fontSize}`);
      if (props.fontWeight) propDetails.push(`font weight: ${props.fontWeight}`);
      if (props.backgroundColor) propDetails.push(`background: ${props.backgroundColor}`);
      if (props.borderRadius) propDetails.push(`border radius: ${props.borderRadius}`);
      if (props.padding) propDetails.push(`padding: ${props.padding}`);
      
      if (propDetails.length > 0) {
        description += `. Properties: ${propDetails.join(', ')}`;
      }
    }
    
    // For containers, add layout information
    if (element.type === 'container') {
      const layoutParts = [];
      if (element.direction) layoutParts.push(`${element.direction} direction`);
      if (element.gap) layoutParts.push(`gap of ${element.gap}`);
      
      if (layoutParts.length > 0) {
        description += `. Layout: ${layoutParts.join(', ')}`;
      }
      
      const childCount = element.children?.length || 0;
      if (childCount > 0) {
        description += `. Contains ${childCount} child element${childCount > 1 ? 's' : ''}`;
      }
    }
  }
  
  description += '.';
  return description;
}

/**
 * Generate answer for grounding task (Text-to-Box: locate an element)
 * @param {Array<number>} formattedBox - Formatted bounding box array [x1, y1, x2, y2]
 * @param {string} description - Element description
 * @returns {string} Answer with bounding box in JSON format
 */
export function generateGroundingAnswer(formattedBox, description) {
  if (!Array.isArray(formattedBox) || formattedBox.length !== 4) {
    throw new Error('formattedBox must be an array of 4 numbers [x1, y1, x2, y2]');
  }
  if (!description || typeof description !== 'string') {
    throw new Error('description must be a non-empty string');
  }
  return `Here is the bounding box for the ${description}:\n${JSON.stringify({ bbox_2d: formattedBox })}`;
}

/**
 * Group elements by category and count frequencies
 * @param {Object} boundingBoxData - Bounding boxes data with elements
 * @returns {Map} Map of category -> count
 */
export function getCategoryFrequencies(boundingBoxData) {
  const frequencies = new Map();
  const elements = boundingBoxData.elements || {};

  for (const [path, bbox] of Object.entries(elements)) {
    // Only count leaf components (skip containers and null components)
    if (bbox.type === 'leaf' && bbox.component) {
      const count = frequencies.get(bbox.component) || 0;
      frequencies.set(bbox.component, count + 1);
    }
  }

  return frequencies;
}

/**
 * Get categories sorted by frequency (most common first)
 * @param {Map} frequencies - Category frequencies
 * @returns {Array} Sorted category names
 */
export function sortCategoriesByFrequency(frequencies) {
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([category]) => category);
}
