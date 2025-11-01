import React from 'react';

export function Image({
  width,
  height,
  url,
  borderRadius = 0,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  children,
  ...rest
}) {
  return (
    <div
      {...rest}
      style={{
        width,
        height,
        borderRadius,
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'block',
        flex: '0 0 auto',
        flexShrink: 0,
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
