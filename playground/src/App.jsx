import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TreeView from './TreeView.jsx';
import WidgetFrame from './WidgetFrame.jsx';
import ImageToWidget from './ImageToWidget.jsx';
import Prompt2Spec from './Prompt2Spec.jsx';
import Documentation from './Documentation.jsx';
import DownloadButton from './DownloadButton.jsx';
import { Icon } from '@widget-factory/primitives';
import html2canvas from 'html2canvas';
import { examples } from './constants/examples.js';
import { parseAspectRatio, parseCurrentSpecObject, applySizeToSpec, restoreSizeInSpec, formatSpecWithRootLast } from './utils/specUtils.js';
import AppHeader from './components/Header/AppHeader.jsx';
import MaterialsModal from './components/MaterialsModal/index.jsx';
import useWidgetCompiler from './hooks/useWidgetCompiler.js';
import useWidgetFrame from './hooks/useWidgetFrame.js';

function App() {
  const [activeTab, setActiveTab] = useState('presets');
  const [selectedExample, setSelectedExample] = useState('weatherSmallLight');
  const [editedSpec, setEditedSpec] = useState('');
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const previewContainerRef = useRef(null);
  const widgetFrameRef = useRef(null);
  const [frameEl, setFrameEl] = useState(null);
  const treeContainerRef = useRef(null);
  const specTextareaRef = useRef(null);
  const latestWriteTokenRef = useRef(0);
  const expectedSizeRef = useRef(null);
  const resizingRef = useRef(false);
  const autoResizeTokenRef = useRef(0);
  const [ratioInput, setRatioInput] = useState('');
  const [autoSizing, setAutoSizing] = useState(false);
  const [enableAutoResize, setEnableAutoResize] = useState(true);
  const [presetResetKey, setPresetResetKey] = useState(0);

  const handleSelectNode = (path) => setSelectedPath(prev => (prev === path ? null : path));

  useEffect(() => {
    const onDocClick = (e) => {
      if (!treeContainerRef.current) return;
      if (!treeContainerRef.current.contains(e.target)) {
        setSelectedPath(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const currentExample = examples[selectedExample];
  const currentSpec = editedSpec || JSON.stringify(currentExample.spec, null, 2);

  const { generatedCode, treeRoot, isLoading, setIsLoading } = useWidgetCompiler(
    editedSpec,
    currentExample,
    resizingRef,
    latestWriteTokenRef,
    expectedSizeRef
  );

  const handleSpecChange = (value) => {
    setEditedSpec(value);
  };

  const handleExampleChange = (key) => {
    console.log(`🔄 [Preset Change] Switching to: ${key}`);
    console.log('🧹 [Cleanup] Resetting all state and refs...');

    autoResizeTokenRef.current += 1;
    console.log(`🎫 [Cleanup] AutoResize token invalidated: ${autoResizeTokenRef.current}`);

    setSelectedExample(key);
    setEditedSpec('');
    setSelectedPath(null);
    setFrameSize({ width: 0, height: 0 });
    setIsLoading(false);
    setRatioInput('');
    setAutoSizing(false);

    expectedSizeRef.current = null;
    resizingRef.current = false;
    latestWriteTokenRef.current = 0;

    widgetFrameRef.current = null;
    setFrameEl(null);

    setPresetResetKey(prev => prev + 1);

    console.log('✨ [Cleanup] Complete, widgetFrameRef cleared');
  };

  const handleDownloadWidget = async () => {
    const widgetElement = widgetFrameRef.current?.firstElementChild;
    if (!widgetElement) {
      console.error('Widget element not found');
      return;
    }

    try {
      const canvas = await html2canvas(widgetElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `widget-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to download widget:', error);
    }
  };

  const waitForFrameToSize = async (targetW, targetH, timeoutMs = 3000) => {
    const start = Date.now();
    for (;;) {
      const node = widgetFrameRef.current;
      if (!node) break;
      const rect = node.getBoundingClientRect();
      if (Math.round(rect.width) === Math.round(targetW) && Math.round(rect.height) === Math.round(targetH)) {
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));
        return true;
      }
      if (Date.now() - start > timeoutMs) return false;
      await new Promise((r) => setTimeout(r, 16));
    }
    return false;
  };

  const measureOverflow = () => {
    const frame = widgetFrameRef.current;
    if (!frame) return { fits: false };
    const root = frame.firstElementChild;
    if (!root) return { fits: false };
    const cw = root.clientWidth;
    const ch = root.clientHeight;
    const sw = root.scrollWidth;
    const sh = root.scrollHeight;

    // Base fit by scroll overflows
    let fits = sw <= cw && sh <= ch;

    // Treat root padding as a “protected zone”: descendants must not intersect it,
    // and nothing may extend outside the root bounds either.
    try {
      const rootRect = root.getBoundingClientRect();
      const cs = window.getComputedStyle(root);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const padT = parseFloat(cs.paddingTop) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      const innerLeft = rootRect.left + padL;
      const innerRight = rootRect.right - padR;
      const innerTop = rootRect.top + padT;
      const innerBottom = rootRect.bottom - padB;

      // Allow tiny sub-pixel tolerance to avoid flapping due to rounding
      const tol = 0.5;

      let crossesPaddingOrOutside = false;
      // Check all descendant boxes (skip the root itself)
      const all = root.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (el === root) continue;
        const r = el.getBoundingClientRect();
        // Ignore zero-size boxes
        if ((r.width || 0) <= 0 && (r.height || 0) <= 0) continue;

        // Outside root bounds at all (shouldn’t happen with overflow hidden, but guard anyway)
        if (r.left < rootRect.left - tol || r.right > rootRect.right + tol || r.top < rootRect.top - tol || r.bottom > rootRect.bottom + tol) {
          crossesPaddingOrOutside = true;
          break;
        }
        // Intersects root padding ring (i.e., breaches into padding area)
        if (r.left < innerLeft - tol || r.right > innerRight + tol || r.top < innerTop - tol || r.bottom > innerBottom + tol) {
          crossesPaddingOrOutside = true;
          break;
        }
      }

      if (crossesPaddingOrOutside) {
        fits = false;
      }
      return { fits, cw, ch, sw, sh };
    } catch (e) {
      // If any unexpected error occurs, fall back to the basic overflow check
      return { fits, cw, ch, sw, sh };
    }
  };

  const applySizeAndMeasure = async (w, h) => {
    resizingRef.current = true;
    applySizeToSpec(editedSpec, currentExample.spec, w, h, setEditedSpec);
    await waitForFrameToSize(w, h);
    const m = measureOverflow();
    return m;
  };

  const handleAutoResizeByRatio = async (ratioOverride) => {
    if (autoSizing) return;
    const r = ratioOverride ?? parseAspectRatio(ratioInput);
    if (!r) return;

    const currentToken = autoResizeTokenRef.current;
    console.log(`🎫 [AutoResize] Starting with token: ${currentToken}`);

    setAutoSizing(true);
    try {
      const frame = widgetFrameRef.current;
      const rect = frame ? frame.getBoundingClientRect() : null;
      const startW = rect ? Math.max(40, Math.round(rect.width)) : 200;
      const startH = Math.max(40, Math.round(startW / r));

      if (autoResizeTokenRef.current !== currentToken) {
        console.log(`🚫 [AutoResize] Token mismatch (${autoResizeTokenRef.current} !== ${currentToken}), aborting`);
        return;
      }

      let m = await applySizeAndMeasure(startW, startH);

      if (autoResizeTokenRef.current !== currentToken) {
        console.log(`🚫 [AutoResize] Token mismatch after initial measure, aborting`);
        return;
      }
      if (m.fits) {
        let low = 40;
        let high = startW;
        let best = { w: startW, h: startH };
        let lfit = false;
        const lm = await applySizeAndMeasure(low, Math.max(40, Math.round(low / r)));
        lfit = lm.fits;
        if (lfit) {
          best = { w: low, h: Math.max(40, Math.round(low / r)) };
        } else {
          while (high - low > 1) {
            if (autoResizeTokenRef.current !== currentToken) {
              console.log(`🚫 [AutoResize] Token mismatch in binary search loop, aborting`);
              return;
            }
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const mm = await applySizeAndMeasure(mid, mh);
            if (mm.fits) {
              best = { w: mid, h: mh };
              high = mid;
            } else {
              low = mid;
            }
          }
        }

        if (autoResizeTokenRef.current !== currentToken) {
          console.log(`🚫 [AutoResize] Token mismatch before final apply, aborting`);
          return;
        }

        await applySizeAndMeasure(best.w, best.h);
      } else {
        let low = startW;
        let high = startW;
        let mm = m;
        const maxCap = 4096;
        while (!mm.fits && high < maxCap) {
          if (autoResizeTokenRef.current !== currentToken) {
            console.log(`🚫 [AutoResize] Token mismatch in expansion loop, aborting`);
            return;
          }
          low = high;
          high = Math.min(maxCap, high * 2);
          const hh = Math.max(40, Math.round(high / r));
          mm = await applySizeAndMeasure(high, hh);
        }
        let best = mm.fits ? { w: high, h: Math.max(40, Math.round(high / r)) } : { w: low, h: Math.max(40, Math.round(low / r)) };
        if (mm.fits) {
          while (high - low > 1) {
            if (autoResizeTokenRef.current !== currentToken) {
              console.log(`🚫 [AutoResize] Token mismatch in second binary search loop, aborting`);
              return;
            }
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const m2 = await applySizeAndMeasure(mid, mh);
            if (m2.fits) {
              best = { w: mid, h: mh };
              high = mid;
            } else {
              low = mid;
            }
          }

          if (autoResizeTokenRef.current !== currentToken) {
            console.log(`🚫 [AutoResize] Token mismatch before final apply (expansion path), aborting`);
            return;
          }

          await applySizeAndMeasure(best.w, best.h);
        }
      }

      console.log(`✅ [AutoResize] Completed successfully with token: ${currentToken}`);
    } finally {
      resizingRef.current = false;
      setAutoSizing(false);
    }
  };

  const handleWidgetGenerated = async (widgetSpec, aspectRatio) => {
    const specStr = JSON.stringify(widgetSpec, null, 2);
    setEditedSpec(specStr);
    setRatioInput(aspectRatio.toString());
  };

  const { frameSize, setFrameSize } = useWidgetFrame(
    frameEl,
    enableAutoResize,
    expectedSizeRef,
    setIsLoading,
    widgetFrameRef,
    editedSpec,
    currentExample,
    setRatioInput,
    handleAutoResizeByRatio
  );

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#1c1c1e',
      padding: '16px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMaterialsClick={() => setShowComponentsModal(true)}
      />

      {activeTab === 'presets' && (
        <div key="presets" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gridTemplateAreas: '"spec preview" "code tree"',
          gap: 12,
          minWidth: 0,
          flex: 1,
          minHeight: 0,
          paddingBottom: 16,
          gridAutoRows: 'minmax(0, 1fr)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>

          <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'spec' }}>
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
                backgroundColor: '#34C759'
              }} />
              WidgetSpec
              <select
                value={selectedExample}
                onChange={(e) => handleExampleChange(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: '#2c2c2e',
                  color: '#f5f5f7',
                  border: '1px solid #3a3a3c',
                  borderRadius: 6,
                  cursor: 'pointer',
                  outline: 'none',
                  marginLeft: 'auto'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007AFF'}
                onBlur={(e) => e.target.style.borderColor = '#3a3a3c'}
              >
                {Object.entries(examples).map(([key, { name }]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </h2>
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <textarea
                value={currentSpec}
                onChange={(e) => handleSpecChange(e.target.value)}
                spellCheck={false}
                ref={specTextareaRef}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 16,
                  fontSize: 13,
                  fontFamily: 'Monaco, Consolas, monospace',
                  backgroundColor: '#0d0d0d',
                  color: '#f5f5f7',
                  border: '1px solid #3a3a3c',
                  borderRadius: 10,
                  resize: 'none',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                  lineHeight: 1.6,
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007AFF'}
                onBlur={(e) => e.target.style.borderColor = '#3a3a3c'}
              />
            </div>
          </div>

          <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'code' }}>
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
                backgroundColor: '#FF9500'
              }} />
              Generated widget.jsx
            </h2>
            <div style={{
              flex: 1,
              minHeight: 0,
              borderRadius: 10,
              border: '1px solid #3a3a3c',
              backgroundColor: '#1e1e1e',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <SyntaxHighlighter
                  language="jsx"
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    fontSize: 13,
                    borderRadius: 10,
                    whiteSpace: 'pre',
                    minHeight: 0,
                    overflow: 'visible'
                  }}
                >
                  {generatedCode}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>

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
                  style={{
                    width: 120,
                    height: 28,
                    fontSize: 12,
                    color: '#f5f5f7',
                    backgroundColor: '#2c2c2e',
                    border: '1px solid #3a3a3c',
                    borderRadius: 6,
                    padding: '0 8px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#007AFF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#3a3a3c'}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#d1d1d6' }}>AutoResize</span>
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
                      padding: 0
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
                  disabled={autoSizing}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: autoSizing ? '#3a3a3c' : '#2c2c2e',
                    color: '#f5f5f7',
                    border: '1px solid #3a3a3c',
                    borderRadius: 6,
                    cursor: autoSizing ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (!autoSizing) e.currentTarget.style.backgroundColor = '#3a3a3c'; }}
                  onMouseLeave={(e) => { if (!autoSizing) e.currentTarget.style.backgroundColor = '#2c2c2e'; }}
                  title="Auto-resize to aspect ratio"
                >
                  {autoSizing ? 'Sizing…' : 'Auto-Resize'}
                </button>
                <button
                  onClick={() => restoreSizeInSpec(editedSpec, currentExample.spec, setEditedSpec)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: '#2c2c2e',
                    color: '#f5f5f7',
                    border: '1px solid #3a3a3c',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c2c2e'}
                  title="Restore widget size"
                >
                  Restore
                </button>
                <DownloadButton
                  onClick={handleDownloadWidget}
                  isDisabled={isLoading || autoSizing}
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
                <WidgetFrame resetKey={`${selectedExample}-${presetResetKey}`} />
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
                {/* Measurement overlays for width / height (no aspect ratio) */}
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
                  {/* Horizontal measurement line (above widget) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: -20,
                      height: 0
                    }}
                  >
                    {/* end ticks */}
                    <div style={{ position: 'absolute', left: 0, top: -5, width: 1, height: 12, background: '#8e8e93' }} />
                    <div style={{ position: 'absolute', right: 0, top: -5, width: 1, height: 12, background: '#8e8e93' }} />
                    {/* center dashed line */}
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
                    {/* label capsule */}
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

                  {/* Vertical measurement line (right of widget) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 'calc(100% + 16px)',
                      width: 0
                    }}
                  >
                    {/* end ticks */}
                    <div style={{ position: 'absolute', left: -5, top: 0, width: 12, height: 1, background: '#8e8e93' }} />
                    <div style={{ position: 'absolute', left: -5, bottom: 0, width: 12, height: 1, background: '#8e8e93' }} />
                    {/* center dashed line */}
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
                    {/* label capsule */}
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const frame = widgetFrameRef.current;
                    if (!frame) return;
                    const rect = frame.getBoundingClientRect();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startW = rect.width;
                    const startH = rect.height;
                    resizingRef.current = true;
                    let r = null;
                    if (enableAutoResize) {
                      try {
                        const obj = parseCurrentSpecObject(editedSpec, currentExample.spec);
                        const v = obj?.widget?.aspectRatio;
                        if (typeof v === 'number' && isFinite(v) && v > 0) r = v;
                      } catch {}
                    }

                    const onMove = (ev) => {
                      const dx = ev.clientX - startX;
                      if (enableAutoResize && r) {
                        const nw = Math.max(40, Math.round(startW + dx));
                        const nh = Math.max(40, Math.round(nw / r));
                        applySizeToSpec(editedSpec, currentExample.spec, nw, nh, setEditedSpec);
                      } else {
                        const dy = ev.clientY - startY;
                        const nw = Math.max(40, Math.round(startW + dx));
                        const nh = Math.max(40, Math.round(startH + dy));
                        applySizeToSpec(editedSpec, currentExample.spec, nw, nh, setEditedSpec);
                      }
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                      resizingRef.current = false;
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
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
              </div>
            </div>
          </div>

          <div ref={treeContainerRef} style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'tree' }}>
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
                backgroundColor: '#BF5AF2'
              }} />
              Tree
            </h2>
            <TreeView
              root={treeRoot}
              style={{ flex: 1, minHeight: 0 }}
              selectedPath={selectedPath}
              onSelect={handleSelectNode}
            />
          </div>
        </div>
      )}

      {activeTab === 'widget2spec' && (
        <div key="widget2spec" style={{ flex: 1, minHeight: 0, animation: 'fadeIn 0.2s ease-in-out' }}>
          <ImageToWidget onWidgetGenerated={handleWidgetGenerated} />
        </div>
      )}

      {activeTab === 'prompt2spec' && (
        <div key="prompt2spec" style={{ flex: 1, minHeight: 0, animation: 'fadeIn 0.2s ease-in-out' }}>
          <Prompt2Spec />
        </div>
      )}

      {activeTab === 'guides' && (
        <div key="guides" style={{ flex: 1, minHeight: 0, animation: 'fadeIn 0.2s ease-in-out' }}>
          <Documentation />
        </div>
      )}

      <MaterialsModal
        isOpen={showComponentsModal}
        onClose={() => setShowComponentsModal(false)}
      />
    </div>
  );
}

export default App;
