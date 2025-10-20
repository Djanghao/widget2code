import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeViewer({ code, language = 'jsx', title = 'Generated Code', placeholder = '// Generate a widget to see code' }) {
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
          backgroundColor: '#FF9500'
        }} />
        {title}
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
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', minWidth: 0 }}>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            wrapLongLines={false}
            customStyle={{
              margin: 0,
              fontSize: 13,
              borderRadius: 10,
              whiteSpace: 'pre',
              minHeight: '100%',
              width: 'max-content',
              minWidth: '100%'
            }}
          >
            {code || placeholder}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
