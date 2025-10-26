/**
 * @file WidgetGeneration.jsx
 * @description Unified widget generation page with text/image mode switching
 * @author Houston Zhang
 * @date 2025-10-19
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { compileWidgetDSLToJSX } from '@widget-factory/compiler';
import { exportWidget } from '@widget-factory/exporter';
import TreeView from './TreeView.jsx';
import DSLEditor from './components/core/DSLEditor.jsx';
import CodeViewer from './components/core/CodeViewer.jsx';
import PreviewPanel from './components/core/PreviewPanel.jsx';
import SystemPromptEditor from './components/core/SystemPromptEditor.jsx';
import SectionHeader from './components/core/SectionHeader.jsx';
import { useApiKey } from './components/ApiKeyManager.jsx';
import sfOnlyPrompt from '../../api/prompt2spec-sf-only.md?raw';
import lucideOnlyPrompt from '../../api/prompt2spec-lucide-only.md?raw';
import bothIconsPrompt from '../../api/prompt2spec-both.md?raw';

const TEXT_MODELS = [
  { value: 'qwen3-coder-plus', label: 'qwen3-coder-plus' },
  { value: 'qwen3-coder-flash', label: 'qwen3-coder-flash' },
  { value: 'qwen3-max', label: 'qwen3-max' },
  { value: 'qwen3-235b-a22b-instruct-2507', label: 'qwen3-235b-a22b-instruct-2507' },
  { value: 'qwen3-235b-a22b-thinking-2507', label: 'qwen3-235b-a22b-thinking-2507' },
  { value: 'qwen3-coder-480b-a35b-instruct', label: 'qwen3-coder-480b-a35b-instruct' },
];

const VISION_MODELS = [
  { value: 'qwen3-vl-235b-a22b-instruct', label: 'qwen3-vl-235b-a22b-instruct' },
  { value: 'qwen3-vl-235b-a22b-thinking', label: 'qwen3-vl-235b-a22b-thinking' },
  { value: 'qwen3-vl-plus', label: 'qwen3-vl-plus' },
  { value: 'qwen3-vl-flash', label: 'qwen3-vl-flash' },
];

function WidgetGeneration() {
  const { apiKey, hasApiKey } = useApiKey();
  const [mode, setMode] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [promptType, setPromptType] = useState('both');
  const [systemPrompt, setSystemPrompt] = useState(bothIconsPrompt);
  const [defaultPrompt, setDefaultPrompt] = useState(bothIconsPrompt);
  const [model, setModel] = useState('qwen3-coder-plus');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [previewSpec, setPreviewSpec] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [treeRoot, setTreeRoot] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const widgetFrameRef = useRef(null);
  const treeContainerRef = useRef(null);
  const [enableAutoResize, setEnableAutoResize] = useState(true);
  const [ratioInput, setRatioInput] = useState('');
  const [autoSizing, setAutoSizing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const map = { sf: sfOnlyPrompt, lucide: lucideOnlyPrompt, both: bothIconsPrompt };
    const p = map[promptType];
    setSystemPrompt(p);
    setDefaultPrompt(p);
  }, [promptType]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!treeContainerRef.current) return;
      if (!treeContainerRef.current.contains(e.target)) setSelectedPath(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImagePreview(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    handleImageFile(file);
  }, [handleImageFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: false
  });

  useEffect(() => {
    if (mode !== 'image') return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mode, handleImageFile]);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setError('API key required');
      return;
    }

    if (mode === 'text' && !prompt.trim()) {
      setError('Please enter a widget description');
      return;
    }
    if (mode === 'image' && !image) {
      setError('Please upload an image');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('system_prompt', systemPrompt);
      if (model) formData.append('model', model);
      if (apiKey) formData.append('api_key', apiKey);

      let response;
      if (mode === 'text') {
        formData.append('user_prompt', prompt);
        response = await fetch('/api/generate-widget-text', { method: 'POST', body: formData });
      } else {
        formData.append('image', image);
        response = await fetch('/api/generate-widget', { method: 'POST', body: formData });
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate widget');
      }

      setPreviewSpec(data.widgetDSL);
      setTreeRoot(data.widgetDSL?.widget || null);

      try {
        const jsx = compileWidgetDSLToJSX(data.widgetDSL);
        setGeneratedCode(jsx);
      } catch (compileError) {
        setGeneratedCode(`// Compilation Error: ${compileError.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'text') {
      setModel('qwen3-coder-plus');
    } else {
      setModel('qwen3-vl-235b-a22b-instruct');
    }
    setGeneratedCode('');
    setError(null);
  };

  const handleAutoResizeByRatio = async () => {};

  const handleDownloadWidget = async () => {
    const widgetElement = widgetFrameRef.current?.firstElementChild;
    if (!widgetElement || !previewSpec) {
      alert('No widget to download');
      return;
    }

    setIsDownloading(true);
    try {
      const metadata = {
        width: widgetElement.getBoundingClientRect().width,
        height: widgetElement.getBoundingClientRect().height
      };
      await exportWidget(widgetElement, 'generated-widget', metadata);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentModels = mode === 'text' ? TEXT_MODELS : VISION_MODELS;

  // Track viewport width for responsive layout
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isNarrow = viewportWidth < 1300;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 12, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, maxHeight: '100%', overflow: 'auto', padding: '0 12px 0 0' }}>
        <div style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          backgroundColor: '#1a1a1c',
          borderRadius: 10,
          border: '1px solid #2a2a2c'
        }}>
          <button
            onClick={() => handleModeChange('text')}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: mode === 'text' ? '#007AFF' : 'transparent',
              color: mode === 'text' ? '#fff' : '#999',
              border: 'none',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Text
          </button>
          <button
            onClick={() => handleModeChange('image')}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: mode === 'image' ? '#007AFF' : 'transparent',
              color: mode === 'image' ? '#fff' : '#999',
              border: 'none',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Image
          </button>
        </div>

        {mode === 'text' ? (
          <div style={{
            backgroundColor: '#1a1a1c',
            borderRadius: 10,
            padding: 14,
            border: '1px solid #2a2a2c',
            height: 240,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the widget you want to create..."
              style={{
                width: '100%',
                flex: 1,
                padding: 14,
                backgroundColor: '#2a2a2c',
                color: '#fff',
                border: '1px solid #3a3a3c',
                borderRadius: 10,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5
              }}
            />
          </div>
        ) : (
          <div style={{
            backgroundColor: '#1a1a1c',
            borderRadius: 10,
            padding: 14,
            border: '1px solid #2a2a2c',
            height: 240,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              UI Image
            </label>
            <div
              {...getRootProps()}
              style={{
                border: `1px solid #3a3a3c`,
                borderRadius: 10,
                padding: 14,
                textAlign: 'center',
                backgroundColor: isDragActive ? 'rgba(0, 122, 255, 0.1)' : '#2a2a2c',
                cursor: 'pointer',
                transition: 'all 0.3s',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              <input {...getInputProps()} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: `2px dashed ${isDragActive ? '#007AFF' : 'transparent'}`,
                  borderRadius: 10,
                  pointerEvents: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              {imagePreview ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '130px',
                      borderRadius: 8,
                      marginBottom: 8,
                      objectFit: 'contain'
                    }}
                  />
                  <div style={{ fontSize: 12, color: '#999' }}>
                    Click, drag, or <kbd style={{
                      padding: '2px 6px',
                      backgroundColor: '#3a3a3c',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      border: '1px solid #4a4a4c'
                    }}>Copy</kbd> to replace
                  </div>
                </div>
              ) : (
                <div style={{ color: '#999', width: '100%' }}>
                  <div style={{ marginBottom: 12 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                    {isDragActive ? 'Drop image here' : 'Upload or paste image'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Drag & drop, click, or <kbd style={{
                      padding: '2px 6px',
                      backgroundColor: '#3a3a3c',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      border: '1px solid #4a4a4c'
                    }}>Copy</kbd>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <SystemPromptEditor
          value={systemPrompt}
          onChange={setSystemPrompt}
          promptType={promptType}
          setPromptType={setPromptType}
          model={model}
          setModel={setModel}
          onReset={() => setSystemPrompt(defaultPrompt)}
          modelOptions={currentModels}
          dotColor="#34C759"
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: ((mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)) ? '#3a3a3c' : '#007AFF',
            color: '#f5f5f7',
            border: 'none',
            borderRadius: 10,
            cursor: (isGenerating || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            if (!isGenerating && ((mode === 'text' && prompt.trim()) || (mode === 'image' && image))) {
              e.currentTarget.style.backgroundColor = '#0051D5';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating && ((mode === 'text' && prompt.trim()) || (mode === 'image' && image))) {
              e.currentTarget.style.backgroundColor = '#007AFF';
            }
          }}
        >
          {isGenerating ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" role="img">
                <circle cx="12" cy="12" r="10" stroke="#8e8e93" strokeWidth="3" fill="none" opacity="0.25" />
                <path d="M12 2 a10 10 0 0 1 0 20" stroke="#f5f5f7" strokeWidth="3" strokeLinecap="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
                </path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Widget'
          )}
        </button>

        {error && (
          <div style={{
            backgroundColor: '#3a0a0a',
            border: '1px solid #6e1a1a',
            borderRadius: 10,
            padding: 12,
            color: '#ff6b6b',
            fontSize: 12
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
        gridTemplateRows: isNarrow ? 'auto auto auto auto' : '1fr 1fr',
        gridTemplateAreas: isNarrow
          ? '"spec" "preview" "code" "tree"'
          : '"spec preview" "code tree"',
        gap: 12,
        minWidth: 0,
        minHeight: 0,
        gridAutoRows: isNarrow ? 'minmax(0, auto)' : 'minmax(0, 1fr)'
      }}>
        <div style={{ gridArea: 'spec', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <DSLEditor
            value={previewSpec ? JSON.stringify(previewSpec, null, 2) : ''}
            readOnly
          />
        </div>

        <div style={{ gridArea: 'preview', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PreviewPanel
            previewSpec={previewSpec}
            generatedCode={generatedCode}
            widgetFrameRef={widgetFrameRef}
            ratioInput={ratioInput}
            setRatioInput={setRatioInput}
            autoSizing={autoSizing}
            handleAutoResizeByRatio={handleAutoResizeByRatio}
            enableAutoResize={enableAutoResize}
            setEnableAutoResize={setEnableAutoResize}
            handleDownloadWidget={handleDownloadWidget}
            isDownloading={isDownloading}
            dotColor="#007AFF"
          />
        </div>

        <div style={{ gridArea: 'code', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CodeViewer
            code={generatedCode}
            title="Generated WidgetPreview.jsx"
          />
        </div>

        <div ref={treeContainerRef} style={{ gridArea: 'tree', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Tree View" dotColor="#FF375F" />
          <div style={{ flex: 1, minHeight: 0, borderRadius: 10, border: '1px solid #3a3a3c', backgroundColor: '#0d0d0d', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TreeView root={treeRoot} style={{ flex: 1, minHeight: 0 }} selectedPath={selectedPath} onSelect={(p) => setSelectedPath((prev) => (prev === p ? null : p))} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WidgetGeneration;
