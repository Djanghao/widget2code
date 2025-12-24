/**
 * Main VQA dataset generator
 * Generates Visual Question Answering pairs for UI understanding tasks
 */

import { processBoundingBox, sortBoundingBoxesByPosition } from './coordinates.js';
import { getReferringQuestions, getGroundingQuestions } from './templates.js';
import {
  findElementInDSL,
  generateReferringAnswer,
  generateGroundingAnswer,
  getCategoryFrequencies,
  sortCategoriesByFrequency
} from './answers.js';

/**
 * Generate referring VQA pairs for a single widget (Box-to-Text)
 * User provides bounding box coordinates, model describes the element
 * @param {Object} options - Generation options
 * @param {Object} options.boundingBoxData - Bounding box data with scale and elements
 * @param {Object} options.dsl - Widget DSL specification
 * @param {number} options.imageWidth - Image width in pixels
 * @param {number} options.imageHeight - Image height in pixels
 * @param {string} options.imagePath - Relative path to widget image
 * @returns {Array} Array of VQA conversation pairs in Qwen3-VL format
 */
export function generateReferringVQA(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options object is required');
  }
  const { boundingBoxData, dsl, imageWidth, imageHeight, imagePath } = options;

  if (!boundingBoxData || typeof boundingBoxData !== 'object') {
    throw new Error('boundingBoxData is required and must be an object');
  }
  if (!dsl || typeof dsl !== 'object') {
    throw new Error('dsl is required and must be an object');
  }
  if (!Number.isFinite(imageWidth) || imageWidth <= 0) {
    throw new Error(`imageWidth must be a positive number, got ${imageWidth}`);
  }
  if (!Number.isFinite(imageHeight) || imageHeight <= 0) {
    throw new Error(`imageHeight must be a positive number, got ${imageHeight}`);
  }
  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('imagePath is required and must be a string');
  }

  const elements = boundingBoxData.elements || {};
  const vqaPairs = [];

  for (const [path, bbox] of Object.entries(elements)) {
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    try {
      const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);
      const isText = bbox.component === 'Text';
      const questions = getReferringQuestions(formattedBox, isText);

      if (!questions || questions.length === 0) {
        continue;
      }
      const question = questions[Math.floor(Math.random() * questions.length)];
      const answer = generateReferringAnswer(bbox, path, dsl);

      vqaPairs.push({
        messages: [
          { role: 'user', content: `<image>\n${question}` },
          { role: 'assistant', content: answer }
        ],
        images: [imagePath]
      });
    } catch (error) {
      console.warn(`Skipping element ${path}: ${error.message}`);
    }
  }

  return vqaPairs;
}

/**
 * Generate grounding VQA pairs for a single widget (Text-to-Box)
 * User asks to locate an element by description, model responds with bounding box
 * @param {Object} options - Generation options
 * @param {Object} options.boundingBoxData - Bounding box data with scale and elements
 * @param {Object} options.dsl - Widget DSL specification
 * @param {number} options.imageWidth - Image width in pixels
 * @param {number} options.imageHeight - Image height in pixels
 * @param {string} options.imagePath - Relative path to widget image
 * @returns {Array} Array of VQA conversation pairs in Qwen3-VL format
 */
