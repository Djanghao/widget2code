import React from 'react';

export function MapImage({
  width,
  height,
  url,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  return (
    <img
      src={url}
      alt="Map"
      {...rest}
      style={{
        width,
        height,
        objectFit: 'cover',
        display: 'block',
        flex: '0 0 auto',
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
