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
  const { boundingBoxData, dsl, imageWidth, imageHeight, imagePath } = options;
  const elements = boundingBoxData.elements || {};
  const vqaPairs = [];

  for (const [path, bbox] of Object.entries(elements)) {
    // Only generate for leaf components (skip containers)
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    // Process bounding box to normalized format [x1, y1, x2, y2]
    const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);

    // Determine if this is a Text component for specialized templates
    const isText = bbox.component === 'Text';

    // Get questions and randomly select one (1 referring per bounding box)
    const questions = getReferringQuestions(formattedBox, isText);
    const question = questions[Math.floor(Math.random() * questions.length)];

    // Generate answer (natural language description)
    const answer = generateReferringAnswer(bbox, path, dsl);

    // Create single VQA pair for this bounding box
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
  const { boundingBoxData, dsl, imageWidth, imageHeight, imagePath } = options;
  const elements = boundingBoxData.elements || {};
  const vqaPairs = [];

  // Process each element individually for grounding tasks
  for (const [path, bbox] of Object.entries(elements)) {
    // Only process leaf components
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    // Process bounding box to normalized format [x1, y1, x2, y2]
    const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);

    // Get element details for description
    const element = findElementInDSL(path, dsl);

    // Create a description for this specific element
    let description = bbox.component.toLowerCase();

    // Add distinguishing features for better grounding
    if (element) {
      if (element.content) {
        // For Text and Button, include the content
        description = `${bbox.component.toLowerCase()} with text "${element.content}"`;
      } else if (element.props) {
        // Add distinctive visual properties
        const props = element.props;
        if (props.color && bbox.component === 'Text') {
          description = `${props.color} ${description}`;
        } else if (props.backgroundColor && bbox.component === 'Button') {
          description = `${bbox.component.toLowerCase()} with ${props.backgroundColor} background`;
        }
      }
    }

    // Generate answer with bounding box
    const answer = generateGroundingAnswer(formattedBox, description);

    // Get questions and randomly select one (1 grounding per bounding box)
    const questions = getGroundingQuestions(description);
    const question = questions[Math.floor(Math.random() * questions.length)];

    // Create single VQA pair for this bounding box
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
  const { boundingBoxData, imageWidth, imageHeight, imagePath } = options;
  const elements = boundingBoxData.elements || {};

  // Group elements by component type (excluding containers)
  const componentGroups = {};

  for (const [path, bbox] of Object.entries(elements)) {
    // Only process leaf components (skip containers)
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    const componentType = bbox.component;
    if (!componentGroups[componentType]) {
      componentGroups[componentType] = [];
    }

    const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);
    componentGroups[componentType].push({
      type: componentType,
      bbox: formattedBox
    });
  }

  // Sort component types alphabetically
  const sortedTypes = Object.keys(componentGroups).sort();

  // Build the answer with all bounding boxes grouped by type
  const result = {};
  for (const type of sortedTypes) {
    result[type] = componentGroups[type].map(item => ({ bbox_2d: item.bbox }));
  }

  // Questions for general grounding (use first 3 variations)
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
  const { boundingBoxData, imageWidth, imageHeight, imagePath } = options;
  const elements = boundingBoxData.elements || {};
  const vqaPairs = [];

  // Group elements by component type (excluding containers)
  const componentGroups = {};

  for (const [path, bbox] of Object.entries(elements)) {
    // Only process leaf components (skip containers)
    if (bbox.type !== 'leaf' || !bbox.component) {
      continue;
    }

    const componentType = bbox.component;
    if (!componentGroups[componentType]) {
      componentGroups[componentType] = [];
    }

    const formattedBox = processBoundingBox(bbox, imageWidth, imageHeight);
    componentGroups[componentType].push(formattedBox);
  }

  // Question templates for category-specific grounding
  const questionTemplates = [
    "List all the {category} elements in the image.",
    "Find all {category} components and provide their bounding boxes.",
    "Locate every {category} in this widget.",
    "What are the bounding boxes for all {category} elements?"
  ];

  // Generate one VQA pair per component type
  for (const [componentType, bboxes] of Object.entries(componentGroups)) {
    // Pick a random question template
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    const question = template.replace('{category}', componentType);

    // Format answer as array of bounding boxes
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
  const { layoutCode, imagePath } = options;
  
  if (!layoutCode || !layoutCode.trim()) {
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
  const stats = {
    totalPairs: vqaPairs.length,
    uniqueImages: new Set(vqaPairs.map(p => p.image)).size,
    avgPairsPerImage: 0
  };

  if (stats.uniqueImages > 0) {
    stats.avgPairsPerImage = (stats.totalPairs / stats.uniqueImages).toFixed(1);
  }

  return stats;
}
