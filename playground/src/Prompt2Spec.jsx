import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import WidgetPreviewFrame from './WidgetPreviewFrame.jsx';
import TreeView from './TreeView.jsx';
import { useAutoResize } from './hooks/useAutoResize';
import sfOnlyPrompt from '../api/prompt2spec-sf-only.md?raw';
import lucideOnlyPrompt from '../api/prompt2spec-lucide-only.md?raw';
import bothIconsPrompt from '../api/prompt2spec-both.md?raw';

function Prompt2Spec() {
  const [promptType, setPromptType] = useState('both');
  const [systemPrompt, setSystemPrompt] = useState(bothIconsPrompt);
  const [defaultPrompt, setDefaultPrompt] = useState(bothIconsPrompt);
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [previewSpec, setPreviewSpec] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [treeRoot, setTreeRoot] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const widgetFrameRef = useRef(null);
  const treeContainerRef = useRef(null);

  useEffect(() => {
    const map = { sf: sfOnlyPrompt, lucide: lucideOnlyPrompt, both: bothIconsPrompt };
    const p = map[promptType];
    setSystemPrompt(p);
    setDefaultPrompt(p);
  }, [promptType]);

  const { autoSizing, handleAutoResizeByRatio } = useAutoResize(widgetFrameRef, async (updatedSpec) => {
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
        if (typeof r === 'number' && isFinite(r) && r > 0) {
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 12, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34C759' }} />
            System Prompt
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <select value={promptType} onChange={(e) => setPromptType(e.target.value)} style={{ padding: '6px 10px', fontSize: 12, fontWeight: 500, backgroundColor: '#2c2c2e', color: '#f5f5f7', border: '1px solid #3a3a3c', borderRadius: 6, cursor: 'pointer', outline: 'none' }}>
              <option value="sf">SF Symbols Only</option>
              <option value="lucide">Lucide Only</option>
              <option value="both">Both Icons</option>
            </select>
            <button onClick={() => setSystemPrompt(defaultPrompt)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, backgroundColor: '#2c2c2e', color: '#f5f5f7', border: '1px solid #3a3a3c', borderRadius: 6, cursor: 'pointer' }}>Reset</button>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} spellCheck={false} style={{ width: '100%', height: '100%', padding: 12, fontSize: 12, fontFamily: 'Monaco, Consolas, monospace', backgroundColor: '#0d0d0d', color: '#f5f5f7', border: '1px solid #3a3a3c', borderRadius: 10, resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34C759' }} />
            User Prompt
          </h2>
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
        <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'spec' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34C759' }} />
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
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#007AFF' }} />
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
                <WidgetPreviewFrame resetKey={previewSpec ? JSON.stringify(previewSpec) : ''} />
                {autoSizing && (
                  <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.12)', zIndex: 3, pointerEvents: 'none' }}>
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
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FF9500' }} />
            Generated WidgetPreview.jsx
          </h2>
          <div style={{ flex: 1, minHeight: 0, borderRadius: 10, border: '1px solid #3a3a3c', backgroundColor: '#1e1e1e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <SyntaxHighlighter language="jsx" style={vscDarkPlus} showLineNumbers wrapLongLines={false} customStyle={{ margin: 0, fontSize: 13, borderRadius: 10, whiteSpace: 'pre', minHeight: 0, overflow: 'visible' }}>
                {generatedCode || '// Generate a widget to see code'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        <div ref={treeContainerRef} style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'tree' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FF375F' }} />
            Tree View
          </h2>
          <div style={{ flex: 1, minHeight: 0, borderRadius: 10, border: '1px solid #3a3a3c', backgroundColor: '#0d0d0d', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TreeView root={treeRoot} style={{ flex: 1, minHeight: 0 }} selectedPath={selectedPath} onSelect={(p) => setSelectedPath((prev) => (prev === p ? null : p))} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prompt2Spec;
