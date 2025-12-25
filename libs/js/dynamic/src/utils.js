export function detectOverflow(element) {
  if (!element) {
    return { hasOverflow: false };
  }

  const verticalOverflow = element.scrollHeight > element.clientHeight;
  const horizontalOverflow = element.scrollWidth > element.clientWidth;

  return {
    hasOverflow: verticalOverflow || horizontalOverflow,
    vertical: verticalOverflow,
    horizontal: horizontalOverflow,
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
    clientHeight: element.clientHeight,
    clientWidth: element.clientWidth
  };
}

export function calculateOptimalSize(element, currentSize, padding = 2) {
  const overflow = detectOverflow(element);

  if (!overflow.hasOverflow) {
    return currentSize;
  }

  return {
    width: Math.ceil(Math.max(currentSize.width, overflow.scrollWidth + padding)),
    height: Math.ceil(Math.max(currentSize.height, overflow.scrollHeight + padding))
  };
}

export function formatSize(size) {
  return `${size.width}×${size.height}`;
}