export function generateGroundingVQA(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options object is required');
  }
  const { boundingBoxData, dsl, imageWidth, imageHeight, imagePath } = options;

  if (!boundingBoxData || typeof boundingBoxData !== 'object') {
    throw new Error('boundingBoxData is required and must be an object');
  }
  if (!dsl || typeof dsl !== 'object') {
    throw new Error('dsl is required and must be an object');
  }
  if (!Number.isFinite(imageWidth) || imageWidth <= 0) {
    throw new Error(`imageWidth must be a positive number, got ${imageWidth}`);
  }
  if (!Number.isFinite(imageHeight) || imageHeight <= 0) {
    throw new Error(`imageHeight must be a positive number, got ${imageHeight}`);
  }
  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('imagePath is required and must be a string');
  }

  const elements = boundingBoxData.elements || {};
  const vqaPairs = [];

  for (const [path, bbox] of Object.entries(elements)) {
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    try {
      const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);
      const element = findElementInDSL(path, dsl);

      let description = bbox.component.toLowerCase();

      if (element) {
        if (element.content && typeof element.content === 'string' && element.content.trim()) {
          description = `${bbox.component.toLowerCase()} with text "${element.content}"`;
        } else if (element.props) {
          const props = element.props;
          if (props.color && bbox.component === 'Text') {
            description = `${props.color} ${description}`;
          } else if (props.backgroundColor && bbox.component === 'Button') {
            description = `${bbox.component.toLowerCase()} with ${props.backgroundColor} background`;
          }
        }
      }

      const answer = generateGroundingAnswer(formattedBox, description);
      const questions = getGroundingQuestions(description);

      if (!questions || questions.length === 0) {
        continue;
      }
      const question = questions[Math.floor(Math.random() * questions.length)];

      vqaPairs.push({
        messages: [
          { role: 'user', content: `<image>\n${question}` },
          { role: 'assistant', content: answer }
        ],
        images: [imagePath]
      });
    } catch (error) {
      console.warn(`Skipping element ${path}: ${error.message}`);
    }
  }

  return vqaPairs;
}

/**
 * Generate general grounding VQA pair (all bounding boxes, sorted by component type)
 * One pair per image showing all UI elements grouped by type
 * @param {Object} options - Generation options
 * @param {Object} options.boundingBoxData - Bounding box data with scale and elements
 * @param {number} options.imageWidth - Image width in pixels
 * @param {number} options.imageHeight - Image height in pixels
 * @param {string} options.imagePath - Relative path to widget image
 * @returns {Array} Array with a single VQA conversation pair
 */
export function generateGeneralGroundingVQA(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options object is required');
  }
  const { boundingBoxData, imageWidth, imageHeight, imagePath } = options;

  if (!boundingBoxData || typeof boundingBoxData !== 'object') {
    throw new Error('boundingBoxData is required and must be an object');
  }
  if (!Number.isFinite(imageWidth) || imageWidth <= 0) {
    throw new Error(`imageWidth must be a positive number, got ${imageWidth}`);
  }
  if (!Number.isFinite(imageHeight) || imageHeight <= 0) {
    throw new Error(`imageHeight must be a positive number, got ${imageHeight}`);
  }
  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('imagePath is required and must be a string');
  }

  const elements = boundingBoxData.elements || {};
  const componentGroups = {};

  for (const [path, bbox] of Object.entries(elements)) {
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    try {
      const componentType = bbox.component;
      if (!componentGroups[componentType]) {
        componentGroups[componentType] = [];
      }

      const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);
      componentGroups[componentType].push({
        type: componentType,
        bbox: formattedBox
      });
    } catch (error) {
      console.warn(`Skipping element ${path}: ${error.message}`);
    }
  }

  const sortedTypes = Object.keys(componentGroups).sort();

  const result = {};
  for (const type of sortedTypes) {
    result[type] = componentGroups[type].map(item => ({ bbox_2d: item.bbox }));
  }

  const questions = [
    "Detect all UI elements in this image.",
    "List all the UI components with their types and bounding boxes.",
    "Identify every element in the widget."
  ];

  const question = questions[Math.floor(Math.random() * questions.length)];
  const answer = JSON.stringify(result, null, 2);

  return [{
    messages: [
      { role: 'user', content: `<image>\n${question}` },
      { role: 'assistant', content: answer }
    ],
    images: [imagePath]
  }];
}

/**
 * Generate category-specific grounding VQA pairs
 * Asks for all elements of a specific type
 * @param {Object} options - Generation options
 * @param {Object} options.boundingBoxData - Bounding box data with scale and elements
 * @param {number} options.imageWidth - Image width in pixels
 * @param {number} options.imageHeight - Image height in pixels
 * @param {string} options.imagePath - Relative path to widget image
 * @returns {Array} Array of VQA conversation pairs (one per component type)
 */
