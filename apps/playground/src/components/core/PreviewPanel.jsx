import React, { useState, useEffect } from 'react';
import WidgetRenderer from '../WidgetRenderer.jsx';
import DownloadButton from '../../DownloadButton.jsx';
import DimensionLines from '../DimensionLines.jsx';

export default function PreviewPanel({
  previewSpec,
  generatedCode,
  widgetFrameRef,
  ratioInput,
  setRatioInput,
  autoSizing,
  handleAutoResizeByRatio,
  enableAutoResize,
  setEnableAutoResize,
  handleDownloadWidget,
  isDownloading = false,
  title = 'Preview',
  dotColor = '#BF5AF2'
}) {
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = widgetFrameRef.current;
    if (!el) return;

    const updateSize = () => {
      const child = el.firstElementChild;
      if (child) {
        const rect = child.getBoundingClientRect();
        setFrameSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [widgetFrameRef, previewSpec, generatedCode]);

  return (
    <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        flexShrink: 0,
        minWidth: 0,
        flexWrap: 'wrap',
        rowGap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dotColor
          }} />
          <h2 style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            color: '#f5f5f7',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </h2>
        </div>
        <div style={{ flex: 1, minWidth: 0 }} />
        <input
          value={ratioInput}
          onChange={(e) => setRatioInput(e.target.value)}
          placeholder="16:9 or 1.777"
          style={{
            flex: '0 1 120px',
            minWidth: 80,
            maxWidth: 120,
            height: 28,
            fontSize: 12,
            color: '#f5f5f7',
            backgroundColor: '#2c2c2e',
            border: '1px solid #3a3a3c',
            borderRadius: 6,
            padding: '0 8px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#007AFF')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#3a3a3c')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
          <span style={{ fontSize: 12, color: '#d1d1d6', whiteSpace: 'nowrap' }}>AutoResize</span>
          <button
            onClick={() => setEnableAutoResize((v) => !v)}
            aria-pressed={enableAutoResize}
            title="Toggle AutoResize"
            style={{
              width: 44,
              height: 24,
              borderRadius: 9999,
              border: '1px solid #3a3a3c',
              backgroundColor: enableAutoResize ? '#34C759' : '#2c2c2e',
              position: 'relative',
              cursor: 'pointer',
              outline: 'none',
              padding: 0,
              flexShrink: 0
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: enableAutoResize ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.15s ease'
              }}
            />
          </button>
        </div>
        <button
          onClick={() => previewSpec && handleAutoResizeByRatio(previewSpec, ratioInput)}
          disabled={autoSizing}
          style={{
            flex: '0 0 auto',
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: autoSizing ? '#3a3a3c' : '#2c2c2e',
            color: '#f5f5f7',
            border: '1px solid #3a3a3c',
            borderRadius: 6,
            cursor: autoSizing ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            if (!autoSizing) e.currentTarget.style.backgroundColor = '#3a3a3c';
          }}
          onMouseLeave={(e) => {
            if (!autoSizing) e.currentTarget.style.backgroundColor = '#2c2c2e';
          }}
          title="Auto-resize to aspect ratio"
        >
          {autoSizing ? 'Sizing…' : 'Auto-Resize'}
        </button>
        {handleDownloadWidget && (
          <DownloadButton
            onClick={handleDownloadWidget}
            isDisabled={!previewSpec}
            isLoading={isDownloading || autoSizing}
            statusText={isDownloading ? 'Downloading...' : (autoSizing ? 'Sizing...' : '')}
          />
        )}
      </div>
      <div style={{
        flex: 1,
        backgroundColor: '#0d0d0d',
        padding: 24,
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 0,
        boxSizing: 'border-box',
        border: '1px solid #3a3a3c',
        overflow: 'auto',
        position: 'relative'
      }}>
        {previewSpec && generatedCode ? (
          <div ref={widgetFrameRef} style={{ display: 'inline-block', position: 'relative' }}>
            <WidgetRenderer jsxCode={generatedCode} />
            {autoSizing && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.12)',
                zIndex: 3,
                pointerEvents: 'none'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" role="img">
                  <circle cx="12" cy="12" r="10" stroke="#8e8e93" strokeWidth="3" fill="none" opacity="0.25" />
                  <path d="M12 2 a10 10 0 0 1 0 20" stroke="#007AFF" strokeWidth="3" strokeLinecap="round" fill="none">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
            )}
            {frameSize.width > 0 && frameSize.height > 0 && (
              <DimensionLines width={frameSize.width} height={frameSize.height} />
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#6e6e73', fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 9h8M8 12h8M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>Generate a widget to see preview</div>
          </div>
        )}
      </div>
    </div>
  );
}
