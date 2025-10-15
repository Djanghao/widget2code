import React from 'react';
import SectionHeader from './SectionHeader.jsx';

export default function SystemPromptEditor({
  value,
  onChange,
  promptType,
  setPromptType,
  model,
  setModel,
  onReset,
  modelOptions = [],
  promptTypeOptions = [
    { value: 'sf', label: 'SF Symbols Only' },
    { value: 'lucide', label: 'Lucide Only' },
    { value: 'both', label: 'Both Icons' }
  ],
  title = 'System Prompt',
  dotColor = '#FF9500'
}) {
  return (
    <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        flexWrap: 'wrap',
        rowGap: 8
      }}>
        <SectionHeader title={title} dotColor={dotColor} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {promptType !== undefined && setPromptType && (
            <select
              value={promptType}
              onChange={(e) => setPromptType(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#2c2c2e',
                color: '#f5f5f7',
                border: '1px solid #3a3a3c',
                borderRadius: 6,
                cursor: 'pointer',
                outline: 'none',
                whiteSpace: 'nowrap',
                maxWidth: 180
              }}
            >
              {promptTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {model !== undefined && setModel && modelOptions.length > 0 && (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              title="Model"
              style={{
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#2c2c2e',
                color: '#f5f5f7',
                border: '1px solid #3a3a3c',
                borderRadius: 6,
                cursor: 'pointer',
                outline: 'none',
                whiteSpace: 'nowrap',
                maxWidth: 200
              }}
            >
              {modelOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {onReset && (
            <button
              onClick={onReset}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#2c2c2e',
                color: '#f5f5f7',
                border: '1px solid #3a3a3c',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c2c2e'}
            >
              Reset to Default
            </button>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  );
}
