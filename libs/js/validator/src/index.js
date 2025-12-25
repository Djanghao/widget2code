// Standardized API - all validation functionality exposed through these functions
export {
  validate,
  fix,
  validateAndFixDSL,
  validateRenderedWidget,
  canCompile,
  batchValidate,
  batchValidateAndFix,
  getValidationReport,
  validateWithSuggestions
} from './api.js';
