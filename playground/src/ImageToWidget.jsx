import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import TreeView from './TreeView.jsx';
import SpecEditor from './components/core/SpecEditor.jsx';
import CodeViewer from './components/core/CodeViewer.jsx';
import PreviewPanel from './components/core/PreviewPanel.jsx';
import SystemPromptEditor from './components/core/SystemPromptEditor.jsx';
import sfOnlyPrompt from '../api/sf-only-prompt.md?raw';
import lucideOnlyPrompt from '../api/lucide-only-prompt.md?raw';
import bothIconsPrompt from '../api/both-icons-prompt.md?raw';
import { useAutoResize } from './hooks/useAutoResize';

function ImageToWidget({ onWidgetGenerated }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [promptType, setPromptType] = useState('both');
  const [systemPrompt, setSystemPrompt] = useState(bothIconsPrompt);
  const [defaultPrompt, setDefaultPrompt] = useState(bothIconsPrompt);
  const [model, setModel] = useState('qwen3-vl-plus');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [previewSpec, setPreviewSpec] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [treeRoot, setTreeRoot] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const widgetFrameRef = useRef(null);
  const treeContainerRef = useRef(null);
  const [enableAutoResize, setEnableAutoResize] = useState(true);

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

  useEffect(() => {
    const promptMap = {
      'sf': sfOnlyPrompt,
      'lucide': lucideOnlyPrompt,
      'both': bothIconsPrompt
    };
    const selectedPrompt = promptMap[promptType];
    setSystemPrompt(selectedPrompt);
    setDefaultPrompt(selectedPrompt);
  }, [promptType]);

  const handleSelectNode = (path) => setSelectedPath(prev => (prev === path ? null : path));

  const { ratioInput, setRatioInput, autoSizing, handleAutoResizeByRatio } = useAutoResize(widgetFrameRef, async (updatedSpec) => {
    setPreviewSpec(updatedSpec);
    const jsx = compileWidgetSpecToJSX(updatedSpec);
    await fetch('/__write_widget_preview', {
      method: 'POST',
      body: jsx,
      headers: { 'Content-Type': 'text/plain' }
    });
  });

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        setAspectRatio(ratio);
        setImagePreview(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  });

  const handleGenerate = async () => {
    if (!image) return;

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('system_prompt', systemPrompt);
      if (model) formData.append('model', model);

      const response = await fetch('/api/generate-widget', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate widget');
      }

      setPreviewSpec(data.widgetSpec);
      setTreeRoot(data.widgetSpec?.widget || null);

      try {
        const jsx = compileWidgetSpecToJSX(data.widgetSpec);
        setGeneratedCode(jsx);

        await fetch('/__write_widget_preview', {
          method: 'POST',
          body: jsx,
          headers: { 'Content-Type': 'text/plain' }
        });

        const hasWH =
          data.widgetSpec?.widget?.width !== undefined &&
          data.widgetSpec?.widget?.height !== undefined;
        if (enableAutoResize && !hasWH) {
          await handleAutoResizeByRatio(data.widgetSpec, data.aspectRatio);
        }
      } catch (compileError) {
        setGeneratedCode(`// Compilation Error: ${compileError.message}`);
      }

      onWidgetGenerated(data.widgetSpec, data.aspectRatio);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetPrompt = () => {
    setSystemPrompt(defaultPrompt);
  };

  const formatAspectRatio = (ratio) => {
    if (!ratio) return '';
    const commonRatios = [
      { ratio: 16/9, label: '16:9' },
      { ratio: 4/3, label: '4:3' },
      { ratio: 1, label: '1:1' },
      { ratio: 3/2, label: '3:2' },
      { ratio: 21/9, label: '21:9' }
    ];
    const match = commonRatios.find(r => Math.abs(r.ratio - ratio) < 0.01);
    return match ? `${match.label} (${ratio.toFixed(3)})` : ratio.toFixed(3);
  };

  const previewWidth = previewSpec?.widget?.width;
  const previewHeight = previewSpec?.widget?.height;
  const previewAspectRatio = previewSpec?.widget?.aspectRatio;

  useEffect(() => {
    if (!enableAutoResize) return;
    const w = previewSpec?.widget;
    if (!w) return;
    const hasWH = previewWidth !== undefined && previewHeight !== undefined;
    const r = previewAspectRatio ?? aspectRatio;
    if (!hasWH && typeof r === 'number' && isFinite(r) && r > 0) {
      handleAutoResizeByRatio(previewSpec, r);
    }
  }, [enableAutoResize, previewWidth, previewHeight, previewAspectRatio, aspectRatio]);

  const visionModelOptions = [
    { value: 'qwen3-vl-plus', label: 'Qwen3 VL Plus' },
    { value: 'qwen-vl-plus', label: 'Qwen VL Plus' },
    { value: 'qwen-vl-max', label: 'Qwen VL Max' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '420px 1fr',
      gap: 12,
      height: '100%',
      minHeight: 0
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <div style={{ flex: '0 0 auto' }}>
          <h2 style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 8,
            color: '#f5f5f7',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#34C759'
            }} />
            Upload Image
          </h2>
          <div
            {...getRootProps()}
            style={{
              backgroundColor: isDragActive ? '#1a2a3a' : '#2c2c2e',
              border: `2px dashed ${isDragActive ? '#007AFF' : '#3a3a3c'}`,
              borderRadius: 10,
              padding: 24,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <input {...getInputProps()} />
            {imagePreview ? (
              <div style={{ width: '100%' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                    marginBottom: 12
                  }}
                />
                {aspectRatio && (
                  <div style={{
                    fontSize: 13,
                    color: '#98989d',
                    marginTop: 8
                  }}>
                    Aspect Ratio: {formatAspectRatio(aspectRatio)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6e6e73" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="#6e6e73" />
                  <path d="M3 15l5-5 4 4 7-7" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ fontSize: 15, color: '#f5f5f7', marginBottom: 8, fontWeight: 500 }}>
                  {isDragActive ? 'Drop image here' : 'Drag & drop an image'}
                </div>
                <div style={{ fontSize: 13, color: '#6e6e73' }}>
                  or click to browse
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <button
            onClick={handleGenerate}
            disabled={!image || isGenerating}
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 600,
              backgroundColor: (!image || isGenerating) ? '#3a3a3c' : '#007AFF',
              color: '#f5f5f7',
              border: 'none',
              borderRadius: 10,
              cursor: (!image || isGenerating) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              if (image && !isGenerating) e.currentTarget.style.backgroundColor = '#0051D5';
            }}
            onMouseLeave={(e) => {
              if (image && !isGenerating) e.currentTarget.style.backgroundColor = '#007AFF';
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
              'Generate Widget from Image'
            )}
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#3a0a0a',
            border: '1px solid #6e1a1a',
            borderRadius: 10,
            padding: 16,
            color: '#ff6b6b',
            fontSize: 13,
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Error</div>
            {error}
          </div>
        )}

        <SystemPromptEditor
          value={systemPrompt}
          onChange={setSystemPrompt}
          promptType={promptType}
          setPromptType={setPromptType}
          model={model}
          setModel={setModel}
          onReset={handleResetPrompt}
          modelOptions={visionModelOptions}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gridTemplateAreas: '"spec preview" "code tree"',
        gap: 12,
        minWidth: 0,
        minHeight: 0,
        gridAutoRows: 'minmax(0, 1fr)'
      }}>
        <div style={{ gridArea: 'spec', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <SpecEditor
            value={previewSpec ? JSON.stringify(previewSpec, null, 2) : ''}
            readOnly
          />
        </div>

        <div style={{ gridArea: 'preview', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PreviewPanel
            previewSpec={previewSpec}
            widgetFrameRef={widgetFrameRef}
            ratioInput={ratioInput}
            setRatioInput={setRatioInput}
            autoSizing={autoSizing}
            handleAutoResizeByRatio={handleAutoResizeByRatio}
            enableAutoResize={enableAutoResize}
            setEnableAutoResize={setEnableAutoResize}
          />
        </div>

        <div style={{ gridArea: 'code', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CodeViewer
            code={generatedCode}
            title="Generated WidgetPreview.jsx"
          />
        </div>

        <div style={{ gridArea: 'tree', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
              backgroundColor: '#FF375F'
            }} />
            Tree View
          </h2>
          <div
            ref={treeContainerRef}
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: 10,
              border: '1px solid #3a3a3c',
              backgroundColor: '#0d0d0d',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <TreeView
              root={treeRoot}
              style={{ flex: 1, minHeight: 0 }}
              selectedPath={selectedPath}
              onSelect={handleSelectNode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageToWidget;
