import React from 'react';

export function Divider({
  orientation = 'horizontal',
  type = 'solid',
  color = '#e5e5ea',
  thickness = 1,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      {...rest}
      style={{
        width: isHorizontal ? '100%' : thickness,
        height: isHorizontal ? thickness : '100%',
        backgroundColor: type === 'solid' ? color : 'transparent',
        ...(type === 'dashed' ? {
          backgroundImage: `linear-gradient(to ${isHorizontal ? 'right' : 'bottom'}, ${color} 50%, transparent 50%)`,
          backgroundSize: isHorizontal ? '8px 100%' : '100% 8px',
          backgroundRepeat: isHorizontal ? 'repeat-x' : 'repeat-y'
        } : {}),
        flexShrink: 0,
        ...style,
        ...(flex !== undefined ? { flex } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexShrink !== undefined ? { flexShrink } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {})
      }}
    />
  );
}
