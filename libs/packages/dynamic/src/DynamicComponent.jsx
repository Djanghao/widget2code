import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { renderDynamicComponent } from './DynamicRenderer.js';
import { findOptimalSize, waitForStable } from '@widget-factory/resizer';

export function DynamicComponent({
  code,
  suggestedWidth,
  suggestedHeight,
  onSizeChange,
  onError,
  enableDragResize = true,
  maintainAspectRatio = true
}) {
  const [isResizing, setIsResizing] = useState(true);
  const [renderError, setRenderError] = useState(null);
  const frameRef = useRef(null);
  const componentRef = useRef(null);
  const hasResizedRef = useRef(false);

  const aspectRatio = useMemo(() => {
    return suggestedWidth / suggestedHeight;
  }, [suggestedWidth, suggestedHeight]);

  const Component = useMemo(() => {
    try {
      setRenderError(null);
      hasResizedRef.current = false;
      return renderDynamicComponent(code);
    } catch (error) {
      console.error('[DynamicComponent] Render error:', error);
      setRenderError(error.message);
      if (onError) onError(error);
      return null;
    }
  }, [code, onError]);

  useLayoutEffect(() => {
    if (!componentRef.current || renderError || hasResizedRef.current) {
      setIsResizing(false);
      return;
    }

    hasResizedRef.current = true;

    const performResize = async () => {
      const element = componentRef.current;

      console.log('[DynamicComponent] Waiting for layout to stabilize...');

      await waitForStable({
        getElement: () => element,
        onLog: (type, message) => {
          const logMap = {
            initial: `[DynamicComponent] Initial size: ${message}`,
            stableInitial: `[DynamicComponent] Layout ${message}`,
            change: `[DynamicComponent] Size changed: ${message}`,
            stableAfterChange: `[DynamicComponent] Layout ${message}`,
            changing: `[DynamicComponent] Size still ${message}`,
            maxAttempts: `[DynamicComponent] ${message}`,
            noChange: `[DynamicComponent] ${message}`
          };
          console.log(logMap[type] || `[DynamicComponent] ${message}`);
        }
      });

      console.log('[DynamicComponent] Starting binary search resize...');

      const result = await findOptimalSize(element, aspectRatio, {
        minSize: 40,
        maxSize: 4096,
        safetyMargin: 1,
        logger: {
          log: (msg) => console.log(`[DynamicComponent] ${msg}`),
          warn: (msg) => console.warn(`[DynamicComponent] ${msg}`)
        }
      });

      setIsResizing(false);

      if (result) {
        console.log(`[DynamicComponent] Final size: ${result.width}×${result.height}`);
        if (onSizeChange) {
          onSizeChange({
            width: result.width,
            height: result.height,
            naturalSize: result.naturalSize
          });
        }
      }
    };

    performResize();
  }, [aspectRatio, renderError]);

  const handleDragResize = (e) => {
    e.preventDefault();
    const element = componentRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = rect.width;
    const startH = rect.height;

    const r = maintainAspectRatio ? aspectRatio : null;

    console.log(`[DynamicComponent] 🖱️ Drag Start: ${startW}×${startH}, ratio: ${r || 'free'}`);

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      let nw, nh;

      if (maintainAspectRatio && r) {
        nw = Math.max(40, Math.round(startW + dx));
        nh = Math.max(40, Math.round(nw / r));
      } else {
        const dy = ev.clientY - startY;
        nw = Math.max(40, Math.round(startW + dx));
        nh = Math.max(40, Math.round(startH + dy));
      }

      element.style.width = `${nw}px`;
      element.style.height = `${nh}px`;
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const finalRect = element.getBoundingClientRect();
      const finalW = Math.round(finalRect.width);
      const finalH = Math.round(finalRect.height);

      console.log(`[DynamicComponent] 🖱️ Drag End: ${finalW}×${finalH}`);

      if (onSizeChange) {
        onSizeChange({
          width: finalW,
          height: finalH,
          naturalSize: null
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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
      ref={frameRef}
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <div
        ref={componentRef}
        style={{
          width: suggestedWidth,
          height: suggestedHeight,
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <Component />
      </div>
      {isResizing && (
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
          Resizing...
        </div>
      )}
      {enableDragResize && !renderError && (
        <div
          onMouseDown={handleDragResize}
          style={{
            position: 'absolute',
            width: 14,
            height: 14,
            right: -7,
            bottom: -7,
            background: '#007AFF',
            borderRadius: 4,
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1px #3a3a3c',
            cursor: 'se-resize',
            zIndex: 5
          }}
          title="Drag to resize"
        />
      )}
    </div>
  );
}
