import React from 'react';
import { Icon } from './Icon.jsx';

export function Button({
  icon,
  content,
  backgroundColor = 'rgba(59, 130, 246, 1)',
  color = 'rgba(255, 255, 255, 1)',
  borderRadius = 8,
  fontSize = 14,
  fontWeight = 500,
  padding = 12,
  width,
  height,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    color,
    borderRadius: `${borderRadius}px`,
    fontSize: `${fontSize}px`,
    fontWeight,
    padding: `${padding}px`,
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(flexBasis !== undefined ? { flexBasis } : {})
  };

  return (
    <div {...rest} style={buttonStyle}>
      {icon ? <Icon name={icon} size={fontSize * 1.2} color={color} /> : content}
    </div>
  );
}
