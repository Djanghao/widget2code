import React from 'react';

export function Text({
  fontSize = 14,
  color = 'rgba(255, 255, 255, 0.85)',
  align = 'left',
  fontWeight = 400,
  lineHeight = 1.3,
  children,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  return (
    <div
      {...rest}
      style={{
        fontSize: `${fontSize}px`,
        color,
        textAlign: align,
        fontWeight,
        lineHeight,
        ...style,
        ...(flex !== undefined ? { flex } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexShrink !== undefined ? { flexShrink } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {})
      }}
    >
      {children}
    </div>
  );
}
