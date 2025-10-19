import React from 'react';
import WidgetRenderer from '../../components/WidgetRenderer.jsx';
import DownloadButton from '../../DownloadButton.jsx';
import { parseCurrentSpecObject } from '../../utils/specUtils.js';
import usePlaygroundStore from '../../store/index.js';

export default function PreviewPanel({
  ratioInput,
  setRatioInput,
  enableAutoResize,
  setEnableAutoResize,
  autoSizing,
  operationMode,
  handleAutoResizeByRatio,
  editedSpec,
  currentExample,
  setEditedSpec,
  handleDownloadWidget,
  isLoading,
  previewContainerRef,
  widgetFrameRef,
  setFrameEl,
  selectedExample,
  generatedJSX,
  frameSize
}) {
  const { setFinalSize, writebackSpecSize, removeSpecSize, compileToken, widgetSpec } = usePlaygroundStore();

  const isLocked = operationMode !== 'idle';
  const isCompiling = operationMode === 'compiling';
  const isAutoresizing = operationMode === 'autoresizing';
  const isDownloading = operationMode === 'downloading';

  const getStatusText = () => {
    if (isCompiling) return 'Compiling...';
    if (isAutoresizing) return 'Auto-sizing...';
    if (isDownloading) return 'Downloading...';
    return '';
  };

  const handleDragResize = (e) => {
    e.preventDefault();
    const frame = widgetFrameRef.current;
    if (!frame) return;
    const widgetElement = frame.firstElementChild;
    if (!widgetElement) return;

    const rect = widgetElement.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = rect.width;
    const startH = rect.height;

    let r = null;
    if (enableAutoResize) {
      try {
        const obj = parseCurrentSpecObject(editedSpec, currentExample.spec);
        const v = obj?.widget?.aspectRatio;
        if (typeof v === 'number' && isFinite(v) && v > 0) r = v;
      } catch {}
    }

    console.log(`🖱️ [Drag Start] Starting drag resize, ratio: ${r || 'free'}`);

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      let nw, nh;

      if (enableAutoResize && r) {
        nw = Math.max(40, Math.round(startW + dx));
        nh = Math.max(40, Math.round(nw / r));
      } else {
        const dy = ev.clientY - startY;
        nw = Math.max(40, Math.round(startW + dx));
        nh = Math.max(40, Math.round(startH + dy));
      }

      widgetElement.style.width = `${nw}px`;
      widgetElement.style.height = `${nh}px`;

      setFinalSize({ width: Math.round(nw), height: Math.round(nh) });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const finalRect = widgetElement.getBoundingClientRect();
      const finalW = Math.round(finalRect.width);
      const finalH = Math.round(finalRect.height);

      console.log(`🖱️ [Drag End] Final size: ${finalW}×${finalH}, writing back to spec...`);

      if (writebackSpecSize) {
        writebackSpecSize(finalW, finalH);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'preview' }}>
      <h2 style={{
        fontSize: 15,
        fontWeight: 600,
        marginBottom: 8,
        color: '#f5f5f7',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#007AFF'
        }} />
        Preview
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <input
            value={ratioInput}
            onChange={(e) => setRatioInput(e.target.value)}
            placeholder="16:9 or 1.777"
            disabled={isLocked}
            style={{
              width: 120,
              height: 28,
              fontSize: 12,
              color: isLocked ? '#8e8e93' : '#f5f5f7',
              backgroundColor: isLocked ? '#1c1c1e' : '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 6,
              padding: '0 8px',
              outline: 'none',
              cursor: isLocked ? 'not-allowed' : 'text'
            }}
            onFocus={(e) => !isLocked && (e.currentTarget.style.borderColor = '#007AFF')}
            onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3c'}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: isLocked ? '#8e8e93' : '#d1d1d6' }}>AutoResize</span>
            <button
              onClick={() => {
                if (isLocked) return;

                const newValue = !enableAutoResize;
                setEnableAutoResize(newValue);

                if (newValue && widgetSpec) {
                  const hasWidth = widgetSpec.widget?.width !== undefined;
                  const hasHeight = widgetSpec.widget?.height !== undefined;
                  const aspectRatio = widgetSpec.widget?.aspectRatio;

                  if (!hasWidth && !hasHeight && typeof aspectRatio === 'number' && isFinite(aspectRatio) && aspectRatio > 0) {
                    console.log(`⚡ [AutoResize Toggle] Executing auto-resize with ratio: ${aspectRatio}`);
                    handleAutoResizeByRatio(aspectRatio);
                  }
                }
              }}
              aria-pressed={enableAutoResize}
              disabled={isLocked}
              title={isLocked ? 'Locked during operation' : 'Toggle AutoResize'}
              style={{
                width: 44,
                height: 24,
                borderRadius: 9999,
                border: '1px solid #3a3a3c',
                backgroundColor: enableAutoResize ? '#34C759' : '#2c2c2e',
                position: 'relative',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                outline: 'none',
                padding: 0,
                opacity: isLocked ? 0.5 : 1
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
            onClick={() => handleAutoResizeByRatio()}
            disabled={isLocked}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: isLocked ? '#3a3a3c' : '#2c2c2e',
              color: isLocked ? '#8e8e93' : '#f5f5f7',
              border: '1px solid #3a3a3c',
              borderRadius: 6,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.backgroundColor = '#3a3a3c'; }}
            onMouseLeave={(e) => { if (!isLocked) e.currentTarget.style.backgroundColor = '#2c2c2e'; }}
            title={isLocked ? getStatusText() : 'Auto-resize to aspect ratio'}
          >
            {isAutoresizing ? 'Sizing…' : 'Auto-Resize'}
          </button>
          <button
            onClick={async () => {
              if (!isLocked) {
                setEditedSpec('');
                await removeSpecSize(widgetFrameRef);
              }
            }}
            disabled={isLocked}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: isLocked ? '#3a3a3c' : '#2c2c2e',
              color: isLocked ? '#8e8e93' : '#f5f5f7',
              border: '1px solid #3a3a3c',
              borderRadius: 6,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.backgroundColor = '#3a3a3c')}
            onMouseLeave={(e) => !isLocked && (e.currentTarget.style.backgroundColor = '#2c2c2e')}
            title={isLocked ? getStatusText() : 'Restore widget size'}
          >
            Restore
          </button>
          <DownloadButton
            onClick={handleDownloadWidget}
            isDisabled={isLocked}
            statusText={getStatusText()}
          />
        </div>
      </h2>
      <div style={{
        backgroundColor: '#0d0d0d',
        padding: 24,
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        minHeight: 0,
        boxSizing: 'border-box',
        border: '1px solid #3a3a3c',
        position: 'relative',
        overflow: 'auto'
      }} ref={previewContainerRef}>
        <div
          ref={(node) => {
            setFrameEl(node);
            widgetFrameRef.current = node;
          }}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <WidgetRenderer jsxCode={generatedJSX} />
          {isLoading && (
            <div
              style={{
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
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" role="img" aria-label="Loading">
                <circle cx="12" cy="12" r="10" stroke="#8e8e93" strokeWidth="3" fill="none" opacity="0.25" />
                <path d="M12 2 a10 10 0 0 1 0 20" stroke="#007AFF" strokeWidth="3" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
                </path>
              </svg>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 4
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: -20,
                height: 0
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: -5, width: 1, height: 12, background: '#8e8e93' }} />
              <div style={{ position: 'absolute', right: 0, top: -5, width: 1, height: 12, background: '#8e8e93' }} />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 1,
                  height: 1,
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(142,142,147,0.9) 0 6px, rgba(142,142,147,0) 6px 12px)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  transform: 'translate(-50%, -60%)',
                  background: 'rgba(44,44,46,0.9)',
                  color: '#d1d1d6',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 9999,
                  padding: '3px 10px',
                  fontSize: 11,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  letterSpacing: 0.2,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {frameSize.width}px
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 'calc(100% + 16px)',
                width: 0
              }}
            >
              <div style={{ position: 'absolute', left: -5, top: 0, width: 12, height: 1, background: '#8e8e93' }} />
              <div style={{ position: 'absolute', left: -5, bottom: 0, width: 12, height: 1, background: '#8e8e93' }} />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 1,
                  width: 1,
                  backgroundImage: 'repeating-linear-gradient(180deg, rgba(142,142,147,0.9) 0 6px, rgba(142,142,147,0) 6px 12px)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(44,44,46,0.9)',
                  color: '#d1d1d6',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 9999,
                  padding: '3px 10px',
                  fontSize: 11,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  letterSpacing: 0.2,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {frameSize.height}px
              </div>
            </div>
          </div>
          <div
            onMouseDown={(e) => !isLocked && handleDragResize(e)}
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              right: -7,
              bottom: -7,
              background: isLocked ? '#8e8e93' : '#007AFF',
              borderRadius: 4,
              border: '2px solid #ffffff',
              boxShadow: '0 0 0 1px #3a3a3c',
              cursor: isLocked ? 'not-allowed' : 'se-resize',
              zIndex: 5,
              opacity: isLocked ? 0.5 : 1
            }}
            title={isLocked ? getStatusText() : 'Drag to resize'}
          />
        </div>
      </div>
    </div>
  );
}
