import React, { useState, useEffect } from 'react';

export function Image({
  width,
  height,
  src,
  borderRadius = 0,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  children,
  ...rest
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Test if image loads successfully
  useEffect(() => {
    if (!src) {
      setImageError(true);
      return;
    }

    setImageError(false);
    setImageLoaded(false);

    const img = new window.Image();

    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

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
        borderRadius,
        backgroundImage: (src && !imageError) ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'block',
        flex: '0 0 auto',
        flexShrink: 0,
        // Add placeholder styling when image fails
        ...(imageError ? {
          backgroundColor: 'transparent'
        } : {}),
        ...style,
        ...(flex !== undefined ? { flex } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexShrink !== undefined ? { flexShrink } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {})
      }}
    >
      {/* Add 100x100 placeholder content when image fails to maintain layout */}
      {imageError && (
        <div style={{ width: '100px', height: '100px', opacity: 0 }} />
      )}
      {children}
    </div>
  );
}
