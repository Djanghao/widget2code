import React from 'react';
import { Icon } from './Icon.jsx';

export function Button({
  label,
  icon,
  iconPosition = 'left',
  backgroundColor = 'rgba(59, 130, 246, 1)',
  color = 'rgba(255, 255, 255, 1)',
  borderRadius = 8,
  fontSize = 14,
  fontWeight = 500,
  paddingX = 16,
  paddingY = 8,
  gap = 8,
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
    gap: `${gap}px`,
    backgroundColor,
    color,
    borderRadius: `${borderRadius}px`,
    fontSize: `${fontSize}px`,
    fontWeight,
    padding: `${paddingY}px ${paddingX}px`,
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
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
      {icon && iconPosition === 'left' && <Icon name={icon} size={fontSize * 1.2} color={color} />}
      {label && <span>{label}</span>}
      {icon && iconPosition === 'right' && <Icon name={icon} size={fontSize * 1.2} color={color} />}
    </div>
  );
}
