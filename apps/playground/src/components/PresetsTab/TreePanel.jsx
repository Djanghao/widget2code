import React from 'react';
import TreeView from '../../TreeView.jsx';

export default function TreePanel({ treeRoot, selectedPath, onSelect, treeContainerRef }) {
  return (
    <div ref={treeContainerRef} style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gridArea: 'tree' }}>
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
          backgroundColor: '#BF5AF2'
        }} />
        Tree
      </h2>
      <TreeView
        root={treeRoot}
        style={{ flex: 1, minHeight: 0 }}
        selectedPath={selectedPath}
        onSelect={onSelect}
      />
    </div>
  );
}
