import React from 'react';

export function WidgetShell({
  backgroundColor = '#f2f2f7',
  borderRadius = 20,
  padding = 16,
  width,
  height,
  children,
  style = {}
}) {
  const sizeStyle = {};
  if (width !== undefined) sizeStyle.width = width;
  if (height !== undefined) sizeStyle.height = height;

  return (
    <div
      style={{
        backgroundColor,
        borderRadius,
        padding,
        overflow: 'hidden',
        display: 'inline-flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...style,
        ...sizeStyle
      }}
    >
      {children}
    </div>
  );
}
