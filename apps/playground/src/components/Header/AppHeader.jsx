import React from 'react';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      fontSize: 15,
      fontWeight: 500,
      backgroundColor: 'transparent',
      color: active ? '#f5f5f7' : '#8e8e93',
      border: 'none',
      borderBottom: active ? '2px solid #007AFF' : '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      if (!active) e.target.style.color = '#f5f5f7';
    }}
    onMouseLeave={(e) => {
      if (!active) e.target.style.color = '#8e8e93';
    }}
  >
    {children}
  </button>
);

const ExternalLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      padding: '8px 16px',
      fontSize: 15,
      fontWeight: 500,
      backgroundColor: 'transparent',
      color: '#8e8e93',
      border: 'none',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.target.style.color = '#f5f5f7';
    }}
    onMouseLeave={(e) => {
      e.target.style.color = '#8e8e93';
    }}
  >
    {children}
  </a>
);

export default function AppHeader({ activeTab, onTabChange, onMaterialsClick }) {
  return (
    <header style={{ marginBottom: 12, flexShrink: 0, borderBottom: '1px solid #2c2c2e', paddingBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <h1
            onClick={() => onTabChange('presets')}
            style={{
              fontSize: 24,
              fontWeight: 600,
              margin: 0,
              color: '#f5f5f7',
              letterSpacing: '-0.3px',
              cursor: 'pointer'
            }}
          >
            Widget Factory
          </h1>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            <TabButton active={activeTab === 'presets'} onClick={() => onTabChange('presets')}>
              Presets
            </TabButton>
            <TabButton active={activeTab === 'widget2spec'} onClick={() => onTabChange('widget2spec')}>
              Widget2Spec
            </TabButton>
            <TabButton active={activeTab === 'prompt2spec'} onClick={() => onTabChange('prompt2spec')}>
              Prompt2Spec
            </TabButton>
            <TabButton active={activeTab === 'dynamic'} onClick={() => onTabChange('dynamic')}>
              Dynamic
            </TabButton>
            <TabButton active={activeTab === 'guides'} onClick={() => onTabChange('guides')}>
              Guides
            </TabButton>
            <ExternalLink href="http://202.78.161.188:8080/">
              FastCVAT
            </ExternalLink>
            <ExternalLink href="http://202.78.161.188:3000/">
              Qwen API OpenWebUI
            </ExternalLink>
            <ExternalLink href="http://202.78.161.188:3010/viewer/">
              W2C Viewer
            </ExternalLink>
            <ExternalLink href="http://202.78.161.188:3010/playground/">
              W2C Playground
            </ExternalLink>
          </div>
        </div>
        <button
          onClick={onMaterialsClick}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: '#2c2c2e',
            color: '#f5f5f7',
            border: '1px solid #3a3a3c',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#3a3a3c'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2c2c2e'}
        >
          Materials
        </button>
      </div>
    </header>
  );
}
