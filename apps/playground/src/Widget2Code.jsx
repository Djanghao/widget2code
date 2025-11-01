import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { exportWidget } from '@widget-factory/exporter';
import TreeView from './TreeView.jsx';
import DSLEditor from './components/core/DSLEditor.jsx';
import CodeViewer from './components/core/CodeViewer.jsx';
import PreviewPanel from './components/core/PreviewPanel.jsx';
import SystemPromptEditor from './components/core/SystemPromptEditor.jsx';
import SectionHeader from './components/core/SectionHeader.jsx';
import { useApiKey } from './components/ApiKeyManager.jsx';
import usePlaygroundStore from './store/index.js';
import imagePrompt from '../../../libs/python/generator/prompts/widget2dsl/widget2dsl.md?raw';
import ExtractionDebugModal from './components/ExtractionDebugModal.jsx';

const VISION_MODELS = [
  { value: 'qwen3-vl-235b-a22b-instruct', label: 'qwen3-vl-235b-a22b-instruct' },
  { value: 'qwen3-vl-235b-a22b-thinking', label: 'qwen3-vl-235b-a22b-thinking' },
  { value: 'qwen3-vl-plus', label: 'qwen3-vl-plus' },
  { value: 'qwen3-vl-flash', label: 'qwen3-vl-flash' },
];

function Widget2Code() {
  const { apiKey, hasApiKey } = useApiKey();
  const { executeAutoResize, autoSizing, startCompiling, generatedJSX: storeGeneratedCode, treeRoot: storeTreeRoot } = usePlaygroundStore();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(imagePrompt);
  const [model, setModel] = useState('qwen3-vl-235b-a22b-instruct');
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [pipelineData, setPipelineData] = useState(null);

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
  }, [handleImageFile]);

  useEffect(() => {
    if (storeGeneratedCode) {
      setGeneratedCode(storeGeneratedCode);
    }
  }, [storeGeneratedCode]);

  useEffect(() => {
    if (storeTreeRoot) {
      setTreeRoot(storeTreeRoot);
    }
  }, [storeTreeRoot]);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setError('API key required');
      return;
    }

    if (!image) {
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
      formData.append('retrieval_topk', '50');
      formData.append('retrieval_topm', '10');
      formData.append('retrieval_alpha', '0.8');
      formData.append('image', image);
      formData.append('icon_lib_names', 'sf');

      const response = await fetch('/api/generate-widget-full', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate widget');
      }

      setPreviewSpec(data.widgetDSL);
      setPipelineData(data);
      await startCompiling(data.widgetDSL, widgetFrameRef);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoResizeByRatio = useCallback(async (ratioOverride) => {
    const r = ratioOverride ?? parseAspectRatio(ratioInput);
    if (!r) return;
    await executeAutoResize(r, widgetFrameRef);
  }, [ratioInput, executeAutoResize]);

  const handleDownloadWidget = async () => {
    const widgetElement = widgetFrameRef.current?.firstElementChild;
    if (!widgetElement || !previewSpec) {
      alert('No widget to download');
      return;
    }

    setIsDownloading(true);
    try {
      const rect = widgetElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const aspectRatio = previewSpec.widget?.aspectRatio || (width / height);

      const metadata = {
        width,
        height,
        aspectRatio
      };
      await exportWidget(widgetElement, 'generated-widget', metadata);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isNarrow = viewportWidth < 1300;

  const handleOpenDebugModal = async () => {
    if (!pipelineData) {
      setError('Please generate the widget first');
      return;
    }
    setDebugModalOpen(true);
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 12, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, maxHeight: '100%', overflow: 'auto', padding: '0 12px 0 0' }}>
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

        <SystemPromptEditor
          value={systemPrompt}
          onChange={setSystemPrompt}
          model={model}
          setModel={setModel}
          onReset={() => setSystemPrompt(imagePrompt)}
          extraActionsRight={(
            <button
              onClick={handleOpenDebugModal}
              disabled={!pipelineData}
              title={pipelineData ? 'Show extraction debug' : 'Generate widget first'}
              style={{
                flex: '0 0 auto',
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#2c2c2e',
                color: '#f5f5f7',
                border: '1px solid #3a3a3c',
                borderRadius: 6,
                cursor: (!pipelineData) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => { if (pipelineData) e.currentTarget.style.backgroundColor = '#3a3a3c'; }}
              onMouseLeave={(e) => { if (pipelineData) e.currentTarget.style.backgroundColor = '#2c2c2e'; }}
            >
              Extraction Debug
            </button>
          )}
          modelOptions={VISION_MODELS}
          dotColor="#34C759"
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !image}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: !image ? '#3a3a3c' : '#007AFF',
            color: '#f5f5f7',
            border: 'none',
            borderRadius: 10,
            cursor: (isGenerating || !image) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            if (!isGenerating && image) {
              e.currentTarget.style.backgroundColor = '#0051D5';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating && image) {
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
    <ExtractionDebugModal
      isOpen={debugModalOpen}
      onClose={() => setDebugModalOpen(false)}
      data={pipelineData}
      baseImageUrl={pipelineData?.iconDebugInfo?.processedImageUrl || imagePreview}
    />
    </>
  );
}

export default Widget2Code;
