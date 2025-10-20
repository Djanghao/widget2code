import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { renderDynamicComponent } from './DynamicRenderer.js';
import { detectOverflow } from './utils.js';

export function DynamicComponent({
  code,
  suggestedWidth,
  suggestedHeight,
  maxIterations = 5,
  onSizeChange,
  onError
}) {
  const [size, setSize] = useState({
    width: suggestedWidth,
    height: suggestedHeight
  });
  const [iteration, setIteration] = useState(0);
  const [isResizing, setIsResizing] = useState(true);
  const [renderError, setRenderError] = useState(null);
  const containerRef = useRef(null);

  const Component = useMemo(() => {
    try {
      setRenderError(null);
      return renderDynamicComponent(code);
    } catch (error) {
      console.error('[DynamicComponent] Render error:', error);
      setRenderError(error.message);
      if (onError) onError(error);
      return null;
    }
  }, [code, onError]);

  useLayoutEffect(() => {
    if (!containerRef.current || iteration >= maxIterations || renderError) {
      setIsResizing(false);
      if (onSizeChange && !renderError) {
        onSizeChange(size);
      }
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;

        const overflow = detectOverflow(el);

        if (overflow.hasOverflow) {
          const newWidth = Math.ceil(
            Math.max(size.width, overflow.scrollWidth + 2)
          );
          const newHeight = Math.ceil(
            Math.max(size.height, overflow.scrollHeight + 2)
          );

          console.log(
            `[AutoResize] Iteration ${iteration + 1}: ${size.width}×${size.height} → ${newWidth}×${newHeight}`,
            `(scrollSize: ${overflow.scrollWidth}×${overflow.scrollHeight})`
          );

          setSize({ width: newWidth, height: newHeight });
          setIteration(prev => prev + 1);
        } else {
          console.log(`[AutoResize] Completed: ${size.width}×${size.height} (${iteration} iterations)`);
          setIsResizing(false);
          if (onSizeChange) {
            onSizeChange(size);
          }
        }
      });
    });
  }, [size, iteration, maxIterations, onSizeChange, renderError]);

  if (renderError) {
    return (
      <div
        style={{
          width: suggestedWidth,
          height: suggestedHeight,
          backgroundColor: '#fee',
          border: '2px solid #f44',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: '#c33', marginBottom: 8 }}>
          ⚠️ Render Error
        </div>
        <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
          {renderError}
        </div>
      </div>
    );
  }

  if (!Component) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: size.width,
        height: size.height,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <Component />
      {isResizing && iteration > 0 && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          padding: '4px 8px',
          background: 'rgba(255, 165, 0, 0.9)',
          color: 'white',
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          Resizing {iteration}/{maxIterations}
        </div>
      )}
    </div>
  );
}
