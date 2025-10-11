import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import WidgetPreview from './generated/WidgetPreview.jsx';
import TreeView from './TreeView.jsx';
import defaultPromptContent from '../api/default-prompt.md?raw';
import { useAutoResize } from './hooks/useAutoResize';

function ImageToWidget({ onWidgetGenerated }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(defaultPromptContent);
  const [defaultPrompt, setDefaultPrompt] = useState(defaultPromptContent);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [previewSpec, setPreviewSpec] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [treeRoot, setTreeRoot] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const widgetFrameRef = useRef(null);
  const treeContainerRef = useRef(null);

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

  const handleSelectNode = (path) => setSelectedPath(prev => (prev === path ? null : path));

  const { autoSizing, handleAutoResizeByRatio } = useAutoResize(widgetFrameRef, async (updatedSpec) => {
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

        await handleAutoResizeByRatio(data.widgetSpec, data.aspectRatio);
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '350px 1fr',
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

        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <h2 style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              color: '#f5f5f7',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#FF9500'
              }} />
              System Prompt
            </h2>
            <button
              onClick={handleResetPrompt}
              style={{
                padding: '6px 12px',
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
            >
              Reset to Default
            </button>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              minHeight: 0,
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
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007AFF'}
            onBlur={(e) => e.target.style.borderColor = '#3a3a3c'}
          />
        </div>
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
          </h2>
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <textarea
              value={previewSpec ? JSON.stringify(previewSpec, null, 2) : ''}
              readOnly
              spellCheck={false}
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
                outline: 'none'
              }}
            />
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
              backgroundColor: '#BF5AF2'
            }} />
            Preview
          </h2>
          <div style={{
            flex: 1,
            backgroundColor: '#0d0d0d',
            padding: 24,
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 0,
            boxSizing: 'border-box',
            border: '1px solid #3a3a3c',
            overflow: 'auto',
            position: 'relative'
          }}>
            {previewSpec ? (
              <div ref={widgetFrameRef} style={{ display: 'inline-block', position: 'relative' }}>
                <WidgetPreview />
                {autoSizing && (
                  <div style={{
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
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" role="img">
                      <circle cx="12" cy="12" r="10" stroke="#8e8e93" strokeWidth="3" fill="none" opacity="0.25" />
                      <path d="M12 2 a10 10 0 0 1 0 20" stroke="#007AFF" strokeWidth="3" strokeLinecap="round" fill="none">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
                      </path>
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6e6e73', fontSize: 14 }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 9h8M8 12h8M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>Generate a widget to see preview</div>
              </div>
            )}
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
            Generated WidgetPreview.jsx
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
                {generatedCode || '// Generate a widget to see code'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'tree' }}>
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
