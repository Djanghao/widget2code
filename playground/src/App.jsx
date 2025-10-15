import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { examples } from './constants/examples.js';
import { parseAspectRatio, applySizeToSpec } from './utils/specUtils.js';
import AppHeader from './components/Header/AppHeader.jsx';
import MaterialsModal from './components/MaterialsModal/index.jsx';
import useWidgetCompiler from './hooks/useWidgetCompiler.js';
import useWidgetFrame from './hooks/useWidgetFrame.js';
import PresetsTab from './components/PresetsTab/index.jsx';
import ImageToWidget from './ImageToWidget.jsx';
import Prompt2Spec from './Prompt2Spec.jsx';
import Documentation from './Documentation.jsx';

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

  const waitForLayoutStable = async () => {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
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

  const applySizeToDOMAndMeasure = async (w, h) => {
    const frame = widgetFrameRef.current;
    if (!frame) return { fits: false };
    const widgetElement = frame.firstElementChild;
    if (!widgetElement) return { fits: false };

    widgetElement.style.width = `${w}px`;
    widgetElement.style.height = `${h}px`;

    await waitForLayoutStable();
    const m = measureOverflow();
    return m;
  };

  const handleAutoResizeByRatio = async (ratioOverride) => {
    if (autoSizing) return;
    const r = ratioOverride ?? parseAspectRatio(ratioInput);
    if (!r) return;

    const currentToken = autoResizeTokenRef.current;
    console.log(`🎫 [AutoResize DOM] Starting with token: ${currentToken}`);

    setAutoSizing(true);
    try {
      const frame = widgetFrameRef.current;
      if (!frame) {
        console.log(`❌ [AutoResize DOM] No frame element`);
        return;
      }

      const widgetElement = frame.firstElementChild;
      if (!widgetElement) {
        console.log(`❌ [AutoResize DOM] No widget element`);
        return;
      }

      const rect = widgetElement.getBoundingClientRect();
      const startW = Math.max(40, Math.round(rect.width));
      const startH = Math.max(40, Math.round(startW / r));

      console.log(`📐 [AutoResize DOM] Natural size: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}, Starting: ${startW}×${startH}, Ratio: ${r}`);

      if (autoResizeTokenRef.current !== currentToken) {
        console.log(`🚫 [AutoResize DOM] Token mismatch, aborting`);
        return;
      }

      let m = await applySizeToDOMAndMeasure(startW, startH);
      let best = { w: startW, h: startH };

      if (autoResizeTokenRef.current !== currentToken) return;

      if (m.fits) {
        console.log(`✓ [AutoResize DOM] Initial size fits, searching for minimum size...`);
        let low = 40;
        let high = startW;

        const lm = await applySizeToDOMAndMeasure(low, Math.max(40, Math.round(low / r)));
        if (autoResizeTokenRef.current !== currentToken) return;

        if (lm.fits) {
          best = { w: low, h: Math.max(40, Math.round(low / r)) };
          console.log(`✓ [AutoResize DOM] Minimum size (${low}) already fits`);
        } else {
          while (high - low > 1) {
            if (autoResizeTokenRef.current !== currentToken) return;
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const mm = await applySizeToDOMAndMeasure(mid, mh);
            if (mm.fits) {
              best = { w: mid, h: mh };
              high = mid;
            } else {
              low = mid;
            }
          }
          console.log(`✓ [AutoResize DOM] Found minimum fitting size: ${best.w}×${best.h}`);
        }
      } else {
        console.log(`✗ [AutoResize DOM] Initial size too small, expanding...`);
        let low = startW;
        let high = startW;
        let mm = m;
        const maxCap = 4096;

        while (!mm.fits && high < maxCap) {
          if (autoResizeTokenRef.current !== currentToken) return;
          low = high;
          high = Math.min(maxCap, high * 2);
          const hh = Math.max(40, Math.round(high / r));
          mm = await applySizeToDOMAndMeasure(high, hh);
        }

        if (mm.fits) {
          best = { w: high, h: Math.max(40, Math.round(high / r)) };
          console.log(`✓ [AutoResize DOM] Found fitting size at ${high}, now searching for minimum...`);

          while (high - low > 1) {
            if (autoResizeTokenRef.current !== currentToken) return;
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const m2 = await applySizeToDOMAndMeasure(mid, mh);
            if (m2.fits) {
              best = { w: mid, h: mh };
              high = mid;
            } else {
              low = mid;
            }
          }
          console.log(`✓ [AutoResize DOM] Found minimum fitting size: ${best.w}×${best.h}`);
        } else {
          best = { w: low, h: Math.max(40, Math.round(low / r)) };
          console.log(`⚠️ [AutoResize DOM] Could not fit within max cap, using: ${best.w}×${best.h}`);
        }
      }

      if (autoResizeTokenRef.current !== currentToken) return;

      console.log(`📝 [AutoResize DOM] Writing optimal size to spec: ${best.w}×${best.h}`);
      resizingRef.current = true;
      applySizeToSpec(editedSpec, currentExample.spec, best.w, best.h, setEditedSpec);

      console.log(`✅ [AutoResize DOM] Completed successfully with token: ${currentToken}`);
    } finally {
      setAutoSizing(false);
      setTimeout(() => {
        resizingRef.current = false;
      }, 100);
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
        <PresetsTab
          selectedExample={selectedExample}
          handleExampleChange={handleExampleChange}
          currentSpec={currentSpec}
          handleSpecChange={handleSpecChange}
          specTextareaRef={specTextareaRef}
          generatedCode={generatedCode}
          ratioInput={ratioInput}
          setRatioInput={setRatioInput}
          enableAutoResize={enableAutoResize}
          setEnableAutoResize={setEnableAutoResize}
          autoSizing={autoSizing}
          handleAutoResizeByRatio={handleAutoResizeByRatio}
          editedSpec={editedSpec}
          currentExample={currentExample}
          setEditedSpec={setEditedSpec}
          handleDownloadWidget={handleDownloadWidget}
          isLoading={isLoading}
          previewContainerRef={previewContainerRef}
          widgetFrameRef={widgetFrameRef}
          setFrameEl={setFrameEl}
          presetResetKey={presetResetKey}
          frameSize={frameSize}
          resizingRef={resizingRef}
          treeRoot={treeRoot}
          selectedPath={selectedPath}
          handleSelectNode={handleSelectNode}
          treeContainerRef={treeContainerRef}
        />
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
