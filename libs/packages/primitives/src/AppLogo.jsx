import React from 'react';

export function AppLogo({
  size = 20,
  name = '',
  backgroundColor = '#007AFF',
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <div
      {...rest}
      style={{
        width: size,
        height: size,
        backgroundColor,
        borderRadius: size * 0.22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        fontWeight: 600,
        color: '#ffffff',
        flex: '0 0 auto',
        flexShrink: 0,
        ...style,
        ...(flex !== undefined ? { flex } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexShrink !== undefined ? { flexShrink } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {})
      }}
    >
      {firstLetter}
    </div>
  );
}
