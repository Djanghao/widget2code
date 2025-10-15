import React, { useState, useEffect, useRef } from 'react';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import TreeView from './TreeView.jsx';
import SpecEditor from './components/core/SpecEditor.jsx';
import CodeViewer from './components/core/CodeViewer.jsx';
import PreviewPanel from './components/core/PreviewPanel.jsx';
import SystemPromptEditor from './components/core/SystemPromptEditor.jsx';
import SectionHeader from './components/core/SectionHeader.jsx';
import { useAutoResize } from './hooks/useAutoResize';
import sfOnlyPrompt from '../api/prompt2spec-sf-only.md?raw';
import lucideOnlyPrompt from '../api/prompt2spec-lucide-only.md?raw';
import bothIconsPrompt from '../api/prompt2spec-both.md?raw';

function Prompt2Spec() {
  const [promptType, setPromptType] = useState('both');
  const [systemPrompt, setSystemPrompt] = useState(bothIconsPrompt);
  const [defaultPrompt, setDefaultPrompt] = useState(bothIconsPrompt);
  const [model, setModel] = useState('qwen3-vl-plus');
  const [userPrompt, setUserPrompt] = useState('');
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
    const map = { sf: sfOnlyPrompt, lucide: lucideOnlyPrompt, both: bothIconsPrompt };
    const p = map[promptType];
    setSystemPrompt(p);
    setDefaultPrompt(p);
  }, [promptType]);

  const { ratioInput, setRatioInput, autoSizing, handleAutoResizeByRatio } = useAutoResize(widgetFrameRef, async (updatedSpec) => {
    setPreviewSpec(updatedSpec);
    const jsx = compileWidgetSpecToJSX(updatedSpec);
    await fetch('/__write_widget_preview', { method: 'POST', body: jsx, headers: { 'Content-Type': 'text/plain' } });
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('system_prompt', systemPrompt);
      formData.append('user_prompt', userPrompt);
      if (model) formData.append('model', model);
      const response = await fetch('/api/generate-widget-text', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to generate');
      setPreviewSpec(data.widgetSpec);
      setTreeRoot(data.widgetSpec?.widget || null);
      try {
        const jsx = compileWidgetSpecToJSX(data.widgetSpec);
        setGeneratedCode(jsx);
        await fetch('/__write_widget_preview', { method: 'POST', body: jsx, headers: { 'Content-Type': 'text/plain' } });
        const r = data.widgetSpec?.widget?.aspectRatio;
        const hasWH =
          data.widgetSpec?.widget?.width !== undefined &&
          data.widgetSpec?.widget?.height !== undefined;
        if (enableAutoResize && !hasWH && typeof r === 'number' && isFinite(r) && r > 0) {
          await handleAutoResizeByRatio(data.widgetSpec, r);
        }
      } catch (e) {
        setGeneratedCode(`// Compilation Error: ${e.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!treeContainerRef.current) return;
      if (!treeContainerRef.current.contains(e.target)) setSelectedPath(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const previewWidth = previewSpec?.widget?.width;
  const previewHeight = previewSpec?.widget?.height;
  const previewAspectRatio = previewSpec?.widget?.aspectRatio;

  useEffect(() => {
    if (!enableAutoResize) return;
    const w = previewSpec?.widget;
    if (!w) return;
    const hasWH = previewWidth !== undefined && previewHeight !== undefined;
    const r = previewAspectRatio;
    if (!hasWH && typeof r === 'number' && isFinite(r) && r > 0) {
      handleAutoResizeByRatio(previewSpec, r);
    }
  }, [enableAutoResize, previewWidth, previewHeight, previewAspectRatio]);

  const textModelOptions = [
    { value: 'qwen3-max-preview', label: 'Qwen3 Max Preview' },
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-flash', label: 'Qwen Flash' },
    { value: 'qwen3-coder-plus', label: 'Qwen3 Coder Plus' },
    { value: 'qwen3-coder-flash', label: 'Qwen3 Coder Flash' },
    { value: 'qwen-vl-plus', label: 'Qwen VL Plus' },
    { value: 'qwen-vl-max', label: 'Qwen VL Max' },
    { value: 'qwen3-vl-plus', label: 'Qwen3 VL Plus' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 12, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <SystemPromptEditor
          value={systemPrompt}
          onChange={setSystemPrompt}
          promptType={promptType}
          setPromptType={setPromptType}
          model={model}
          setModel={setModel}
          onReset={() => setSystemPrompt(defaultPrompt)}
          modelOptions={textModelOptions}
          dotColor="#34C759"
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <SectionHeader title="User Prompt" dotColor="#34C759" />
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} spellCheck={false} placeholder="Describe the widget to generate" style={{ width: '100%', height: '100%', padding: 12, fontSize: 12, fontFamily: 'Monaco, Consolas, monospace', backgroundColor: '#0d0d0d', color: '#f5f5f7', border: '1px solid #3a3a3c', borderRadius: 10, resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !userPrompt.trim()}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: (isGenerating || !userPrompt.trim()) ? '#3a3a3c' : '#007AFF',
                color: '#f5f5f7',
                border: 'none',
                borderRadius: 10,
                cursor: (isGenerating || !userPrompt.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (!isGenerating && userPrompt.trim()) e.currentTarget.style.backgroundColor = '#0051D5';
              }}
              onMouseLeave={(e) => {
                if (!isGenerating && userPrompt.trim()) e.currentTarget.style.backgroundColor = '#007AFF';
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
          </div>
          {error && (
            <div style={{ backgroundColor: '#3a0a0a', border: '1px solid #6e1a1a', borderRadius: 10, padding: 12, color: '#ff6b6b', fontSize: 12, marginTop: 8 }}>{error}</div>
          )}
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

export default Prompt2Spec;
