import React from 'react';
import { Download, RefreshCw } from 'lucide-react';

export default function DownloadButton({ onClick, isDisabled }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: isDisabled ? '#3a3a3c' : '#2c2c2e',
        color: isDisabled ? '#8e8e93' : '#f5f5f7',
        border: '1px solid #3a3a3c',
        borderRadius: 6,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.backgroundColor = '#3a3a3c';
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.backgroundColor = '#2c2c2e';
      }}
      title={isDisabled ? 'Widget is rendering...' : 'Download widget as PNG'}
    >
      {isDisabled ? (
        <RefreshCw
          size={18}
          style={{
            animation: 'spin 0.9s linear infinite'
          }}
        />
      ) : (
        <Download size={18} />
      )}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
}
