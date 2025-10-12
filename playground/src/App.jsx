import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import TreeView from './TreeView.jsx';
import Widget from './generated/Widget.jsx';
import ImageToWidget from './ImageToWidget.jsx';
import { Icon } from '@widget-factory/primitives';
import weatherSmallLight from './examples/weather-small-light.json';
import weatherMediumDark from './examples/weather-medium-dark.json';
import calendarSmallLight from './examples/calendar-small-light.json';
import calendarSmallDark from './examples/calendar-small-dark.json';
import notesSmallLight from './examples/notes-small-light.json';
import notesSmallDark from './examples/notes-small-dark.json';
import stockMediumDark from './examples/stock-medium-dark.json';
import remindersLargeLight from './examples/reminders-large-light.json';
import photoMediumLight from './examples/photo-medium-light.json';
import mapMediumDark from './examples/map-medium-dark.json';

function App() {
  const [activeTab, setActiveTab] = useState('presets');
  const [selectedExample, setSelectedExample] = useState('weatherSmallLight');
  const [editedSpec, setEditedSpec] = useState('');
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [modalTab, setModalTab] = useState('components');
  const [selectedPath, setSelectedPath] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [treeRoot, setTreeRoot] = useState(null);
  const previewContainerRef = useRef(null);
  const widgetFrameRef = useRef(null);
  const treeContainerRef = useRef(null);
  const specTextareaRef = useRef(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const latestWriteTokenRef = useRef(0);
  const expectedSizeRef = useRef(null);
  const resizingRef = useRef(false);
  const [ratioInput, setRatioInput] = useState('');
  const [autoSizing, setAutoSizing] = useState(false);
  const [iconColor, setIconColor] = useState('rgba(255, 255, 255, 0.85)');

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

  const examples = {
    weatherSmallLight: { name: 'Weather S-Light', spec: weatherSmallLight },
    weatherMediumDark: { name: 'Weather M-Dark', spec: weatherMediumDark },
    calendarSmallLight: { name: 'Calendar S-Light', spec: calendarSmallLight },
    calendarSmallDark: { name: 'Calendar S-Dark', spec: calendarSmallDark },
    notesSmallLight: { name: 'Notes S-Light', spec: notesSmallLight },
    notesSmallDark: { name: 'Notes S-Dark', spec: notesSmallDark },
    stockMediumDark: { name: 'Stock M-Dark', spec: stockMediumDark },
    remindersLargeLight: { name: 'Reminders L-Light', spec: remindersLargeLight },
    photoMediumLight: { name: 'Photo M-Light', spec: photoMediumLight },
    mapMediumDark: { name: 'Map M-Dark', spec: mapMediumDark }
  };

  const currentExample = examples[selectedExample];
  const currentSpec = editedSpec || JSON.stringify(currentExample.spec, null, 2);

  useEffect(() => {
    const compileAndWrite = async () => {
      try {
        const spec = editedSpec ? JSON.parse(editedSpec) : currentExample.spec;
        const jsx = compileWidgetSpecToJSX(spec);
        setGeneratedCode(jsx);
        setTreeRoot(spec?.widget || null);

        const isResizeWrite = !!resizingRef.current;
        if (isResizeWrite) {
          latestWriteTokenRef.current += 1;
          const token = latestWriteTokenRef.current;
          const w = spec?.widget?.width;
          const h = spec?.widget?.height;
          expectedSizeRef.current = typeof w === 'number' && typeof h === 'number' ? { width: Math.round(w), height: Math.round(h) } : null;
          setIsLoading(true);

          await fetch('/__write_widget', {
            method: 'POST',
            body: jsx,
            headers: { 'Content-Type': 'text/plain' }
          });

          if (!expectedSizeRef.current && latestWriteTokenRef.current === token) {
            setIsLoading(false);
          }
        } else {
          expectedSizeRef.current = null;
          setIsLoading(false);
          await fetch('/__write_widget', {
            method: 'POST',
            body: jsx,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      } catch (err) {
        setGeneratedCode(`// Error: ${err.message}`);
        setTreeRoot(null);
        setIsLoading(false);
      }
    };

    compileAndWrite();
  }, [currentExample, editedSpec]);

  const handleSpecChange = (value) => {
    setEditedSpec(value);
  };

  useEffect(() => {
    const el = widgetFrameRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: Math.round(rect.width), height: Math.round(rect.height) };
      setFrameSize(next);
      const expected = expectedSizeRef.current;
      if (expected && next.width === expected.width && next.height === expected.height) {
        setIsLoading(false);
      }
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Ensure `widget.root` is serialized as the last key in `widget`
  const formatSpecWithRootLast = (spec) => {
    if (!spec || typeof spec !== 'object') return spec;
    const w = spec.widget;
    if (!w || typeof w !== 'object' || !('root' in w)) return spec;
    const { root, ...rest } = w;
    // Reassemble with `root` placed last
    return { ...spec, widget: { ...rest, root } };
  };

  const handleExampleChange = (key) => {
    setSelectedExample(key);
    setEditedSpec('');
    setSelectedPath(null);
  };

  const parseCurrentSpecObject = () => {
    try {
      return editedSpec ? JSON.parse(editedSpec) : JSON.parse(JSON.stringify(currentExample.spec));
    } catch {
      return null;
    }
  };

  const applySizeToSpec = (width, height) => {
    const obj = parseCurrentSpecObject();
    if (!obj || !obj.widget) return;
    const next = { ...obj, widget: { ...obj.widget } };
    next.widget.width = Math.max(1, Math.round(width));
    next.widget.height = Math.max(1, Math.round(height));
    setEditedSpec(JSON.stringify(formatSpecWithRootLast(next), null, 2));
  };

  const restoreSizeInSpec = () => {
    const obj = parseCurrentSpecObject();
    if (!obj || !obj.widget) return;
    const next = { ...obj, widget: { ...obj.widget } };
    delete next.widget.width;
    delete next.widget.height;
    setEditedSpec(JSON.stringify(formatSpecWithRootLast(next), null, 2));
  };

  const parseAspectRatio = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    if (!s) return null;
    if (s.includes(':')) {
      const [a, b] = s.split(':');
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isFinite(na) || !isFinite(nb) || nb <= 0) return null;
      return na / nb;
    }
    const v = parseFloat(s);
    if (!isFinite(v) || v <= 0) return null;
    return v;
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
    applySizeToSpec(w, h);
    await waitForFrameToSize(w, h);
    const m = measureOverflow();
    return m;
  };

  const handleAutoResizeByRatio = async () => {
    if (autoSizing) return;
    const r = parseAspectRatio(ratioInput);
    if (!r) return;
    setAutoSizing(true);
    try {
      const frame = widgetFrameRef.current;
      const rect = frame ? frame.getBoundingClientRect() : null;
      const startW = rect ? Math.max(40, Math.round(rect.width)) : 200;
      const startH = Math.max(40, Math.round(startW / r));
      let m = await applySizeAndMeasure(startW, startH);
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
        await applySizeAndMeasure(best.w, best.h);
      } else {
        let low = startW;
        let high = startW;
        let mm = m;
        const maxCap = 4096;
        while (!mm.fits && high < maxCap) {
          low = high;
          high = Math.min(maxCap, high * 2);
          const hh = Math.max(40, Math.round(high / r));
          mm = await applySizeAndMeasure(high, hh);
        }
        let best = mm.fits ? { w: high, h: Math.max(40, Math.round(high / r)) } : { w: low, h: Math.max(40, Math.round(low / r)) };
        if (mm.fits) {
          while (high - low > 1) {
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
          await applySizeAndMeasure(best.w, best.h);
        }
      }
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
      <header style={{ marginBottom: 12, flexShrink: 0, borderBottom: '1px solid #2c2c2e', paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: '#f5f5f7', letterSpacing: '-0.3px' }}>
              Widget Factory
            </h1>
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab('presets')}
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: activeTab === 'presets' ? '#f5f5f7' : '#8e8e93',
                  border: 'none',
                  borderBottom: activeTab === 'presets' ? '2px solid #007AFF' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'presets') e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'presets') e.target.style.color = '#8e8e93';
                }}
              >
                Presets
              </button>
              <button
                onClick={() => setActiveTab('widget2spec')}
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: activeTab === 'widget2spec' ? '#f5f5f7' : '#8e8e93',
                  border: 'none',
                  borderBottom: activeTab === 'widget2spec' ? '2px solid #007AFF' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'widget2spec') e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'widget2spec') e.target.style.color = '#8e8e93';
                }}
              >
                Widget2Spec
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowComponentsModal(true)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: '#2c2c2e',
              color: '#f5f5f7',
              border: '1px solid #3a3a3c',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#3a3a3c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2c2c2e'}
          >
            Materials
          </button>
        </div>
      </header>

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
                <button
                  onClick={handleAutoResizeByRatio}
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
                  onClick={restoreSizeInSpec}
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
                ref={widgetFrameRef}
                style={{ position: 'relative', display: 'inline-block' }}
              >
                <Widget />
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

                    const onMove = (ev) => {
                      const dx = ev.clientX - startX;
                      const dy = ev.clientY - startY;
                      const nw = Math.max(40, Math.round(startW + dx));
                      const nh = Math.max(40, Math.round(startH + dy));
                      applySizeToSpec(nw, nh);
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

      {showComponentsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowComponentsModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1c1c1e',
              borderRadius: 16,
              padding: 32,
              maxWidth: '1200px',
              width: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #3a3a3c'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#f5f5f7' }}>
                  Materials
                </h2>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => setModalTab('components')}
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      color: modalTab === 'components' ? '#f5f5f7' : '#8e8e93',
                      border: 'none',
                      borderBottom: modalTab === 'components' ? '2px solid #007AFF' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (modalTab !== 'components') e.target.style.color = '#f5f5f7';
                    }}
                    onMouseLeave={(e) => {
                      if (modalTab !== 'components') e.target.style.color = '#8e8e93';
                    }}
                  >
                    Components
                  </button>
                  <button
                    onClick={() => setModalTab('icons')}
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      color: modalTab === 'icons' ? '#f5f5f7' : '#8e8e93',
                      border: 'none',
                      borderBottom: modalTab === 'icons' ? '2px solid #007AFF' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (modalTab !== 'icons') e.target.style.color = '#f5f5f7';
                    }}
                    onMouseLeave={(e) => {
                      if (modalTab !== 'icons') e.target.style.color = '#8e8e93';
                    }}
                  >
                    Icons
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowComponentsModal(false)}
                style={{
                  backgroundColor: '#2c2c2e',
                  border: '1px solid #3a3a3c',
                  color: '#f5f5f7',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {modalTab === 'components' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
                  Flex Usage
                </h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 13, color: '#98989d' }}>
                    Use CSS-like shorthand or longhand. Longhand overrides shorthand.
                  </div>
                  <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                    Shorthand: flex: 0 | "0 0 auto" | "1 0 auto" | "1 1 auto"
                  </div>
                  <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                    Longhand: flexGrow / flexShrink / flexBasis (overrides flex)
                  </div>
                  <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                    Text default: 0 1 auto. Fixed media (Icon/Image/MapImage/AppLogo/Checkbox) default: none (0 0 auto).
                  </div>
                  <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                    Sparkline uses pixel width/height (no responsive); control size via width/height or parent layout.
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
                  Text Components
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Text</code> - Title/Heading
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Main headings and important text
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: fontSize (default: 18), color, fontWeight (default: 400), align
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      Default flex: 0 1 auto. Fill space: flex="1 0 auto".
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Text</code> - Label
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Secondary text and labels
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: fontSize (default: 13), color (#666666), fontWeight (default: 400), align
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      Default flex: 0 1 auto.
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Text</code> - Metric
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Numbers with tabular figures
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: fontSize (default: 32), color, fontWeight (default: 600), align
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      Default flex: 0 1 auto.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
                  Media Components
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Icon</code> - Icon
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      SF Symbols style icons
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginBottom: 8 }}>
                      Props: size (default: 20), color, name (required)
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Default flex: none (0 0 auto). Use flex to override if needed.
                    </div>
                    <div style={{ fontSize: 12, color: '#98989d', marginTop: 12 }}>
                      View all icons in the "Icons" tab above.
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Image</code> - Image
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Display images from URLs
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: width (required), height (required), url (required), borderRadius (default: 0)
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      objectFit: cover, Default flex: none (0 0 auto).
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>MapImage</code> - Map Image
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Display map images
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: width (required), height (required), url (required)
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      objectFit: cover, Default flex: none (0 0 auto).
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>AppLogo</code> - App Logo
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      App icon with first letter
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: size (default: 20), name (required), backgroundColor (default: #007AFF)
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      Default flex: none (0 0 auto).
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
                  Chart Components
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Sparkline</code> - Sparkline
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Small line chart for trends
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: width (default: 80), height (default: 40), color (default: #34C759), data (required array)
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      Uses pixel width/height; not responsive by default. Control layout via parent or width.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
                  Control Components
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>Checkbox</code> - Checkbox
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Circular checkbox
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: size (default: 20), checked (default: false), color (default: #FF3B30)
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
                      Default flex: none (0 0 auto).
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
                  Layout
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
                      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>container</code> - Flex Container
                    </div>
                    <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
                      Flexbox layout container
                    </div>
                    <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
                      Props: direction (row|col), gap, padding, alignMain (start|end|center|between), alignCross (start|end|center), flex, backgroundColor
                    </div>
                  </div>
                </div>
              </div>
            </div>
              )}

              {modalTab === 'icons' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                  <div style={{
                    backgroundColor: '#2c2c2e',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={iconColor.startsWith('#') ? iconColor : '#ffffff'}
                        onChange={(e) => setIconColor(e.target.value)}
                        style={{
                          width: 40,
                          height: 40,
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          backgroundColor: 'transparent'
                        }}
                      />
                      <input
                        type="text"
                        value={iconColor}
                        onChange={(e) => setIconColor(e.target.value)}
                        placeholder="Color (hex, rgba, etc.)"
                        style={{
                          backgroundColor: '#1c1c1e',
                          border: '1px solid #3a3a3c',
                          borderRadius: 6,
                          padding: '8px 12px',
                          color: '#f5f5f7',
                          fontSize: 13,
                          fontFamily: 'Monaco, monospace',
                          width: 220,
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007AFF'}
                        onBlur={(e) => e.target.style.borderColor = '#3a3a3c'}
                      />
                    </div>
                    <button
                      onClick={() => setIconColor('rgba(255, 255, 255, 0.85)')}
                      style={{
                        backgroundColor: '#007AFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0051D5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#007AFF'}
                    >
                      Restore Default
                    </button>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginLeft: 'auto'
                    }}>
                      <span style={{ fontSize: 12, color: '#8e8e93' }}>Preview:</span>
                      <Icon name="star.fill" size={28} color={iconColor} />
                    </div>
                  </div>
                  {(() => {
                    const iconCategories = {
                      'Common': ['circle.fill', 'checkmark', 'xmark', 'checkmark.circle.fill', 'xmark.circle.fill', 'exclamationmark.triangle.fill', 'info.circle.fill', 'plus', 'minus', 'ellipsis', 'star.fill', 'heart.fill', 'bell.fill', 'house.fill', 'gear', 'person.fill'],
                      'Numbers': ['1.circle.fill', '2.circle.fill', '3.circle.fill', '4.circle.fill', '5.circle.fill', '6.circle.fill', '7.circle.fill', '8.circle.fill', '9.circle.fill', '0.circle.fill'],
                      'Calendar & Time': ['calendar', '1.calendar', '7.calendar', '15.calendar', '31.calendar', 'clock.fill', 'alarm.fill', 'timer', 'stopwatch.fill', 'hourglass'],
                      'Weather': ['sun.max.fill', 'moon.fill', 'moon.stars.fill', 'cloud.fill', 'cloud.sun.fill', 'cloud.rain.fill', 'cloud.bolt.fill', 'cloud.snow.fill', 'snowflake', 'wind', 'drop.fill', 'thermometer.sun.fill'],
                      'Navigation': ['arrow.up', 'arrow.down', 'arrow.left', 'arrow.right', 'chevron.up', 'chevron.down', 'chevron.left', 'chevron.right', 'arrow.clockwise', 'arrow.uturn.left', 'location.fill'],
                      'Files & Media': ['doc.fill', 'folder.fill', 'photo.fill', 'camera.fill', 'video.fill', 'music.note', 'book.fill', 'bookmark.fill'],
                      'Communication': ['envelope.fill', 'phone.fill', 'message.fill', 'bubble.left.fill', 'paperplane.fill', 'mic.fill', 'video.fill'],
                      'Actions': ['square.and.arrow.up.fill', 'square.and.arrow.down.fill', 'trash.fill', 'pencil', 'scissors', 'link', 'magnifyingglass', 'eye.fill'],
                      'People & Social': ['person.fill', 'person.2.fill', 'person.3.fill', 'person.crop.circle.fill', 'heart.fill', 'star.fill', 'hand.thumbsup.fill'],
                      'Shopping': ['cart.fill', 'bag.fill', 'creditcard.fill', 'dollarsign.circle.fill', 'giftcard.fill', 'tag.fill', 'percent'],
                      'Health & Fitness': ['heart.circle.fill', 'flame.fill', 'figure.walk', 'figure.run', 'dumbbell.fill', 'cross.fill', 'pills.fill'],
                      'Travel & Places': ['car.fill', 'airplane', 'bicycle', 'map.fill', 'mappin.fill', 'house.fill', 'building.fill', 'globe'],
                      'Tech & Devices': ['wifi', 'antenna.radiowaves.left.and.right', 'battery.100percent', 'bolt.fill', 'phone.fill', 'laptopcomputer', 'desktopcomputer', 'applewatch'],
                      'Charts & Data': ['chart.bar.fill', 'chart.pie.fill', 'chart.line.uptrend.xyaxis', 'waveform', 'number', 'percent', 'equal'],
                      'Shapes': ['circle', 'circle.fill', 'square', 'square.fill', 'triangle', 'triangle.fill', 'diamond.fill', 'star.fill', 'heart.fill', 'seal.fill'],
                      'Health & Fitness': ['heart', 'heart.fill', 'heart.circle', 'heart.circle.fill', 'heart.square', 'heart.square.fill', 'heart.text.square', 'heart.text.square.fill', 'bolt.heart', 'bolt.heart.fill', 'cross', 'cross.fill', 'cross.circle', 'cross.circle.fill', 'cross.case', 'cross.case.fill', 'cross.vial', 'cross.vial.fill', 'pills', 'pills.fill', 'pills.circle', 'pills.circle.fill', 'syringe', 'syringe.fill', 'bandage', 'bandage.fill', 'stethoscope', 'stethoscope.circle', 'stethoscope.circle.fill', 'thermometer', 'thermometer.low', 'thermometer.medium', 'thermometer.high', 'thermometer.variable.and.figure', 'thermometer.variable.and.figure.circle', 'thermometer.variable.and.figure.circle.fill', 'iv.fluid.bag', 'iv.fluid.bag.fill', 'eyeglasses', 'eyeglasses.circle', 'eyeglasses.circle.fill', 'allergens', 'allergens.fill', 'allergens.circle', 'allergens.circle.fill', 'medical.thermometer', 'medical.thermometer.fill', 'flame', 'flame.fill', 'flame.circle', 'flame.circle.fill', 'drop', 'drop.fill', 'drop.triangle', 'drop.triangle.fill', 'drop.circle', 'drop.circle.fill', 'figure', 'figure.walk', 'figure.run', 'figure.stand', 'figure.wave', 'figure.walk.arrival', 'figure.walk.departure', 'figure.run.treadmill', 'figure.cooldown', 'figure.strengthtraining.traditional', 'figure.yoga', 'figure.pilates', 'figure.mind.and.body', 'figure.flexibility', 'figure.stairs', 'figure.step.training', 'figure.dance', 'figure.roll', 'figure.and.child.holdinghands', 'dumbbell', 'dumbbell.fill', 'bicycle', 'bicycle.circle', 'bicycle.circle.fill', 'tennis.racket', 'tennisball', 'tennisball.fill', 'basketball', 'basketball.fill', 'football', 'football.fill', 'baseball', 'baseball.fill', 'soccerball', 'soccerball.inverse', 'hockey.puck', 'hockey.puck.fill', 'trophy', 'trophy.fill', 'trophy.circle', 'trophy.circle.fill', 'medal', 'medal.fill', 'medal.star', 'medal.star.fill', 'target', 'scope'],
                      'Location & Travel': ['location', 'location.fill', 'location.circle', 'location.circle.fill', 'location.square', 'location.square.fill', 'location.slash', 'location.slash.fill', 'location.slash.circle', 'location.slash.circle.fill', 'location.north', 'location.north.fill', 'location.north.circle', 'location.north.circle.fill', 'location.north.line', 'location.north.line.fill', 'location.viewfinder', 'map', 'map.fill', 'map.circle', 'map.circle.fill', 'mappin', 'mappin.circle', 'mappin.circle.fill', 'mappin.square', 'mappin.square.fill', 'mappin.slash', 'mappin.slash.circle', 'mappin.slash.circle.fill', 'mappin.and.ellipse', 'mappin.and.ellipse.circle', 'mappin.and.ellipse.circle.fill', 'signpost.left', 'signpost.left.fill', 'signpost.right', 'signpost.right.fill', 'signpost.and.arrowtriangle.up', 'signpost.and.arrowtriangle.up.fill', 'arrow.triangle.turn.up.right.circle', 'arrow.triangle.turn.up.right.circle.fill', 'arrow.triangle.turn.up.right.diamond', 'arrow.triangle.turn.up.right.diamond.fill', 'car', 'car.fill', 'car.circle', 'car.circle.fill', 'car.2', 'car.2.fill', 'bolt.car', 'bolt.car.fill', 'bolt.car.circle', 'bolt.car.circle.fill', 'car.front.waves.up', 'car.front.waves.up.fill', 'bus', 'bus.fill', 'bus.doubledecker', 'bus.doubledecker.fill', 'tram', 'tram.fill', 'tram.circle', 'tram.circle.fill', 'cablecar', 'cablecar.fill', 'train.side.front.car', 'train.side.middle.car', 'train.side.rear.car', 'bicycle', 'bicycle.circle', 'bicycle.circle.fill', 'scooter', 'airplane', 'airplane.circle', 'airplane.circle.fill', 'airplane.departure', 'airplane.arrival', 'ferry', 'ferry.fill', 'sailboat', 'sailboat.fill', 'fuelpump', 'fuelpump.fill', 'fuelpump.circle', 'fuelpump.circle.fill', 'parkingsign', 'parkingsign.circle', 'parkingsign.circle.fill', 'parkingsign.stacked', 'ev.charger', 'ev.charger.fill', 'road.lanes', 'road.lane.arrowtriangle.2.inward', 'location.magnifyingglass', 'point.topleft.down.to.point.bottomright.curvepath', 'point.bottomleft.forward.to.point.topright.scurvepath'],
                      'Home & Building': ['house', 'house.fill', 'house.circle', 'house.circle.fill', 'house.and.flag', 'house.and.flag.fill', 'building', 'building.fill', 'building.circle', 'building.circle.fill', 'building.2', 'building.2.fill', 'building.2.crop.circle', 'building.2.crop.circle.fill', 'building.columns', 'building.columns.fill', 'building.columns.circle', 'building.columns.circle.fill', 'banknote', 'banknote.fill', 'signpost.left', 'signpost.left.fill', 'signpost.right', 'signpost.right.fill', 'bed.double', 'bed.double.fill', 'bed.double.circle', 'bed.double.circle.fill', 'sofa', 'sofa.fill', 'chair', 'chair.fill', 'chair.lounge', 'chair.lounge.fill', 'lamp.desk', 'lamp.desk.fill', 'lamp.table', 'lamp.table.fill', 'lamp.floor', 'lamp.floor.fill', 'lamp.ceiling', 'lamp.ceiling.fill', 'lamp.ceiling.inverse', 'lightbulb', 'lightbulb.fill', 'lightbulb.circle', 'lightbulb.circle.fill', 'lightbulb.slash', 'lightbulb.slash.fill', 'lightbulb.led', 'lightbulb.led.fill', 'lightbulb.led.wide', 'lightbulb.led.wide.fill', 'light.beacon.max', 'light.beacon.max.fill', 'light.beacon.min', 'light.beacon.min.fill', 'light.cylindrical.ceiling', 'light.cylindrical.ceiling.fill', 'light.cylindrical.ceiling.inverse', 'light.panel', 'light.panel.fill', 'light.recessed', 'light.recessed.fill', 'light.recessed.3', 'light.recessed.3.fill', 'light.recessed.inverse', 'light.strip.2', 'light.strip.2.fill', 'light.ribbon', 'light.ribbon.fill', 'chandelier', 'chandelier.fill', 'fanblades', 'fanblades.fill', 'fan', 'fan.fill', 'fan.and.light.ceiling', 'fan.and.light.ceiling.fill', 'fan.desk', 'fan.desk.fill', 'fan.floor', 'fan.floor.fill', 'air.conditioner.horizontal', 'air.conditioner.horizontal.fill', 'air.conditioner.vertical', 'air.conditioner.vertical.fill', 'heater.vertical', 'heater.vertical.fill', 'fireplace', 'fireplace.fill', 'stove', 'stove.fill', 'oven', 'oven.fill', 'refrigerator', 'refrigerator.fill', 'sink', 'sink.fill', 'dishwasher', 'dishwasher.fill', 'washer', 'washer.fill', 'dryer', 'dryer.fill', 'spigot', 'spigot.fill', 'shower', 'shower.fill', 'bathtub', 'bathtub.fill', 'toilet', 'toilet.fill', 'door.left.hand.open', 'door.left.hand.closed', 'door.right.hand.open', 'door.right.hand.closed', 'door.sliding.left.hand.open', 'door.sliding.left.hand.closed', 'door.sliding.right.hand.open', 'door.sliding.right.hand.closed', 'door.french.open', 'door.french.closed', 'door.garage.open', 'door.garage.closed', 'door.garage.open.trianglebadge.exclamationmark', 'door.garage.closed.trianglebadge.exclamationmark', 'entry.lever.keypad', 'entry.lever.keypad.fill', 'entry.lever.keypad.trianglebadge.exclamationmark', 'entry.lever.keypad.trianglebadge.exclamationmark.fill', 'window.vertical.open', 'window.vertical.closed', 'window.horizontal', 'window.horizontal.closed', 'window.ceiling', 'window.ceiling.closed', 'window.casement', 'window.casement.closed', 'window.awning', 'window.awning.closed', 'window.shade.open', 'window.shade.closed', 'blinds.vertical.open', 'blinds.vertical.closed', 'blinds.horizontal.open', 'blinds.horizontal.closed', 'curtains.open', 'curtains.closed'],
                      'Nature & Environment': ['leaf', 'leaf.fill', 'leaf.circle', 'leaf.circle.fill', 'tree', 'tree.fill', 'sprout', 'sprout.fill', 'globe', 'globe.americas.fill', 'globe.europe.africa.fill', 'globe.asia.australia.fill', 'mountain.2', 'mountain.2.fill', 'beach.umbrella', 'beach.umbrella.fill', 'umbrella', 'umbrella.fill', 'sparkle', 'sparkles', 'moon', 'moon.fill', 'moon.stars', 'moon.stars.fill', 'moon.haze.fill', 'moon.zzz.fill', 'sunset', 'sunset.fill', 'sunrise', 'sunrise.fill', 'sun.and.horizon.fill', 'bird', 'bird.fill', 'ant.fill', 'ladybug.fill', 'hare.fill', 'tortoise.fill', 'lizard.fill', 'water.waves'],
                      'Food & Drink': ['cup.and.saucer', 'cup.and.saucer.fill', 'mug', 'mug.fill', 'takeoutbag.and.cup.and.straw.fill', 'waterbottle.fill', 'wineglass', 'wineglass.fill', 'champagne.glass.fill', 'popcorn.fill', 'fork.knife', 'fork.knife.circle.fill', 'frying.pan.fill', 'birthday.cake', 'birthday.cake.fill', 'carrot', 'carrot.fill', 'fish.fill', 'apple.logo'],
                      'System & Settings': ['gear', 'gearshape', 'gearshape.fill', 'gearshape.2.fill', 'gearshape.circle.fill', 'slider.horizontal.3', 'slider.horizontal.2.square', 'slider.vertical.3', 'switch.2', 'switch.programmable.fill', 'button.programmable.square.fill', 'cpu', 'cpu.fill', 'memorychip', 'memorychip.fill', 'opticaldisc.fill', 'internaldrive.fill', 'externaldrive', 'externaldrive.fill', 'externaldrive.badge.plus', 'externaldrive.badge.checkmark', 'power', 'poweroff', 'poweron', 'togglepower', 'powerplug', 'powerplug.fill', 'powercord.fill', 'poweroutlet.type.a.fill', 'poweroutlet.type.b.fill', 'battery.100percent', 'battery.75percent', 'battery.50percent', 'battery.25percent', 'battery.0percent', 'battery.100percent.bolt', 'battery.100percent.circle.fill', 'battery.block.fill'],
                      'Security': ['lock', 'lock.fill', 'lock.circle', 'lock.circle.fill', 'lock.square.fill', 'lock.slash', 'lock.slash.fill', 'lock.open', 'lock.open.fill', 'lock.shield', 'lock.shield.fill', 'lock.doc.fill', 'key', 'key.fill', 'key.horizontal', 'key.horizontal.fill', 'key.radiowaves.forward.fill', 'wifi.router.fill', 'pin', 'pin.fill', 'pin.circle.fill', 'pin.slash.fill', 'shield', 'shield.fill', 'shield.lefthalf.filled', 'shield.slash.fill', 'shield.checkmark', 'shield.checkmark.fill', 'checkmark.shield', 'checkmark.shield.fill', 'xmark.shield.fill', 'exclamationmark.shield.fill', 'person.badge.key.fill', 'person.badge.shield.checkmark.fill'],
                      'Connectivity': ['wifi', 'wifi.circle', 'wifi.circle.fill', 'wifi.square.fill', 'wifi.slash', 'wifi.exclamationmark', 'wifi.router', 'wifi.router.fill', 'antenna.radiowaves.left.and.right', 'antenna.radiowaves.left.and.right.circle.fill', 'antenna.radiowaves.left.and.right.slash', 'personalhotspot', 'personalhotspot.circle.fill', 'network', 'network.slash', 'cable.connector', 'simcard', 'simcard.fill', 'simcard.2.fill', 'esim.fill', 'sdcard.fill', 'sensor.fill', 'dot.radiowaves.left.and.right', 'wave.3.left.circle.fill', 'wave.3.right.circle.fill', 'bluetooth', 'bluetooth.fill', 'bluetooth.slash', 'airpods', 'airpodspro', 'airpodsmax', 'homepod', 'homepod.fill', 'homepod.2.fill', 'hifispeaker', 'hifispeaker.fill', 'hifispeaker.2.fill', 'applewatch', 'applewatch.watchface', 'applewatch.radiowaves.left.and.right', 'iphone', 'iphone.circle.fill', 'iphone.radiowaves.left.and.right', 'ipad', 'ipad.and.iphone', 'laptopcomputer', 'laptopcomputer.and.iphone', 'desktopcomputer', 'macpro.gen3', 'macmini.fill', 'macstudio.fill', 'airport.express', 'airport.extreme'],
                      'Data & Charts': ['chart.bar', 'chart.bar.fill', 'chart.bar.xaxis', 'chart.line.uptrend.xyaxis', 'chart.line.uptrend.xyaxis.circle.fill', 'chart.line.downtrend.xyaxis', 'chart.line.flattrend.xyaxis', 'chart.xyaxis.line', 'chart.pie', 'chart.pie.fill', 'waveform', 'waveform.path', 'waveform.path.ecg', 'waveform.circle', 'waveform.circle.fill', 'gauge.with.dots.needle.50percent', 'gauge.with.dots.needle.bottom.50percent', 'gauge.with.needle.fill', 'speedometer', 'percent', 'percent.circle.fill', 'number', 'number.circle.fill', 'sum', 'plus', 'minus', 'multiply', 'divide', 'equal', 'plusminus', 'equal.circle.fill', 'lessthan.circle.fill', 'greaterthan.circle.fill', 'function', 'textformat.size', 'textformat.superscript', 'textformat.subscript'],
                      'Shapes & Symbols': ['circle', 'circle.fill', 'circle.lefthalf.filled', 'circle.righthalf.filled', 'circle.inset.filled', 'circle.dashed', 'circle.grid.cross.fill', 'circle.hexagongrid.fill', 'circle.grid.2x2.fill', 'circle.grid.3x3.fill', 'largecircle.fill.circle', 'smallcircle.filled.circle.fill', 'square', 'square.fill', 'square.lefthalf.filled', 'square.righthalf.filled', 'square.inset.filled', 'square.dashed', 'square.split.2x2.fill', 'square.grid.2x2.fill', 'square.grid.3x2.fill', 'square.grid.3x3.fill', 'rectangle', 'rectangle.fill', 'rectangle.inset.filled', 'rectangle.split.3x1.fill', 'rectangle.grid.2x2.fill', 'triangle', 'triangle.fill', 'diamond', 'diamond.fill', 'octagon', 'octagon.fill', 'hexagon', 'hexagon.fill', 'pentagon', 'pentagon.fill', 'seal', 'seal.fill', 'star', 'star.fill', 'star.leadinghalf.filled', 'star.slash.fill', 'flag', 'flag.fill', 'flag.circle.fill', 'flag.slash.fill', 'flag.checkered', 'flag.2.crossed.fill', 'staroflife', 'staroflife.fill', 'staroflife.circle.fill'],
                      'Trash & Delete': ['trash', 'trash.fill', 'trash.circle', 'trash.circle.fill', 'trash.slash', 'trash.slash.fill', 'xmark.bin.fill', 'delete.left', 'delete.left.fill', 'delete.right', 'delete.right.fill', 'clear', 'clear.fill']
                    };

                    return Object.entries(iconCategories).map(([category, icons]) => (
                      <div key={category} style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 18, color: '#f5f5f7', fontWeight: 600, marginBottom: 16 }}>
                          {category}
                        </h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                          gap: 12
                        }}>
                          {icons.map(iconName => (
                            <div
                              key={iconName}
                              title={`Click to copy: ${iconName}`}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                                padding: 12,
                                backgroundColor: '#0d0d0d',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '1px solid transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1a1a1a';
                                e.currentTarget.style.borderColor = '#007AFF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#0d0d0d';
                                e.currentTarget.style.borderColor = 'transparent';
                              }}
                              onClick={() => {
                                navigator.clipboard.writeText(iconName);
                                const el = document.createElement('div');
                                el.textContent = 'Copied!';
                                el.style.cssText = 'position:fixed;top:20px;right:20px;background:#34C759;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:10000;animation:fadeIn 0.2s ease';
                                document.body.appendChild(el);
                                setTimeout(() => {
                                  el.style.animation = 'fadeOut 0.2s ease';
                                  setTimeout(() => el.remove(), 200);
                                }, 1500);
                              }}
                            >
                              <Icon name={iconName} size={32} color={iconColor} />
                              <div style={{
                                fontSize: 10,
                                color: '#8e8e93',
                                textAlign: 'center',
                                wordBreak: 'break-word',
                                fontFamily: 'Monaco, monospace',
                                lineHeight: 1.3
                              }}>
                                {iconName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