export function generateCategoryGroundingVQA(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options object is required');
  }
  const { boundingBoxData, imageWidth, imageHeight, imagePath } = options;

  if (!boundingBoxData || typeof boundingBoxData !== 'object') {
    throw new Error('boundingBoxData is required and must be an object');
  }
  if (!Number.isFinite(imageWidth) || imageWidth <= 0) {
    throw new Error(`imageWidth must be a positive number, got ${imageWidth}`);
  }
  if (!Number.isFinite(imageHeight) || imageHeight <= 0) {
    throw new Error(`imageHeight must be a positive number, got ${imageHeight}`);
  }
  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('imagePath is required and must be a string');
  }

  const elements = boundingBoxData.elements || {};
  const vqaPairs = [];
  const componentGroups = {};

  for (const [path, bbox] of Object.entries(elements)) {
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    try {
      const componentType = bbox.component;
      if (!componentGroups[componentType]) {
        componentGroups[componentType] = [];
      }

      const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);
      componentGroups[componentType].push(formattedBox);
    } catch (error) {
      console.warn(`Skipping element ${path}: ${error.message}`);
    }
  }

  const questionTemplates = [
    "List all the {category} elements in the image.",
    "Find all {category} components and provide their bounding boxes.",
    "Locate every {category} in this widget.",
    "What are the bounding boxes for all {category} elements?"
  ];

  for (const [componentType, bboxes] of Object.entries(componentGroups)) {
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    const question = template.replace('{category}', componentType);

    const answer = JSON.stringify({
      [componentType]: bboxes.map(bbox => ({ bbox_2d: bbox }))
    }, null, 2);

    vqaPairs.push({
      messages: [
        { role: 'user', content: `<image>\n${question}` },
        { role: 'assistant', content: answer }
      ],
      images: [imagePath]
    });
  }

  return vqaPairs;
}

/**
 * Generate layout VQA pairs for a single widget (Image-to-Layout-Code)
 * User asks about the layout structure, model responds with the layout.jsx code
 * @param {Object} options - Generation options
 * @param {string} options.layoutCode - The layout.jsx file content
 * @param {string} options.imagePath - Relative path to widget image
 * @returns {Array} Array of VQA conversation pairs in Qwen3-VL format
 */
export function generateLayoutVQA(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options object is required');
  }
  const { layoutCode, imagePath } = options;

  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('imagePath is required and must be a string');
  }

  if (!layoutCode || typeof layoutCode !== 'string' || !layoutCode.trim()) {
    return [];
  }

  const question = "What is the layout structure of this mobile widget?";
  const answer = layoutCode.trim();

  return [{
    messages: [
      { role: 'user', content: `<image>\n${question}` },
      { role: 'assistant', content: answer }
    ],
    images: [imagePath]
  }];
}

/**
 * Generate all VQA pairs (referring, grounding, and layout) for a widget
 * @param {Object} options - Generation options
 * @param {Object} options.boundingBoxData - Bounding box data with scale and elements
 * @param {Object} options.dsl - Widget DSL specification
 * @param {number} options.imageWidth - Image width in pixels
 * @param {number} options.imageHeight - Image height in pixels
 * @param {string} options.imagePath - Relative path to widget image
 * @param {string} [options.layoutCode] - Optional layout.jsx file content
 * @returns {Object} Object with {referring: Array, grounding: Array, layout: Array, combined: Array}
 */
export function generateAllVQA(options) {
  const referring = generateReferringVQA(options);
  const grounding = generateGroundingVQA(options);
  const layout = options.layoutCode ? generateLayoutVQA(options) : [];

  return {
    referring,
    grounding,
    layout,
    combined: [...referring, ...grounding, ...layout]
  };
}

/**
 * Get statistics about generated VQA pairs
 * @param {Array} vqaPairs - Array of VQA pairs
 * @returns {Object} Statistics
 */
export function getVQAStatistics(vqaPairs) {
  if (!Array.isArray(vqaPairs)) {
    throw new Error('vqaPairs must be an array');
  }

  const stats = {
    totalPairs: vqaPairs.length,
    uniqueImages: new Set(vqaPairs.flatMap(p => p.images || [])).size,
    avgPairsPerImage: 0
  };

  if (stats.uniqueImages > 0) {
    stats.avgPairsPerImage = (stats.totalPairs / stats.uniqueImages).toFixed(1);
  }

  return stats;
}
