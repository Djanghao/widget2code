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
    operationMode,
    setOperationMode,
    switchPreset,
    executeAutoResize,
    compileFromEdited,
    initializeApp,
    validateWidget
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
    setEditedSpec('');

    if (compileTimerRef.current) {
      clearTimeout(compileTimerRef.current);
    }

    widgetFrameRef.current = null;
    setFrameEl(null);
    setPresetResetKey(prev => prev + 1);

    switchPreset(key, widgetFrameRef);
  };

  const handleDownloadWidget = async () => {
    const widgetElement = widgetFrameRef.current?.firstElementChild;
    if (!widgetElement) {
      console.error('Widget element not found');
      alert('Widget element not found');
      return;
    }

    if (operationMode !== 'idle') {
      console.warn('Cannot download: operation in progress');
      alert(`Cannot download: ${operationMode} in progress. Please wait.`);
      return;
    }

    console.log('\n📥 [Download] Starting widget download...');

    const validation = validateWidget(widgetElement, widgetSpec);

    if (!validation.valid) {
      console.error('❌ [Download] Validation failed:', validation.issues);
      const issuesText = validation.issues.map(i => `• ${i}`).join('\n');
      alert(`Cannot download widget due to quality issues:\n\n${issuesText}\n\nPlease fix these issues first.`);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ [Download] Validation warnings:', validation.warnings);
      const warningsText = validation.warnings.map(w => `• ${w}`).join('\n');
      const proceed = confirm(`Widget has minor quality warnings:\n\n${warningsText}\n\nDownload anyway?`);
      if (!proceed) {
        console.log('📥 [Download] Cancelled by user');
        return;
      }
    }

    console.log('✅ [Download] Validation passed, proceeding...');

    setOperationMode('downloading');

    try {
      const canvas = await html2canvas(widgetElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          setOperationMode('idle');
          return;
        }

        const metadata = validation.metadata;
        const presetCode = selectedPreset;
        const filename = `${presetCode}_${metadata.width}x${metadata.height}_ar${metadata.aspectRatio.toFixed(4).replace('.', '-')}.png`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        console.log(`✅ [Download] Completed: ${filename}`);
        setOperationMode('idle');
      }, 'image/png');
    } catch (error) {
      console.error('❌ [Download] Failed:', error);
      alert(`Download failed: ${error.message}`);
      setOperationMode('idle');
    }
  };

  const handleAutoResizeByRatio = useCallback(async (ratioOverride) => {
    const r = ratioOverride ?? parseAspectRatio(ratioInput);
    if (!r) return;

    await executeAutoResize(r, widgetFrameRef);
  }, [ratioInput, executeAutoResize]);

  const handleWidgetGenerated = async (widgetSpec, aspectRatio) => {
    const specStr = JSON.stringify(widgetSpec, null, 2);
    setEditedSpec(specStr);
    setRatioInput(aspectRatio.toString());
  };

  const { frameSize, setFrameSize } = useWidgetFrame(frameEl);

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
          operationMode={operationMode}
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
