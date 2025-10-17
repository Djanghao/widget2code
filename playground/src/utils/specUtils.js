/**
 * @file specUtils.js
 * @description Utility functions for widget spec manipulation.
 * Provides helpers for parsing aspect ratios, applying sizes to specs,
 * formatting specs with root last, and restoring natural sizes.
 * @author Houston Zhang
 * @date 2025-10-15
 */

export const formatSpecWithRootLast = (spec) => {
  if (!spec || typeof spec !== 'object') return spec;
  const w = spec.widget;
  if (!w || typeof w !== 'object' || !('root' in w)) return spec;
  const { root, ...rest } = w;
  return { ...spec, widget: { ...rest, root } };
};

export const parseAspectRatio = (str) => {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;
  if (s.includes(':')) {
    const [a, b] = s.split(':');
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isFinite(na) || !isFinite(nb) || nb <= 0) return null;
    return na / nb;
  }
  const v = parseFloat(s);
  if (!isFinite(v) || v <= 0) return null;
  return v;
};

export const parseCurrentSpecObject = (editedSpec, currentExampleSpec) => {
  try {
    return editedSpec ? JSON.parse(editedSpec) : JSON.parse(JSON.stringify(currentExampleSpec));
  } catch {
    return null;
  }
};

export const applySizeToSpec = (editedSpec, currentExampleSpec, width, height, setEditedSpec) => {
  const obj = parseCurrentSpecObject(editedSpec, currentExampleSpec);
  if (!obj || !obj.widget) return;
  const next = { ...obj, widget: { ...obj.widget } };
  next.widget.width = Math.max(1, Math.round(width));
  next.widget.height = Math.max(1, Math.round(height));
  setEditedSpec(JSON.stringify(formatSpecWithRootLast(next), null, 2));
};

export const restoreSizeInSpec = (editedSpec, currentExampleSpec, setEditedSpec) => {
  const obj = parseCurrentSpecObject(editedSpec, currentExampleSpec);
  if (!obj || !obj.widget) return;
  const next = { ...obj, widget: { ...obj.widget } };
  delete next.widget.width;
  delete next.widget.height;
  setEditedSpec(JSON.stringify(formatSpecWithRootLast(next), null, 2));
};
