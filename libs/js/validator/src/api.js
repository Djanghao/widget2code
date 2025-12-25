/**
 * @file api.js
 * @description Public API for validator functionality
 * Provides a simple interface for validating and fixing widget DSL
 * @author Claude Code
 * @date 2025-11-03
 */

import { validateWidgetDSL, fixWidgetDSL, validateAndFix } from './DSLValidator.js';
import { validateWidget } from './WidgetValidator.js';

/**
 * Validate a widget DSL specification
 * @param {Object} spec - Widget DSL specification
 * @returns {Object} Validation result with valid, errors, warnings, and canCompile
 */
export function validate(spec) {
  return validateWidgetDSL(spec);
}

/**
 * Fix a widget DSL specification
 * @param {Object} spec - Widget DSL specification
 * @returns {Object} Result with fixed spec and list of changes made
 */
export function fix(spec) {
  return fixWidgetDSL(spec);
}

/**
 * Validate and fix a widget DSL specification in one call
 * @param {Object} spec - Widget DSL specification
 * @returns {Object} Result with validation, fixed spec, changes, and compilation status
 */
export function validateAndFixDSL(spec) {
  return validateAndFix(spec);
}

/**
 * Validate a rendered widget (runtime validation)
 * @param {Object} widget - Rendered widget object
 * @returns {Object} Validation result
 */
export function validateRenderedWidget(widget) {
  return validateWidget(widget);
}

/**
 * Check if a DSL spec is valid and can be compiled
 * @param {Object} spec - Widget DSL specification
 * @returns {boolean} True if the spec can be compiled
 */
export function canCompile(spec) {
  const result = validateWidgetDSL(spec);
  return result.canCompile;
}

/**
 * Batch validate multiple DSL specifications
 * @param {Array<Object>} specs - Array of widget DSL specifications
 * @returns {Array<Object>} Array of validation results
 */
export function batchValidate(specs) {
  if (!Array.isArray(specs)) {
    throw new Error('specs must be an array');
  }

  return specs.map((spec, index) => ({
    index,
    ...validateWidgetDSL(spec)
  }));
}

/**
 * Batch validate and fix multiple DSL specifications
 * @param {Array<Object>} specs - Array of widget DSL specifications
 * @returns {Array<Object>} Array of validation and fix results
 */
export function batchValidateAndFix(specs) {
  if (!Array.isArray(specs)) {
    throw new Error('specs must be an array');
  }

  return specs.map((spec, index) => ({
    index,
    ...validateAndFix(spec)
  }));
}

/**
 * Get detailed validation report
 * @param {Object} spec - Widget DSL specification
 * @returns {Object} Detailed validation report
 */
export function getValidationReport(spec) {
  const validation = validateWidgetDSL(spec);

  return {
    timestamp: new Date().toISOString(),
    spec,
    validation,
    summary: {
      isValid: validation.valid,
      canCompile: validation.canCompile,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    }
  };
}

/**
 * Validate and get suggestions for fixing issues
 * @param {Object} spec - Widget DSL specification
 * @returns {Object} Validation result with suggestions
 */
export function validateWithSuggestions(spec) {
  const validation = validateWidgetDSL(spec);

  if (validation.canCompile) {
    return {
      ...validation,
      suggestions: []
    };
  }

  const suggestions = [];

  // Analyze errors and provide suggestions
  validation.errors.forEach(error => {
    if (error.includes('missing required field')) {
      suggestions.push({
        type: 'error',
        message: error,
        suggestion: 'Add the missing required field to your DSL specification'
      });
    } else if (error.includes('must be an array')) {
      suggestions.push({
        type: 'error',
        message: error,
        suggestion: 'Convert the field to an array format'
      });
    } else if (error.includes('unknown component')) {
      suggestions.push({
        type: 'warning',
        message: error,
        suggestion: 'Use a component from @widget-factory/primitives or the fix() function will replace it with Placeholder'
      });
    } else {
      suggestions.push({
        type: 'error',
        message: error,
        suggestion: 'Review the DSL specification format'
      });
    }
  });

  return {
    ...validation,
    suggestions
  };
}
