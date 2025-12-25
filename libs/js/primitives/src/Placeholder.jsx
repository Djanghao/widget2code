import React from 'react';

/**
 * Placeholder component for unknown/invalid components
 * Preserves visual layout and styling from the original component
 * Designed to be visually invisible - maintains layout without drawing attention
 */
export function Placeholder({
  width,
  height,
  backgroundColor,
  borderRadius,
  padding,
  margin,
  border,
  opacity,
  color,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const containerStyle = {
    width,
    height,
    backgroundColor,
    borderRadius,
    padding,
    margin,
    opacity,
    border,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...style,
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(flexBasis !== undefined ? { flexBasis } : {})
  };

  return <div {...rest} style={containerStyle} />;
}
