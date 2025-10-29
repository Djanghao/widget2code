import React from 'react';

export function Indicator({
  color,
  thickness = 4,
  height = '100%',
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
        width: thickness,
        height,
        backgroundColor: color,
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
