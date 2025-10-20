import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { DynamicComponent, generateComponent, generateComponentFromImage } from '@widget-factory/dynamic';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('javascript', javascript);

const TEXT_MODELS = [
  { value: 'qwen3-max', label: 'Qwen3 Max' },
  { value: 'qwen3-coder-480b-a35b-instruct', label: 'Qwen3 Coder 480B' },
  { value: 'qwen3-coder-plus', label: 'Qwen3 Coder Plus' },
];

const VISION_MODELS = [
  { value: 'qwen3-vl-235b-a22b-instruct', label: 'Qwen3 VL 235B Instruct' },
  { value: 'qwen3-vl-235b-a22b-thinking', label: 'Qwen3 VL 235B Thinking' },
  { value: 'qwen3-vl-plus', label: 'Qwen3 VL Plus' },
  { value: 'qwen3-vl-flash', label: 'Qwen3 VL Flash' },
];

export default function DynamicComponentTest() {
  const [mode, setMode] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  const [model, setModel] = useState('qwen3-max');
  const [generatedCode, setGeneratedCode] = useState('');
  const [finalSize, setFinalSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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
      result = await generateComponent(prompt, width, height, model);
    } else {
      result = await generateComponentFromImage(image, width, height, model);
    }

    if (result.error) {
      setError(result.error);
    } else {
      setGeneratedCode(result.code);
    }

    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSizeChange = (size) => {
    setFinalSize(size);
  };

  const handleRenderError = (err) => {
    setError(`Render error: ${err.message}`);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'text') {
      setModel('qwen3-max');
    } else {
      setModel('qwen3-vl-235b-a22b-instruct');
    }
    setGeneratedCode('');
    setFinalSize(null);
    setError(null);
  };

  const examplePrompts = [
    'Create a simple profile card with an avatar circle and user name',
    'Create a progress dashboard with 3 colored progress bars',
    'Create a weather card showing temperature and conditions',
    'Create a task list with checkboxes and task names',
  ];

  const currentModels = mode === 'text' ? TEXT_MODELS : VISION_MODELS;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      gap: 24,
      minHeight: 0,
      height: '100%',
      overflow: 'hidden'
    }}>
      <div style={{
        width: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: 0,
        maxHeight: '100%',
        overflow: 'auto',
        padding: '12px 12px 12px 4px'
      }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#1a1a1c',
          borderRadius: 12,
          border: '1px solid #2a2a2c'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>
              Dynamic Generator
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#999', lineHeight: 1.5 }}>
            Generate React components from text or images
          </p>
        </div>

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
            padding: 16,
            border: '1px solid #2a2a2c'
          }}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the component you want to create..."
              style={{
                width: '100%',
                minHeight: 140,
                padding: 14,
                backgroundColor: '#2a2a2c',
                color: '#fff',
                border: '1px solid #3a3a3c',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.5
              }}
            />
          </div>
        ) : (
          <div style={{
            backgroundColor: '#1a1a1c',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #2a2a2c'
          }}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              UI Image
            </label>
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? '#007AFF' : '#3a3a3c'}`,
                borderRadius: 10,
                padding: imagePreview ? 16 : 40,
                textAlign: 'center',
                backgroundColor: isDragActive ? 'rgba(0, 122, 255, 0.05)' : '#2a2a2c',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <input {...getInputProps()} />
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 220,
                      borderRadius: 8,
                      marginBottom: 12
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
                    }}>Cmd+V</kbd> to replace
                  </div>
                </div>
              ) : (
                <div style={{ color: '#999' }}>
                  <div style={{ marginBottom: 16 }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
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
                    }}>Cmd+V</kbd>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          backgroundColor: '#1a1a1c',
          borderRadius: 10,
          padding: 16,
          border: '1px solid #2a2a2c'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Width
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Math.max(100, parseInt(e.target.value) || 100))}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2a2a2c',
                color: '#fff',
                border: '1px solid #3a3a3c',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                fontWeight: 500
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Height
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Math.max(100, parseInt(e.target.value) || 100))}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2a2a2c',
                color: '#fff',
                border: '1px solid #3a3a3c',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                fontWeight: 500
              }}
            />
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1c',
          borderRadius: 10,
          padding: 16,
          border: '1px solid #2a2a2c'
        }}>
          <label style={{ display: 'block', marginBottom: 10, fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#2a2a2c',
              color: '#fff',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {currentModels.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)}
          style={{
            padding: '14px 24px',
            background: loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image)
              ? '#444'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image) ? 'not-allowed' : 'pointer',
            opacity: loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !image) ? 0.5 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid #ffffff40',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
              Generating...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate Component
            </>
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

        {mode === 'text' && !generatedCode && !loading && (
          <div style={{
            marginTop: 'auto',
            paddingTop: 20,
            borderTop: '1px solid #2a2a2c'
          }}>
            <div style={{
              fontSize: 12,
              color: '#999',
              marginBottom: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Quick Examples
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#1a1a1c',
                    color: '#d1d1d6',
                    border: '1px solid #2a2a2c',
                    borderRadius: 8,
                    fontSize: 13,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    lineHeight: 1.5
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2c';
                    e.currentTarget.style.borderColor = '#007AFF';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1c';
                    e.currentTarget.style.borderColor = '#2a2a2c';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: 0,
        padding: '12px 4px 12px 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 4
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>
            Live Preview
          </h3>
          {finalSize && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#1a1a1c',
              borderRadius: 8,
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
        </div>

        <div style={{
          flex: generatedCode ? 0.6 : 1,
          backgroundColor: '#0d0d0d',
          padding: 32,
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 0,
          boxSizing: 'border-box',
          border: '1px solid #2a2a2c',
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
                  color: 'rgba(255, 165, 0, 0.6)',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              >
                SUGGESTED: {width}×{height}px
              </div>
              <div
                style={{
                  border: '2px solid rgba(52, 199, 89, 0.5)',
                  display: 'inline-block',
                  position: 'relative',
                  borderRadius: 8,
                  overflow: 'hidden'
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

        {generatedCode && (
          <div style={{
            flex: 0.4,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            backgroundColor: '#1a1a1c',
            borderRadius: 12,
            border: '1px solid #2a2a2c',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #2a2a2c',
              backgroundColor: '#151516'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#999' }}>Generated Code</span>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  padding: '6px 12px',
                  backgroundColor: copied ? 'rgba(52, 199, 89, 0.15)' : '#2a2a2c',
                  color: copied ? '#34c759' : '#aaa',
                  border: `1px solid ${copied ? 'rgba(52, 199, 89, 0.3)' : '#3a3a3c'}`,
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div style={{
              flex: 1,
              overflow: 'auto',
              fontSize: 12
            }}>
              <SyntaxHighlighter
                language="javascript"
                style={atomOneDark}
                customStyle={{
                  margin: 0,
                  padding: 16,
                  backgroundColor: 'transparent',
                  height: '100%'
                }}
                showLineNumbers={true}
              >
                {generatedCode}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
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
