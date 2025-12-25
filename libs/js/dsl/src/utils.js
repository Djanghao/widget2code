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

export const applySizeToSpec = (spec, width, height) => {
  if (!spec || !spec.widget) return spec;
  const next = { ...spec, widget: { ...spec.widget } };
  next.widget.width = Math.max(1, Math.round(width));
  next.widget.height = Math.max(1, Math.round(height));
  return formatSpecWithRootLast(next);
};

export const removeSizeFromSpec = (spec) => {
  if (!spec || !spec.widget) return spec;
  const next = { ...spec, widget: { ...spec.widget } };
  delete next.widget.width;
  delete next.widget.height;
  return formatSpecWithRootLast(next);
};
