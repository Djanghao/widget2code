/**
 * @file ApiKeyManager.jsx
 * @description API key management component with security warnings
 * @author Houston Zhang
 * @date 2025-10-20
 */

import React, { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'dashscope_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  });

  const setApiKey = (key) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    setApiKeyState(trimmedKey);
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKeyState('');
  };

  return { apiKey, setApiKey, clearApiKey, hasApiKey: !!apiKey };
}

export default function ApiKeyManager({ apiKey, onSave, onClose }) {
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [showWarning, setShowWarning] = useState(!apiKey);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#1a1a1c',
        borderRadius: 16,
        padding: 32,
        maxWidth: 560,
        width: '90%',
        border: '1px solid #2a2a2c',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: '#f5f5f7',
            marginBottom: 8
          }}>
            Configure API Key
          </h2>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: '#999',
            lineHeight: 1.6
          }}>
            Enter your DashScope API key to use the widget generation features.
          </p>
        </div>

        {showWarning && (
          <div style={{
            backgroundColor: 'rgba(255, 149, 0, 0.1)',
            border: '1px solid rgba(255, 149, 0, 0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FF9500', marginBottom: 6 }}>
                  Security Notice
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#CC7A00', lineHeight: 1.6 }}>
                  <li>Your API key is stored in browser localStorage</li>
                  <li>It's sent to the backend for each request (not stored on server)</li>
                  <li>Never share your API key with others</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 13,
            color: '#999',
            fontWeight: 600
          }}>
            DashScope API Key
          </label>
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#2a2a2c',
              color: '#f5f5f7',
              border: '1px solid #3a3a3c',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007AFF'}
            onBlur={(e) => e.target.style.borderColor = '#3a3a3c'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            Get your API key from{' '}
            <a
              href="https://dashscope.console.aliyun.com/apiKey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007AFF', textDecoration: 'none' }}
            >
              DashScope Console
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2c';
              e.currentTarget.style.color = '#f5f5f7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#999';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!inputValue.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: inputValue.trim() ? '#007AFF' : '#3a3a3c',
              color: '#f5f5f7',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.backgroundColor = '#0051D5';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.backgroundColor = '#007AFF';
              }
            }}
          >
            Save API Key
          </button>
        </div>
      </div>
    </div>
  );
}
