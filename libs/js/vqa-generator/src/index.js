/**
 * VQA Generator Library
 * Generate Visual Question Answering datasets for UI understanding tasks
 * Following UI-UG paper methodology
 */

export {
  normalizeCoordinate,
  normalizeBoundingBox,
  formatBoundingBox,
  processBoundingBox,
  sortBoundingBoxesByPosition
} from './coordinates.js';

export {
  REFERRING_TEMPLATES,
  REFERRING_TEXT_TEMPLATES,
  GROUNDING_TEMPLATES,
  fillTemplate,
  getReferringQuestions,
  getGroundingQuestions
} from './templates.js';

export {
  findElementInDSL,
  generateReferringAnswer,
  generateGroundingAnswer,
  getCategoryFrequencies,
  sortCategoriesByFrequency
} from './answers.js';

export {
  generateReferringVQA,
  generateGroundingVQA,
  generateLayoutVQA,
  generateAllVQA,
  getVQAStatistics
} from './vqa-generator.js';

export {
  batchGenerateVQA
} from './batch-generator.js';
