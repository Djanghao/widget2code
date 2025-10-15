import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import TreeView from './TreeView.jsx';
import WidgetFrame from './WidgetFrame.jsx';
import ImageToWidget from './ImageToWidget.jsx';
import Prompt2Spec from './Prompt2Spec.jsx';
import Documentation from './Documentation.jsx';
import DownloadButton from './DownloadButton.jsx';
import { Icon } from '@widget-factory/primitives';
import html2canvas from 'html2canvas';
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
import lucideWeatherSmall from './examples/lucide-weather-small.json';
import lucideTasksMedium from './examples/lucide-tasks-medium.json';
import lucideMusicSmall from './examples/lucide-music-small.json';
import batterySmallDark from './examples/battery-small-dark.json';
import fitnessSmallLight from './examples/fitness-small-light.json';
import musicMediumLight from './examples/music-medium-light.json';
import newsMediumDark from './examples/news-medium-dark.json';
import calendarMediumLight from './examples/calendar-medium-light.json';
import photosSmallLight from './examples/photos-small-light.json';
import healthSmallDark from './examples/health-small-dark.json';
import batteryMediumLight from './examples/battery-medium-light.json';
import stocksMediumLight from './examples/stocks-medium-light.json';
import weatherLargeLight from './examples/weather-large-light.json';

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
  const [frameEl, setFrameEl] = useState(null);
  const treeContainerRef = useRef(null);
  const specTextareaRef = useRef(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const latestWriteTokenRef = useRef(0);
  const expectedSizeRef = useRef(null);
  const resizingRef = useRef(false);
  const autoResizeTokenRef = useRef(0);
  const [ratioInput, setRatioInput] = useState('');
  const [autoSizing, setAutoSizing] = useState(false);
  const [iconColor, setIconColor] = useState('rgba(255, 255, 255, 0.85)');
  const [iconLibrary, setIconLibrary] = useState('sf');
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
    mapMediumDark: { name: 'Map M-Dark', spec: mapMediumDark },
    lucideWeatherSmall: { name: 'Lucide Weather', spec: lucideWeatherSmall },
    lucideTasksMedium: { name: 'Lucide Tasks', spec: lucideTasksMedium },
    lucideMusicSmall: { name: 'Lucide Music', spec: lucideMusicSmall },
    batterySmallDark: { name: 'Battery S-Dark', spec: batterySmallDark },
    fitnessSmallLight: { name: 'Activity S-Light', spec: fitnessSmallLight },
    musicMediumLight: { name: 'Music M-Light', spec: musicMediumLight },
    newsMediumDark: { name: 'News M-Dark', spec: newsMediumDark },
    calendarMediumLight: { name: 'Calendar M-Light', spec: calendarMediumLight },
    photosSmallLight: { name: 'Photos S-Light', spec: photosSmallLight },
    healthSmallDark: { name: 'Health S-Dark', spec: healthSmallDark },
    batteryMediumLight: { name: 'Battery M-Light', spec: batteryMediumLight },
    stocksMediumLight: { name: 'Stocks M-Light', spec: stocksMediumLight },
    weatherLargeLight: { name: 'Weather L-Light', spec: weatherLargeLight }
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
  }, [selectedExample, editedSpec]);

  const handleSpecChange = (value) => {
    setEditedSpec(value);
  };

  useEffect(() => {
    if (!frameEl) return;
    const el = frameEl;
    let frameCount = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: Math.round(rect.width), height: Math.round(rect.height) };

      console.log(`📏 [Widget Size Change #${++frameCount}]`, {
        width: rect.width.toFixed(2),
        height: rect.height.toFixed(2),
        rounded: next,
        timestamp: new Date().toISOString().split('T')[1],
        autoResizeEnabled: enableAutoResize,
        hasExpectedSize: !!expectedSizeRef.current,
        expectedSize: expectedSizeRef.current
      });

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
  }, [frameEl, enableAutoResize]);

  // Auto-apply autoresize when enabled and spec has aspectRatio but no width/height
  useEffect(() => {
    if (!enableAutoResize) {
      console.log('⏸️  [AutoResize] Disabled, skipping');
      return;
    }
    const obj = parseCurrentSpecObject();
    if (!obj || !obj.widget) return;
    const w = obj.widget;
    const hasWH = w.width !== undefined && w.height !== undefined;
    const r = w.aspectRatio;
    console.log('🔍 [AutoResize Check]', {
      hasWidth: w.width !== undefined,
      hasHeight: w.height !== undefined,
      aspectRatio: r,
      willTrigger: !hasWH && typeof r === 'number' && isFinite(r) && r > 0
    });
    if (!hasWH && typeof r === 'number' && isFinite(r) && r > 0) {
      console.log('⏱️  [AutoResize] Waiting for new widget to mount and render naturally...');
      let attempts = 0;
      let frameMounted = false;
      let sizeHistory = [];
      let hasSeenChange = false;

      const checkNaturalSize = () => {
        attempts++;
        const frame = widgetFrameRef.current;

        if (!frame) {
          if (attempts < 120) {
            requestAnimationFrame(checkNaturalSize);
          } else {
            console.log('❌ [AutoResize] Timeout waiting for frame to mount');
          }
          return;
        }

        if (!frameMounted) {
          frameMounted = true;
          console.log(`✅ [AutoResize] Frame mounted, now monitoring size changes...`);
        }

        const rect = frame.getBoundingClientRect();
        const currentSize = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`;
        sizeHistory.push(currentSize);

        if (sizeHistory.length === 1) {
          console.log(`🔎 [AutoResize] Initial size: ${currentSize} (likely old element, waiting for change...)`);
          requestAnimationFrame(checkNaturalSize);
          return;
        }

        const prevSize = sizeHistory[sizeHistory.length - 2];

        if (currentSize !== prevSize && !hasSeenChange) {
          hasSeenChange = true;
          console.log(`🔄 [AutoResize] Size changed: ${prevSize} → ${currentSize} (new element detected!)`);
          sizeHistory = [currentSize];
          requestAnimationFrame(checkNaturalSize);
          return;
        }

        if (hasSeenChange) {
          if (currentSize === prevSize) {
            const stableCount = sizeHistory.filter(s => s === currentSize).length;
            if (stableCount >= 3) {
              console.log(`📐 [AutoResize] Natural size stabilized at: ${currentSize} (stable for ${stableCount} frames after change, total ${attempts} checks)`);
              console.log('⚡ [AutoResize] Triggering with ratio:', r);
              setRatioInput(r.toString());
              handleAutoResizeByRatio(r);
            } else {
              requestAnimationFrame(checkNaturalSize);
            }
          } else {
            console.log(`🔄 [AutoResize] Size still changing: ${prevSize} → ${currentSize}`);
            sizeHistory = [currentSize];
            if (attempts < 120) {
              requestAnimationFrame(checkNaturalSize);
            } else {
              console.log('⏰ [AutoResize] Max attempts reached, using current size:', currentSize);
              setRatioInput(r.toString());
              handleAutoResizeByRatio(r);
            }
          }
        } else {
          if (attempts < 120) {
            requestAnimationFrame(checkNaturalSize);
          } else {
            console.log('⏰ [AutoResize] No size change detected within timeout, using current:', currentSize);
            setRatioInput(r.toString());
            handleAutoResizeByRatio(r);
          }
        }
      };
      requestAnimationFrame(checkNaturalSize);
    }
  }, [enableAutoResize, selectedExample, editedSpec]);

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
    console.log('✏️  [Spec Update] Applying size:', {
      width: next.widget.width,
      height: next.widget.height,
      aspectRatio: next.widget.aspectRatio
    });
    setEditedSpec(JSON.stringify(formatSpecWithRootLast(next), null, 2));
  };

  const restoreSizeInSpec = () => {
    const obj = parseCurrentSpecObject();
    if (!obj || !obj.widget) return;
    const next = { ...obj, widget: { ...obj.widget } };
    delete next.widget.width;
    delete next.widget.height;
    console.log('↩️  [Spec Update] Restoring (removing width/height), aspectRatio:', next.widget.aspectRatio);
    setEditedSpec(JSON.stringify(formatSpecWithRootLast(next), null, 2));
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
            <h1
              onClick={() => setActiveTab('presets')}
              style={{
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                color: '#f5f5f7',
                letterSpacing: '-0.3px',
                cursor: 'pointer'
              }}
            >
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
              <button
                onClick={() => setActiveTab('prompt2spec')}
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: activeTab === 'prompt2spec' ? '#f5f5f7' : '#8e8e93',
                  border: 'none',
                  borderBottom: activeTab === 'prompt2spec' ? '2px solid #007AFF' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'prompt2spec') e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'prompt2spec') e.target.style.color = '#8e8e93';
                }}
              >
                Prompt2Spec
              </button>
              <button
                onClick={() => setActiveTab('guides')}
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: activeTab === 'guides' ? '#f5f5f7' : '#8e8e93',
                  border: 'none',
                  borderBottom: activeTab === 'guides' ? '2px solid #007AFF' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'guides') e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'guides') e.target.style.color = '#8e8e93';
                }}
              >
                Guides
              </button>
              <a
                href="http://202.78.161.188:8080/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#8e8e93',
                  border: 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#8e8e93';
                }}
              >
                FastCVAT
              </a>
              <a
                href="http://202.78.161.188:3000/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#8e8e93',
                  border: 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#8e8e93';
                }}
              >
                Qwen API OpenWebUI
              </a>
              <a
                href="http://202.78.161.188:3010/viewer/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#8e8e93',
                  border: 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#8e8e93';
                }}
              >
                W2C Viewer
              </a>
              <a
                href="http://202.78.161.188:3010/playground/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#8e8e93',
                  border: 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f5f5f7';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#8e8e93';
                }}
              >
                W2C Playground
              </a>
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
                        const obj = parseCurrentSpecObject();
                        const v = obj?.widget?.aspectRatio;
                        if (typeof v === 'number' && isFinite(v) && v > 0) r = v;
                      } catch {}
                    }

                    const onMove = (ev) => {
                      const dx = ev.clientX - startX;
                      if (enableAutoResize && r) {
                        const nw = Math.max(40, Math.round(startW + dx));
                        const nh = Math.max(40, Math.round(nw / r));
                        applySizeToSpec(nw, nh);
                      } else {
                        const dy = ev.clientY - startY;
                        const nw = Math.max(40, Math.round(startW + dx));
                        const nh = Math.max(40, Math.round(startH + dy));
                        applySizeToSpec(nw, nh);
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
                    <div style={{ display: 'flex', gap: 0, marginLeft: 'auto' }}>
                      <button
                        onClick={() => setIconLibrary('sf')}
                        style={{
                          padding: '8px 16px',
                          fontSize: 13,
                          fontWeight: 500,
                          backgroundColor: iconLibrary === 'sf' ? '#007AFF' : '#2c2c2e',
                          color: iconLibrary === 'sf' ? 'white' : '#8e8e93',
                          border: '1px solid #3a3a3c',
                          borderRight: 'none',
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        SF Symbols
                      </button>
                      <button
                        onClick={() => setIconLibrary('lucide')}
                        style={{
                          padding: '8px 16px',
                          fontSize: 13,
                          fontWeight: 500,
                          backgroundColor: iconLibrary === 'lucide' ? '#007AFF' : '#2c2c2e',
                          color: iconLibrary === 'lucide' ? 'white' : '#8e8e93',
                          border: '1px solid #3a3a3c',
                          borderTopRightRadius: 6,
                          borderBottomRightRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Lucide
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const sfIconCategories = {
                      'Common Symbols': ['circle.fill', 'checkmark', 'xmark', 'checkmark.circle.fill', 'xmark.circle.fill', 'exclamationmark.triangle.fill', 'exclamationmark.circle.fill', 'questionmark.circle.fill', 'info.circle.fill', 'plus', 'minus', 'plus.circle.fill', 'minus.circle.fill', 'ellipsis', 'ellipsis.circle.fill', 'star.fill', 'star.circle.fill', 'heart.fill', 'heart.circle.fill', 'bell.fill', 'bell.badge.fill', 'house.fill', 'gear', 'gearshape.fill', 'person.fill', 'person.crop.circle.fill', 'person.2.fill', 'flag.fill', 'bookmark.fill'],
                      'Calendar & Time': ['calendar', 'calendar.badge.plus', 'calendar.circle.fill', '1.calendar', '7.calendar', '15.calendar', '22.calendar', '31.calendar', 'clock.fill', 'clock.circle.fill', 'alarm.fill', 'timer', 'stopwatch.fill', 'hourglass', 'hourglass.bottomhalf.filled', 'deskclock.fill'],
                      'Weather': ['sun.max.fill', 'sun.min.fill', 'sun.and.horizon.fill', 'sunrise.fill', 'sunset.fill', 'moon.fill', 'moon.circle.fill', 'moon.stars.fill', 'moon.zzz.fill', 'sparkles', 'cloud.fill', 'cloud.sun.fill', 'cloud.moon.fill', 'cloud.drizzle.fill', 'cloud.rain.fill', 'cloud.heavyrain.fill', 'cloud.bolt.fill', 'cloud.bolt.rain.fill', 'cloud.sleet.fill', 'cloud.snow.fill', 'cloud.hail.fill', 'cloud.fog.fill', 'smoke.fill', 'wind', 'wind.snow', 'tornado', 'tropicalstorm', 'hurricane', 'snowflake', 'thermometer', 'thermometer.sun.fill', 'thermometer.snowflake', 'thermometer.low', 'thermometer.medium', 'thermometer.high', 'drop.fill', 'humidity.fill', 'aqi.low', 'aqi.medium', 'aqi.high'],
                      'Activity & Health': ['figure.walk', 'figure.run', 'figure.stand', 'figure.cooldown', 'figure.yoga', 'figure.stairs', 'figure.strengthtraining.traditional', 'bicycle', 'dumbbell.fill', 'heart.fill', 'heart.circle.fill', 'heart.text.square.fill', 'heart.square.fill', 'flame.fill', 'flame.circle.fill', 'bolt.heart.fill', 'waveform.path.ecg', 'waveform.path.ecg.rectangle.fill', 'stethoscope', 'cross.circle.fill', 'cross.fill', 'medical.thermometer.fill', 'pills.fill', 'syringe.fill', 'bandage.fill', 'drop.fill', 'drop.triangle.fill', 'lungs.fill', 'brain.fill', 'ear.fill', 'eye.fill', 'allergens.fill'],
                      'Media & Music': ['play.fill', 'play.circle.fill', 'pause.fill', 'pause.circle.fill', 'stop.fill', 'stop.circle.fill', 'forward.fill', 'forward.end.fill', 'backward.fill', 'backward.end.fill', 'goforward', 'gobackward', 'repeat', 'repeat.1', 'shuffle', 'music.note', 'music.note.list', 'music.quarternote.3', 'guitars.fill', 'piano', 'photo.fill', 'photo.stack.fill', 'photo.circle.fill', 'photo.on.rectangle.fill', 'camera.fill', 'camera.circle.fill', 'video.fill', 'video.circle.fill', 'film.fill', 'tv.fill', 'play.tv.fill', 'airplayvideo', 'headphones', 'speaker.wave.2.fill', 'speaker.fill', 'speaker.slash.fill', 'mic.fill', 'mic.slash.fill', 'volume.3.fill'],
                      'Communication': ['envelope.fill', 'envelope.open.fill', 'envelope.badge.fill', 'envelope.circle.fill', 'mail.stack.fill', 'phone.fill', 'phone.circle.fill', 'phone.badge.plus', 'phone.arrow.up.right.fill', 'phone.arrow.down.left.fill', 'message.fill', 'message.circle.fill', 'message.badge.fill', 'bubble.left.fill', 'bubble.right.fill', 'text.bubble.fill', 'quote.bubble.fill', 'captions.bubble.fill', 'video.fill', 'video.circle.fill', 'facetime', 'teletype', 'signature'],
                      'Navigation & Arrows': ['arrow.up', 'arrow.down', 'arrow.left', 'arrow.right', 'arrow.up.circle.fill', 'arrow.down.circle.fill', 'arrow.left.circle.fill', 'arrow.right.circle.fill', 'arrow.up.square.fill', 'arrow.down.square.fill', 'arrow.left.square.fill', 'arrow.right.square.fill', 'chevron.up', 'chevron.down', 'chevron.left', 'chevron.right', 'chevron.up.circle.fill', 'chevron.down.circle.fill', 'chevron.left.circle.fill', 'chevron.right.circle.fill', 'arrow.clockwise', 'arrow.counterclockwise', 'arrow.clockwise.circle.fill', 'arrow.counterclockwise.circle.fill', 'arrow.uturn.left', 'arrow.uturn.right', 'arrow.turn.up.right', 'arrow.triangle.turn.up.right.circle.fill', 'location.fill', 'location.circle.fill', 'location.north.fill', 'mappin.circle.fill', 'mappin.and.ellipse', 'map.fill', 'safari.fill', 'compass.fill'],
                      'Calendar Dates': ['1.circle.fill', '2.circle.fill', '3.circle.fill', '4.circle.fill', '5.circle.fill', '6.circle.fill', '7.circle.fill', '8.circle.fill', '9.circle.fill', '10.circle.fill', '11.circle.fill', '12.circle.fill', '13.circle.fill', '14.circle.fill', '15.circle.fill', '16.circle.fill', '17.circle.fill', '18.circle.fill', '19.circle.fill', '20.circle.fill', '21.circle.fill', '22.circle.fill', '23.circle.fill', '24.circle.fill', '25.circle.fill', '26.circle.fill', '27.circle.fill', '28.circle.fill', '29.circle.fill', '30.circle.fill', '31.circle.fill'],
                      'Status & Indicators': ['checkmark', 'checkmark.circle.fill', 'checkmark.shield.fill', 'xmark', 'xmark.circle.fill', 'exclamationmark.triangle.fill', 'exclamationmark.circle.fill', 'questionmark.circle.fill', 'info.circle.fill', 'star.fill', 'star.circle.fill', 'heart.fill', 'heart.circle.fill', 'flag.fill', 'flag.circle.fill', 'tag.fill', 'tag.circle.fill', 'bookmark.fill', 'bookmark.circle.fill', 'pin.fill', 'pin.circle.fill', 'bell.fill', 'bell.badge.fill', 'bell.slash.fill', 'clock.badge.checkmark.fill', 'clock.badge.exclamationmark.fill'],
                      'Tech & Devices': ['wifi', 'wifi.circle.fill', 'wifi.slash', 'antenna.radiowaves.left.and.right', 'personalhotspot', 'network', 'airpodspro', 'airpodsmax', 'homepod.fill', 'homepod.2.fill', 'applewatch', 'applewatch.watchface', 'iphone', 'iphone.circle.fill', 'ipad', 'laptopcomputer', 'desktopcomputer', 'display', 'tv.fill', 'appletv.fill', 'applelogo', 'macwindow', 'headphones', 'airplayaudio', 'airplayvideo', 'airtag.fill', 'battery.100percent', 'battery.75percent', 'battery.50percent', 'battery.25percent', 'battery.0percent', 'battery.100percent.bolt', 'bolt.fill', 'bolt.circle.fill', 'power', 'switch.2'],
                      'Charts & Finance': ['chart.bar.fill', 'chart.bar.xaxis', 'chart.line.uptrend.xyaxis', 'chart.line.downtrend.xyaxis', 'chart.line.flattrend.xyaxis', 'chart.pie.fill', 'chart.xyaxis.line', 'waveform', 'waveform.circle.fill', 'gauge.with.dots.needle.bottom.50percent', 'speedometer', 'dollarsign.circle.fill', 'eurosign.circle.fill', 'yensign.circle.fill', 'sterlingsign.circle.fill', 'bitcoinsign.circle.fill', 'percent', 'percent.circle.fill', 'number', 'number.circle.fill', 'sum', 'plusminus', 'equal', 'equal.circle.fill', 'greaterthan.circle.fill', 'lessthan.circle.fill', 'function'],
                      'Files & Documents': ['doc.fill', 'doc.text.fill', 'doc.on.doc.fill', 'doc.richtext.fill', 'doc.plaintext.fill', 'note.text', 'note.text.badge.plus', 'list.bullet', 'list.bullet.circle.fill', 'list.dash', 'list.number', 'checklist', 'folder.fill', 'folder.badge.plus', 'folder.circle.fill', 'externaldrive.fill', 'archivebox.fill', 'tray.fill', 'tray.2.fill', 'paperplane.fill', 'book.fill', 'book.closed.fill', 'books.vertical.fill', 'newspaper.fill', 'bookmark.fill', 'graduationcap.fill'],
                      'Actions & Tools': ['square.and.arrow.up.fill', 'square.and.arrow.down.fill', 'square.and.arrow.up.circle.fill', 'square.and.arrow.down.circle.fill', 'square.and.pencil', 'pencil', 'pencil.circle.fill', 'pencil.slash', 'highlighter', 'eraser.fill', 'trash.fill', 'trash.circle.fill', 'trash.slash.fill', 'xmark.bin.fill', 'scissors', 'link', 'link.circle.fill', 'paperclip', 'pin.fill', 'pin.slash.fill', 'magnifyingglass', 'magnifyingglass.circle.fill', 'barcode.viewfinder', 'qrcode.viewfinder', 'eye.fill', 'eye.slash.fill', 'eye.circle.fill', 'eyeglasses', 'slider.horizontal.3', 'slider.vertical.3', 'paintbrush.fill', 'paintpalette.fill', 'wrench.fill', 'wrench.and.screwdriver.fill', 'hammer.fill', 'gearshape.fill', 'gearshape.2.fill'],
                      'Social & People': ['person.fill', 'person.circle.fill', 'person.crop.circle.fill', 'person.crop.circle.badge.checkmark', 'person.crop.circle.badge.plus', 'person.2.fill', 'person.2.circle.fill', 'person.3.fill', 'person.crop.square.fill', 'person.and.background.dotted', 'hand.thumbsup.fill', 'hand.thumbsdown.fill', 'hand.wave.fill', 'hands.clap.fill', 'face.smiling.fill', 'face.smiling.inverse', 'heart.fill', 'heart.slash.fill', 'star.fill', 'star.slash.fill', 'gift.fill'],
                      'Shapes & Symbols': ['circle', 'circle.fill', 'circle.lefthalf.filled', 'circle.righthalf.filled', 'circle.inset.filled', 'circle.dashed', 'square', 'square.fill', 'square.lefthalf.filled', 'square.righthalf.filled', 'square.inset.filled', 'square.dashed', 'rectangle', 'rectangle.fill', 'rectangle.portrait.fill', 'triangle', 'triangle.fill', 'diamond', 'diamond.fill', 'octagon', 'octagon.fill', 'hexagon', 'hexagon.fill', 'pentagon', 'pentagon.fill', 'seal', 'seal.fill', 'star', 'star.fill', 'star.leadinghalf.filled', 'heart', 'heart.fill', 'suit.heart.fill', 'suit.club.fill', 'suit.spade.fill', 'suit.diamond.fill'],
                      'Shopping & Money': ['cart.fill', 'cart.badge.plus', 'cart.circle.fill', 'bag.fill', 'bag.badge.plus', 'bag.circle.fill', 'basket.fill', 'creditcard.fill', 'creditcard.circle.fill', 'wallet.pass.fill', 'dollarsign.circle.fill', 'eurosign.circle.fill', 'yensign.circle.fill', 'sterlingsign.circle.fill', 'bitcoinsign.circle.fill', 'banknote.fill', 'giftcard.fill', 'tag.fill', 'tag.circle.fill', 'percent', 'percent.circle.fill', 'barcode', 'qrcode'],
                      'Home & Control': ['house.fill', 'house.circle.fill', 'building.fill', 'lightbulb.fill', 'lightbulb.circle.fill', 'lightbulb.slash.fill', 'lamp.desk.fill', 'lamp.floor.fill', 'lamp.ceiling.fill', 'light.panel.fill', 'fan.fill', 'air.conditioner.horizontal.fill', 'air.conditioner.vertical.fill', 'heater.vertical.fill', 'fireplace.fill', 'thermometer.medium', 'lock.fill', 'lock.open.fill', 'lock.circle.fill', 'lock.shield.fill', 'key.fill', 'key.horizontal.fill', 'door.left.hand.closed', 'door.right.hand.closed', 'entry.lever.keypad.fill', 'window.vertical.closed', 'window.shade.closed', 'blinds.vertical.closed', 'curtains.closed', 'sensor.fill', 'camera.metering.center.weighted.average', 'bell.fill', 'bell.slash.fill'],
                      'Transportation': ['car.fill', 'car.2.fill', 'car.circle.fill', 'bolt.car.fill', 'car.front.waves.up.fill', 'bus.fill', 'tram.fill', 'cablecar.fill', 'bicycle', 'bicycle.circle.fill', 'scooter', 'airplane', 'airplane.circle.fill', 'airplane.departure', 'airplane.arrival', 'sailboat.fill', 'ferry.fill', 'fuelpump.fill', 'ev.charger.fill', 'parkingsign.circle.fill', 'road.lanes', 'signpost.right.fill', 'figure.walk', 'figure.run'],
                      'Food & Drink': ['cup.and.saucer.fill', 'mug.fill', 'takeoutbag.and.cup.and.straw.fill', 'waterbottle.fill', 'wineglass.fill', 'birthday.cake.fill', 'fork.knife', 'fork.knife.circle.fill', 'carrot.fill', 'leaf.fill', 'fish.fill', 'flame.fill']
                    };

                    const lucideIconCategories = {
                      'Common': ['Home', 'Heart', 'Star', 'User', 'Settings', 'Search', 'Menu', 'X', 'Check', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'Plus', 'Minus', 'Circle', 'Square', 'Triangle', 'Info', 'AlertCircle', 'AlertTriangle', 'HelpCircle', 'Bell', 'BellOff'],
                      'Weather': ['Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudDrizzle', 'CloudFog', 'Wind', 'Snowflake', 'Droplet', 'Sunrise', 'Sunset', 'Thermometer', 'ThermometerSun', 'ThermometerSnowflake'],
                      'Navigation': ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUpCircle', 'ArrowDownCircle', 'ArrowLeftCircle', 'ArrowRightCircle', 'Navigation', 'Compass', 'Map', 'MapPin', 'Navigation2', 'Locate', 'LocateFixed'],
                      'Communication': ['Mail', 'Send', 'MessageCircle', 'MessageSquare', 'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOutgoing', 'Video', 'VideoOff', 'Mic', 'MicOff', 'Inbox', 'Archive'],
                      'Media': ['Play', 'Pause', 'Stop', 'SkipForward', 'SkipBack', 'FastForward', 'Rewind', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Music', 'Headphones', 'Camera', 'CameraOff', 'Image', 'Film', 'Youtube'],
                      'Files': ['File', 'FileText', 'Folder', 'FolderOpen', 'FolderPlus', 'Download', 'Upload', 'Save', 'Copy', 'Clipboard', 'Paperclip', 'Link', 'ExternalLink', 'Trash', 'Trash2'],
                      'Edit': ['Edit', 'Edit2', 'Edit3', 'Pen', 'PenTool', 'Type', 'Bold', 'Italic', 'Underline', 'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify', 'Scissors', 'Eraser'],
                      'Time': ['Clock', 'Calendar', 'CalendarDays', 'Timer', 'Hourglass', 'Watch', 'Alarm', 'AlarmClock'],
                      'Devices': ['Laptop', 'Monitor', 'Smartphone', 'Tablet', 'Watch', 'Tv', 'Speaker', 'Headphones', 'Wifi', 'WifiOff', 'Bluetooth', 'Battery', 'BatteryCharging', 'BatteryLow', 'Power', 'PowerOff'],
                      'Shopping': ['ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'Tag', 'Gift', 'Package', 'Percent', 'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart', 'Activity'],
                      'Social': ['ThumbsUp', 'ThumbsDown', 'Share', 'Share2', 'Eye', 'EyeOff', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Flag', 'Bookmark'],
                      'Actions': ['Lock', 'Unlock', 'Key', 'LogIn', 'LogOut', 'Refresh', 'RotateCw', 'RotateCcw', 'Repeat', 'Shuffle', 'Filter', 'Maximize', 'Minimize', 'ZoomIn', 'ZoomOut']
                    };

                    const iconCategories = iconLibrary === 'sf' ? sfIconCategories : lucideIconCategories;
                    const iconPrefix = iconLibrary === 'sf' ? 'sf:' : 'lucide:';

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
                                const copyText = iconPrefix + iconName;
                                navigator.clipboard.writeText(copyText);
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
                              <Icon name={iconPrefix + iconName} size={32} color={iconColor} />
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
