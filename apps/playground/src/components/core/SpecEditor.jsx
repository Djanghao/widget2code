import React from 'react';

export default function SpecEditor({ value, onChange, readOnly = false, title = 'WidgetSpec' }) {
  return (
    <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        {title}
      </h2>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <textarea
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
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
          onFocus={(e) => !readOnly && (e.target.style.borderColor = '#007AFF')}
          onBlur={(e) => !readOnly && (e.target.style.borderColor = '#3a3a3c')}
        />
      </div>
    </div>
  );
}
