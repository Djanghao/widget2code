import React from 'react';

// Map preset definitions
const MAP_PRESETS = {
  'light-google-map': '/assets/maps/light-google-map.png',
  'dark-google-map': '/assets/maps/dark-google-map.png',
  'satellite-google-map': '/assets/maps/satellite-google-map.png',
};

export function MapImage({
  width,
  height,
  src,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  // Resolve preset IDs to actual paths
  const resolvedSrc = MAP_PRESETS[src] || src;

  // Only set minWidth/minHeight for non-percentage values
  const isPercentageWidth = typeof width === 'string' && width.includes('%');
  const isPercentageHeight = typeof height === 'string' && height.includes('%');

  return (
    <div
      {...rest}
      style={{
        width,
        height,
        ...((!isPercentageWidth && width !== undefined) ? { minWidth: width } : {}),
        ...((!isPercentageHeight && height !== undefined) ? { minHeight: height } : {}),
        backgroundImage: resolvedSrc ? `url(${resolvedSrc})` : undefined,
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'block',
        flex: '0 0 auto',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
        ...(flex !== undefined ? { flex } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexShrink !== undefined ? { flexShrink } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {})
      }}
    />
  );
}
