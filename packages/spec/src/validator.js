export function validateWidgetSpec(spec) {
  const errors = [];
  const warnings = [];

  if (!spec || typeof spec !== 'object') {
    errors.push('Spec must be an object');
    return { valid: false, errors, warnings };
  }

  if (!spec.widget) {
    errors.push('Missing widget property');
    return { valid: false, errors, warnings };
  }

  if (!spec.widget.root) {
    errors.push('Missing widget.root property');
    return { valid: false, errors, warnings };
  }

  if (spec.widget.aspectRatio !== undefined) {
    const ar = spec.widget.aspectRatio;
    if (typeof ar !== 'number' || !isFinite(ar) || ar <= 0) {
      errors.push('Invalid aspectRatio: must be a positive finite number');
    }
  }

  if (spec.widget.width !== undefined) {
    const w = spec.widget.width;
    if ((typeof w !== 'number' && typeof w !== 'string') || (typeof w === 'number' && !isFinite(w))) {
      errors.push('Invalid width: must be a number or string');
    }
  }

  if (spec.widget.height !== undefined) {
    const h = spec.widget.height;
    if ((typeof h !== 'number' && typeof h !== 'string') || (typeof h === 'number' && !isFinite(h))) {
      errors.push('Invalid height: must be a number or string');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
