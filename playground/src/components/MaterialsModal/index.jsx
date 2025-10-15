import React, { useState } from 'react';
import ComponentsTab from './ComponentsTab.jsx';
import IconsTab from './IconsTab.jsx';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      backgroundColor: 'transparent',
      color: active ? '#f5f5f7' : '#8e8e93',
      border: 'none',
      borderBottom: active ? '2px solid #007AFF' : '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
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

export default function MaterialsModal({ isOpen, onClose }) {
  const [modalTab, setModalTab] = useState('components');
  const [iconColor, setIconColor] = useState('rgba(255, 255, 255, 0.85)');
  const [iconLibrary, setIconLibrary] = useState('sf');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1c1c1e',
          borderRadius: 16,
          padding: 32,
          maxWidth: '1200px',
          width: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #3a3a3c'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#f5f5f7' }}>
              Materials
            </h2>
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              <TabButton active={modalTab === 'components'} onClick={() => setModalTab('components')}>
                Components
              </TabButton>
              <TabButton active={modalTab === 'icons'} onClick={() => setModalTab('icons')}>
                Icons
              </TabButton>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              color: '#f5f5f7',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {modalTab === 'components' && <ComponentsTab />}
          {modalTab === 'icons' && (
            <IconsTab
              iconColor={iconColor}
              setIconColor={setIconColor}
              iconLibrary={iconLibrary}
              setIconLibrary={setIconLibrary}
            />
          )}
        </div>
      </div>
    </div>
  );
}
