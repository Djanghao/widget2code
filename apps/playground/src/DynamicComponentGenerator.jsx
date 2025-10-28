import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { DynamicComponent, generateComponent, generateComponentFromImage } from '@widget-factory/dynamic';
import { exportWidget } from '@widget-factory/exporter';
import SectionHeader from './components/core/SectionHeader.jsx';
import CodeViewer from './components/core/CodeViewer.jsx';
import SystemPromptEditor from './components/core/SystemPromptEditor.jsx';
import DownloadButton from './DownloadButton.jsx';
import DimensionLines from './components/DimensionLines.jsx';
import { useApiKey } from './components/ApiKeyManager.jsx';
import textPrompt from '../../api/prompts/dynamic/prompt2react/dynamic-component-prompt.md?raw';
import imagePrompt from '../../api/prompts/dynamic/image2react/dynamic-component-image-prompt.md?raw';

const TEXT_MODELS = [
  { value: 'qwen3-max', label: 'qwen3-max' },
  { value: 'qwen3-coder-480b-a35b-instruct', label: 'qwen3-coder-480b-a35b-instruct' },
  { value: 'qwen3-coder-plus', label: 'qwen3-coder-plus' },
];

const VISION_MODELS = [
  { value: 'qwen3-vl-235b-a22b-instruct', label: 'qwen3-vl-235b-a22b-instruct' },
  { value: 'qwen3-vl-235b-a22b-thinking', label: 'qwen3-vl-235b-a22b-thinking' },
  { value: 'qwen3-vl-plus', label: 'qwen3-vl-plus' },
  { value: 'qwen3-vl-flash', label: 'qwen3-vl-flash' },
];

