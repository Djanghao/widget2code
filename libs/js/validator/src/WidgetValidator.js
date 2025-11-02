/**
 * @file WidgetValidator.js
 * @description Runtime widget validation for rendered components
 * @author Houston Zhang
 * @date 2025-10-29
 */

import { measureOverflow } from '@widget-factory/resizer';

export function validateWidget(widgetElement, spec, options = {}) {
  const { checkAspectRatio = true } = options;
  const issues = [];
  const warnings = [];

  if (!widgetElement) {
    return {
      valid: false,
      issues: ['Widget element not found'],
      warnings: [],
      metadata: null
    };
  }

  const overflow = measureOverflow(widgetElement);
  const rect = widgetElement.getBoundingClientRect();
  const actualWidth = Math.round(rect.width);
  const actualHeight = Math.round(rect.height);
  const actualRatio = actualWidth / actualHeight;

  const expectedWidth = spec?.widget?.width;
  const expectedHeight = spec?.widget?.height;
  const expectedRatio = spec?.widget?.aspectRatio;

  if (!overflow.fits) {
    issues.push('Content overflows container or padding area');
  }

  if (checkAspectRatio && expectedRatio && typeof expectedRatio === 'number' && isFinite(expectedRatio)) {
    const deviation = Math.abs(actualRatio - expectedRatio) / expectedRatio;
    if (deviation > 0.05) {
      issues.push(
        `Aspect ratio mismatch: expected ${expectedRatio.toFixed(3)}, got ${actualRatio.toFixed(3)} (${(deviation * 100).toFixed(1)}% off)`
      );
    } else if (deviation > 0.02) {
      warnings.push(
        `Aspect ratio slightly off: expected ${expectedRatio.toFixed(3)}, got ${actualRatio.toFixed(3)} (${(deviation * 100).toFixed(1)}% off)`
      );
    }
  }

  if (expectedWidth && Math.abs(actualWidth - expectedWidth) > 1) {
    warnings.push(`Width mismatch: expected ${expectedWidth}px, got ${actualWidth}px`);
  }

  if (expectedHeight && Math.abs(actualHeight - expectedHeight) > 1) {
    warnings.push(`Height mismatch: expected ${expectedHeight}px, got ${actualHeight}px`);
  }

  const metadata = {
    width: actualWidth,
    height: actualHeight,
    aspectRatio: parseFloat(actualRatio.toFixed(4)),
    hasOverflow: !overflow.fits,
    scrollWidth: overflow.sw,
    scrollHeight: overflow.sh
  };

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    metadata
  };
}
