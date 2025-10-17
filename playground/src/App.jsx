/**
 * @file App.jsx
 * @description Main application component for the widget playground.
 * Provides tabbed interface for presets, widget-to-spec, prompt-to-spec, and guides.
 * Manages widget compilation, preview, auto-resize, and download functionality.
 * @author Houston Zhang
 * @date 2025-10-03
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { examples } from './constants/examples.js';
import { parseAspectRatio } from './utils/specUtils.js';
import AppHeader from './components/Header/AppHeader.jsx';
import MaterialsModal from './components/MaterialsModal/index.jsx';
import useWidgetFrame from './hooks/useWidgetFrame.js';
import PresetsTab from './components/PresetsTab/index.jsx';
import ImageToWidget from './ImageToWidget.jsx';
import Prompt2Spec from './Prompt2Spec.jsx';
import Documentation from './Documentation.jsx';
import usePlaygroundStore from './store/index.js';

function App() {
  const {
    selectedPreset,
    widgetSpec,
    generatedJSX,
    treeRoot,
    currentWidgetFileName,
    ratioInput,
    setRatioInput,
    enableAutoResize,
    setEnableAutoResize,
    autoSizing,
    renderingPhase,
    switchPreset,
    executeAutoResize,
    compileFromEdited,
    initializeApp
  } = usePlaygroundStore();

  const [activeTab, setActiveTab] = useState('presets');
  const [editedSpec, setEditedSpec] = useState('');
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const previewContainerRef = useRef(null);
  const widgetFrameRef = useRef(null);
  const [frameEl, setFrameEl] = useState(null);
  const treeContainerRef = useRef(null);
  const specTextareaRef = useRef(null);
  const compileTimerRef = useRef(null);
  const [presetResetKey, setPresetResetKey] = useState(0);

  const handleSelectNode = (path) => setSelectedPath(prev => (prev === path ? null : path));

  useEffect(() => {
    initializeApp(widgetFrameRef);
  }, []);

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

  const currentExample = examples[selectedPreset];
  const currentSpec = editedSpec || (widgetSpec ? JSON.stringify(widgetSpec, null, 2) : JSON.stringify(currentExample.spec, null, 2));
  const isLoading = renderingPhase !== 'idle';

  const handleSpecChange = useCallback((value) => {
    setEditedSpec(value);

    if (compileTimerRef.current) {
      clearTimeout(compileTimerRef.current);
    }

    compileTimerRef.current = setTimeout(() => {
      compileFromEdited(value, widgetFrameRef);
    }, 300);
  }, [compileFromEdited]);

  const handleExampleChange = (key) => {
    setSelectedPath(null);
    setFrameSize({ width: 0, height: 0 });
    setIsLoading(false);

    expectedSizeRef.current = null;
    resizingRef.current = false;
    latestWriteTokenRef.current = 0;
    autoSizingRef.current = false;

    widgetFrameRef.current = null;
    setFrameEl(null);

    setPresetResetKey(prev => prev + 1);

    switchPreset(key, widgetFrameRef);
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

  const handleAutoResizeByRatio = useCallback(async (ratioOverride) => {
    const r = ratioOverride ?? parseAspectRatio(ratioInput);
    if (!r) return;

    autoSizingRef.current = true;
    await executeAutoResize(r, widgetFrameRef);
    autoSizingRef.current = false;
    setIsLoading(false);
  }, [ratioInput, executeAutoResize]);

  const handleWidgetGenerated = async (widgetSpec, aspectRatio) => {
    const specStr = JSON.stringify(widgetSpec, null, 2);
    setEditedSpec(specStr);
    setRatioInput(aspectRatio.toString());
  };

  const { frameSize, setFrameSize } = useWidgetFrame(
    frameEl,
    expectedSizeRef,
    setIsLoading
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
          selectedExample={selectedPreset}
          handleExampleChange={handleExampleChange}
          currentSpec={currentSpec}
          handleSpecChange={handleSpecChange}
          specTextareaRef={specTextareaRef}
          generatedCode={generatedJSX}
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
          widgetFileName={currentWidgetFileName}
          frameSize={frameSize}
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