export default function DynamicComponentGenerator() {
  const { apiKey, hasApiKey } = useApiKey();
  const [mode, setMode] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  const [model, setModel] = useState('qwen3-max');
  const [systemPrompt, setSystemPrompt] = useState(textPrompt);
  const [defaultPrompt, setDefaultPrompt] = useState(textPrompt);
  const [generatedCode, setGeneratedCode] = useState('');
  const [finalSize, setFinalSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const componentRef = useRef(null);
  const [componentSize, setComponentSize] = useState({ width: 0, height: 0 });
  // Unified styling with WidgetGeneration; copy UI removed

  const handleImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
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
      alert('Please enter a component description');
      return;
    }
    if (mode === 'image' && !image) {
      alert('Please upload an image');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedCode('');
    setFinalSize(null);

    let result;
    if (mode === 'text') {
      result = await generateComponent(prompt, width, height, model, systemPrompt, apiKey);
    } else {
      result = await generateComponentFromImage(image, width, height, model, systemPrompt, apiKey);
    }

    if (result.error) {
      setError(result.error);
    } else {
      setGeneratedCode(result.code);
    }

    setLoading(false);
  };

  // Copy handled externally if needed

  const handleSizeChange = (size) => {
    setFinalSize(size);
    setComponentSize(size);
  };

  useEffect(() => {
    const el = componentRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setComponentSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [generatedCode]);

  const handleRenderError = (err) => {
    setError(`Render error: ${err.message}`);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'text') {
      setModel('qwen3-max');
      setSystemPrompt(textPrompt);
      setDefaultPrompt(textPrompt);
    } else {
      setModel('qwen3-vl-235b-a22b-instruct');
      setSystemPrompt(imagePrompt);
      setDefaultPrompt(imagePrompt);
    }
    setGeneratedCode('');
    setFinalSize(null);
    setError(null);
  };

  const handleDownloadComponent = async () => {
    const componentElement = componentRef.current;
    if (!componentElement || !generatedCode) {
      alert('No component to download');
      return;
    }

    setIsDownloading(true);
    try {
      const metadata = {
        width: componentElement.getBoundingClientRect().width,
        height: componentElement.getBoundingClientRect().height
      };
      await exportWidget(componentElement, 'generated-component', metadata);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentModels = mode === 'text' ? TEXT_MODELS : VISION_MODELS;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '420px 1fr',
      gap: 12,
      height: '100%',
      minHeight: 0
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 0,
        maxHeight: '100%',
        overflow: 'auto',
        padding: '0 12px 0 0'
      }}>

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
              placeholder="Describe the component you want to create..."
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          backgroundColor: '#1a1a1c',
          borderRadius: 10,
          padding: 14,
          border: '1px solid #2a2a2c'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Width
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  setWidth(val);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: '#2c2c2e',
                color: '#f5f5f7',
                border: '1px solid #3a3a3c',
                borderRadius: 6,
                fontSize: 12,
                boxSizing: 'border-box',
                fontWeight: 500,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) {
                  setWidth(100);
                }
                e.target.style.borderColor = '#3a3a3c';
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Height
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  setHeight(val);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: '#2c2c2e',
                color: '#f5f5f7',
                border: '1px solid #3a3a3c',
                borderRadius: 6,
                fontSize: 12,
                boxSizing: 'border-box',
                fontWeight: 500,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) {
                  setHeight(100);
                }
                e.target.style.borderColor = '#3a3a3c';
              }}
            />
          </div>
        </div>

        <SystemPromptEditor
          value={systemPrompt}
          onChange={setSystemPrompt}
          model={model}
          setModel={setModel}
          onReset={() => setSystemPrompt(defaultPrompt)}
          modelOptions={currentModels}
          dotColor="#007AFF"
        />

        <button
          onClick={handleGenerate}
          disabled={loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)}
          style={{
            width: '100%',
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            backgroundColor: ((mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)) ? '#3a3a3c' : '#007AFF',
            color: '#f5f5f7',
            border: 'none',
            borderRadius: 10,
            cursor: (loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            if (!loading && ((mode === 'text' && prompt.trim()) || (mode === 'image' && image))) {
              e.currentTarget.style.backgroundColor = '#0051D5';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && ((mode === 'text' && prompt.trim()) || (mode === 'image' && image))) {
              e.currentTarget.style.backgroundColor = '#007AFF';
            }
          }}
        >
          {loading ? (
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
            'Generate Component'
          )}
        </button>

        {error && (
          <div style={{
            padding: 14,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            color: '#ff6b6b',
            fontSize: 13,
            lineHeight: 1.6
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <strong>Error</strong>
                <div style={{ marginTop: 4, color: '#ffaaaa' }}>{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        minWidth: 0,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }}>
        <div style={{ minWidth: 0, minHeight: 0 }}>
          <CodeViewer
            code={generatedCode}
            language="jsx"
            title="Generated Component.jsx"
            placeholder="// Generate a component to see code"
          />
        </div>

        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Auto-sized Preview */}
          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
            <SectionHeader title="Live Preview (Auto-sized)" dotColor="#34C759">
              {finalSize && (
                <div style={{
                  padding: '4px 10px',
                  backgroundColor: '#1a1a1c',
                  borderRadius: 9999,
                  fontSize: 12,
                  color: '#999',
                  border: '1px solid #2a2a2c',
                  fontWeight: 500
                }}>
                  {width}×{height} → {finalSize.width}×{finalSize.height}
                  {(finalSize.width !== width || finalSize.height !== height) && (
                    <span style={{
                      marginLeft: 8,
                      padding: '2px 6px',
                      backgroundColor: 'rgba(255, 149, 0, 0.15)',
                      color: '#FF9500',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      Auto-resized
                    </span>
                  )}
                </div>
              )}
            </SectionHeader>

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
              {generatedCode ? (
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -24,
                      left: 0,
                      fontSize: 11,
                      color: 'rgba(52, 199, 89, 0.6)',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}
                  >
                    OPTIMAL SIZE
                  </div>
                  <div
                    ref={componentRef}
                    style={{
                      border: '2px solid rgba(52, 199, 89, 0.5)',
                      display: 'inline-block',
                      position: 'relative',
                      borderRadius: 8
                    }}
                  >
                    <DynamicComponent
                      code={generatedCode}
                      suggestedWidth={width}
                      suggestedHeight={height}
                      onSizeChange={handleSizeChange}
                      onError={handleRenderError}
                    />
                  </div>
                  {componentSize.width > 0 && componentSize.height > 0 && (
                    <DimensionLines width={componentSize.width} height={componentSize.height} />
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6e6e73',
                  fontSize: 14
                }}>
                  <div style={{ marginBottom: 16, opacity: 0.5 }}>
                    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 9h8M8 12h8M8 15h4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No component generated yet</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: '#5a5a5e' }}>
                    Create a component to see the preview
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scaled Preview */}
          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
            <SectionHeader title="Scaled Preview" dotColor="#007AFF">
              <DownloadButton
                onClick={handleDownloadComponent}
                isDisabled={!generatedCode}
                isLoading={isDownloading || loading}
                statusText={isDownloading ? 'Downloading...' : (loading ? 'Generating...' : '')}
              />
            </SectionHeader>

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
              {generatedCode && finalSize ? (
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -24,
                      left: 0,
                      fontSize: 11,
                      color: 'rgba(0, 122, 255, 0.6)',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}
                  >
                    TARGET: {width}×{height}px
                  </div>
                  <div
                    style={{
                      border: '2px solid rgba(0, 122, 255, 0.5)',
                      display: 'inline-block',
                      position: 'relative',
                      borderRadius: 8,
                      width: width,
                      height: height,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: finalSize.width,
                        height: finalSize.height,
                        transform: `scale(${Math.min(width / finalSize.width, height / finalSize.height)})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                    >
                      <DynamicComponent
                        code={generatedCode}
                        suggestedWidth={width}
                        suggestedHeight={height}
                        onSizeChange={() => {}}
                        onError={handleRenderError}
                        enableDragResize={false}
                      />
                    </div>
                  </div>
                  <DimensionLines width={width} height={height} />
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6e6e73',
                  fontSize: 14
                }}>
                  <div style={{ marginBottom: 16, opacity: 0.5 }}>
                    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 9h8M8 12h8M8 15h4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No component generated yet</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: '#5a5a5e' }}>
                    Create a component to see the scaled preview
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.5;
        }

        select option {
          background-color: #2a2a2c;
        }
      `}</style>
    </div>
  );
}
