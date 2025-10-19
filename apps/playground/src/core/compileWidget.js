/**
 * @file compileWidget.js
 * @description Core widget compilation utilities.
 * Provides function to compile widget specs to JSX.
 * @author Houston Zhang
 * @date 2025-10-19
 */

import { compileWidgetSpecToJSX } from '@widget-factory/compiler';

export function compileWidgetSpec(spec) {
  try {
    const jsx = compileWidgetSpecToJSX(spec);
    const treeRoot = spec?.widget || null;

    return {
      success: true,
      jsx,
      treeRoot,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      jsx: `// Error: ${error.message}`,
      treeRoot: null,
      error
    };
  }
}
