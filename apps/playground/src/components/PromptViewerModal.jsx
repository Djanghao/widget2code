import React from 'react';
import DSLEditor from './core/DSLEditor.jsx';

export default function PromptViewerModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const [selectedStage, setSelectedStage] = React.useState('final');

  const stage1_base = data?.promptDebugInfo?.stage1_base || '';
  const stage2_withGraphs = data?.promptDebugInfo?.stage2_withGraphs || '';
  const stage3_final = data?.promptDebugInfo?.stage3_final || '';
  const graphInjection = data?.promptDebugInfo?.injections?.graph || '';
  const iconInjection = data?.promptDebugInfo?.injections?.icon || '';

  const stages = [
    { id: 'base', label: 'Stage 1: Base Prompt', value: stage1_base },
    { id: 'graphs', label: 'Stage 2: + Graph Specs', value: stage2_withGraphs },
    { id: 'final', label: 'Stage 3: + Icon Specs (Final)', value: stage3_final },
    { id: 'graph-only', label: 'Graph Injection Only', value: graphInjection },
    { id: 'icon-only', label: 'Icon Injection Only', value: iconInjection },
  ];

  const currentStage = stages.find(s => s.id === selectedStage) || stages[2];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1c1c1e',
          border: '1px solid #3a3a3c',
          borderRadius: 16,
          width: '92vw',
          maxWidth: 1600,
          maxHeight: '88vh',
          padding: 20,
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: 20, fontWeight: 700 }}>Prompt Stages Viewer</h2>
          <button
            onClick={onClose}
            style={{
              background: '#2c2c2e',
              border: '1px solid #3a3a3c',
              color: '#f5f5f7',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Stage selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {stages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                background: selectedStage === stage.id ? '#0A84FF' : '#2c2c2e',
                color: '#f5f5f7',
                border: selectedStage === stage.id ? '1px solid #0A84FF' : '1px solid #3a3a3c',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {stage.label}
            </button>
          ))}
        </div>

        {/* Prompt content */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          border: '1px solid #3a3a3c',
          borderRadius: 10,
          background: '#0d0d0d'
        }}>
          <DSLEditor
            value={currentStage.value || 'No content'}
            readOnly={true}
            language="markdown"
          />
        </div>

        {/* Stats */}
        <div style={{
          marginTop: 12,
          padding: 12,
          background: '#2c2c2e',
          borderRadius: 8,
          display: 'flex',
          gap: 24,
          fontSize: 12,
          color: '#8e8e93'
        }}>
          <div>
            <span style={{ fontWeight: 600 }}>Current Stage:</span>{' '}
            <span style={{ color: '#f5f5f7' }}>{currentStage.label}</span>
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Length:</span>{' '}
            <span style={{ color: '#f5f5f7' }}>{currentStage.value.length.toLocaleString()} chars</span>
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Lines:</span>{' '}
            <span style={{ color: '#f5f5f7' }}>{currentStage.value.split('\n').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
