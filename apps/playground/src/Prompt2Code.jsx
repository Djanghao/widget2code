import React, { useState, useEffect, useRef } from 'react';
import { compileWidgetDSLToJSX } from '@widget-factory/compiler';
import { exportWidget } from '@widget-factory/exporter';
import TreeView from './TreeView.jsx';
import DSLEditor from './components/core/DSLEditor.jsx';
import CodeViewer from './components/core/CodeViewer.jsx';
import PreviewPanel from './components/core/PreviewPanel.jsx';
import SystemPromptEditor from './components/core/SystemPromptEditor.jsx';
import SectionHeader from './components/core/SectionHeader.jsx';
import { useApiKey } from './components/ApiKeyManager.jsx';
import textPrompt from '../../../libs/generator/widgetdsl_generator/prompts/prompt2dsl/prompt2dsl-sf-lucide.md?raw';

const TEXT_MODELS = [
  { value: 'qwen3-coder-plus', label: 'qwen3-coder-plus' },
  { value: 'qwen3-coder-flash', label: 'qwen3-coder-flash' },
  { value: 'qwen3-max', label: 'qwen3-max' },
  { value: 'qwen3-235b-a22b-instruct-2507', label: 'qwen3-235b-a22b-instruct-2507' },
  { value: 'qwen3-235b-a22b-thinking-2507', label: 'qwen3-235b-a22b-thinking-2507' },
  { value: 'qwen3-coder-480b-a35b-instruct', label: 'qwen3-coder-480b-a35b-instruct' },
];

function Prompt2Code() {
  const { apiKey, hasApiKey } = useApiKey();
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(textPrompt);
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
    const onDocClick = (e) => {
      if (!treeContainerRef.current) return;
      if (!treeContainerRef.current.contains(e.target)) setSelectedPath(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setError('API key required');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a widget description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('system_prompt', systemPrompt);
      formData.append('user_prompt', prompt);
      if (model) formData.append('model', model);
      if (apiKey) formData.append('api_key', apiKey);

      const response = await fetch('/api/generate-widget-text', { method: 'POST', body: formData });
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

        <SystemPromptEditor
          value={systemPrompt}
          onChange={setSystemPrompt}
          model={model}
          setModel={setModel}
          onReset={() => setSystemPrompt(textPrompt)}
          modelOptions={TEXT_MODELS}
          dotColor="#34C759"
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: !prompt.trim() ? '#3a3a3c' : '#007AFF',
            color: '#f5f5f7',
            border: 'none',
            borderRadius: 10,
            cursor: (isGenerating || !prompt.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            if (!isGenerating && prompt.trim()) {
              e.currentTarget.style.backgroundColor = '#0051D5';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating && prompt.trim()) {
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

export default Prompt2Code;
