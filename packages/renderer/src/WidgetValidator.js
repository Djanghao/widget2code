export function measureOverflow(widgetElement) {
  if (!widgetElement) return { fits: false };

  const cw = widgetElement.clientWidth;
  const ch = widgetElement.clientHeight;
  const sw = widgetElement.scrollWidth;
  const sh = widgetElement.scrollHeight;

  let fits = sw <= cw && sh <= ch;

  try {
    const rootRect = widgetElement.getBoundingClientRect();
    const cs = window.getComputedStyle(widgetElement);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const innerLeft = rootRect.left + padL;
    const innerRight = rootRect.right - padR;
    const innerTop = rootRect.top + padT;
    const innerBottom = rootRect.bottom - padB;

    const tol = 0.5;

    let crossesPaddingOrOutside = false;
    const all = widgetElement.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el === widgetElement) continue;
      const r = el.getBoundingClientRect();
      if ((r.width || 0) <= 0 && (r.height || 0) <= 0) continue;

      if (r.left < rootRect.left - tol || r.right > rootRect.right + tol || r.top < rootRect.top - tol || r.bottom > rootRect.bottom + tol) {
        crossesPaddingOrOutside = true;
        break;
      }
      if (r.left < innerLeft - tol || r.right > innerRight + tol || r.top < innerTop - tol || r.bottom > innerBottom + tol) {
        crossesPaddingOrOutside = true;
        break;
      }
    }

    if (crossesPaddingOrOutside) {
      fits = false;
    }
    return { fits, cw, ch, sw, sh };
  } catch (e) {
    return { fits, cw, ch, sw, sh };
  }
}

export function validateWidget(widgetElement, spec) {
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

  if (expectedRatio && typeof expectedRatio === 'number' && isFinite(expectedRatio)) {
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
