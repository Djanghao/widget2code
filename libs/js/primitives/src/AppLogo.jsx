import React from 'react';
import { Icon } from './Icon';

export function AppLogo({
  size = 20,
  name = '',
  icon = null,  // NEW: Icon name from retrieval (e.g., "si:SiGoogle")
  backgroundColor = '#007AFF',
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  // If icon is provided, render using Icon component
  if (icon) {
    return (
      <Icon
        name={icon}
        size={size}
        flex={flex}
        flexGrow={flexGrow}
        flexShrink={flexShrink}
        flexBasis={flexBasis}
        style={style}
        {...rest}
      />
    );
  }

  // Otherwise, render first letter as fallback
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
