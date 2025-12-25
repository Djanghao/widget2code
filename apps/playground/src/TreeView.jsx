import React, { useState, useMemo } from 'react';

function Dot({ color = '#8e8e93' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 8,
        flexShrink: 0
      }}
    />
  );
}

function Caret({ open, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      aria-label={open ? 'Collapse' : 'Expand'}
      style={{
        width: 20,
        height: 20,
        border: '1px solid #3a3a3c',
        borderRadius: 6,
        background: '#2c2c2e',
        color: '#f5f5f7',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        lineHeight: 1,
        marginRight: 8,
        padding: 0,
      }}
    >
      {open ? '▾' : '▸'}
    </button>
  );
}

function NodeBadge({ label, color }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 6px',
        borderRadius: 6,
        backgroundColor: '#3a3a3c',
        color,
        marginLeft: 8,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function summarizeProps(props) {
  const entries = Object.entries(props || {});
  if (!entries.length) return '';
  return entries
    .map(([k, v]) => `${k}:${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(', ');
}

function TreeNode({ node, depth = 0, path = '0', selectedPath, onSelect, isWidget = false }) {
  const isContainer = node?.type === 'container';
  const [open, setOpen] = useState(true);

  const label = isWidget
    ? 'Widget'
    : (isContainer ? 'container' : (node?.component || 'leaf'));

  const meta = isWidget
    ? Object.entries(node || {})
        .filter(([key]) => key !== 'root')
        .map(([k, v]) => `${k}:${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(', ')
    : (isContainer
      ? `${node?.direction || 'row'}${node?.children ? ` • ${node.children.length}` : ''}`
      : summarizeProps(node?.props));

  const color = isWidget ? '#BF5AF2' : (isContainer ? '#64D2FF' : '#FF9F0A');

  const isSelected = selectedPath === path;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 12 }}>
      <div
        onClick={() => onSelect && onSelect(path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          borderRadius: 8,
          transition: 'background 0.15s ease, box-shadow 0.15s ease',
          userSelect: 'none',
          position: 'relative',
          minWidth: 0,
          cursor: 'pointer',
          background: isSelected ? 'rgba(0,122,255,0.18)' : 'transparent',
          boxShadow: isSelected ? 'inset 0 0 0 1px rgba(0,122,255,0.6)' : 'none'
        }}
        data-tree-path={path}
      >
        {isWidget || isContainer ? (
          <Caret open={open} onClick={() => setOpen(v => !v)} />
        ) : (
          <div style={{ width: 20, marginRight: 8 }} />
        )}
        <Dot color={color} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f7' }}>{label}</div>
          {isContainer && !isWidget ? (
            <NodeBadge label={node?.direction === 'col' ? 'column' : 'row'} color="#64D2FF" />
          ) : null}
          {!isContainer && !isWidget && node?.flex !== undefined ? (
            <NodeBadge label={`flex:${node.flex}`} color="#FF9F0A" />
          ) : null}
        </div>
        {meta ? (
          <div style={{
            marginLeft: 8,
            color: '#98989d',
            fontSize: 12,
            flex: 1,
            minWidth: 0,
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}>
            {meta}
          </div>
        ) : null}
      </div>

      {(isWidget || isContainer) && open && (
        <div
          style={{
            marginLeft: 22,
            paddingLeft: 12,
            borderLeft: '1px dashed #3a3a3c',
          }}
        >
          {isWidget ? (
            node?.root ? <TreeNode node={node.root} depth={depth + 1} path={`${path}.root`} selectedPath={selectedPath} onSelect={onSelect} /> : null
          ) : (
            Array.isArray(node.children) && node.children.length > 0 ? (
              node.children.map((child, i) => (
                <TreeNode key={i} node={child} depth={depth + 1} path={`${path}.${i}`} selectedPath={selectedPath} onSelect={onSelect} />
              ))
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

export default function TreeView({ root, style, selectedPath, onSelect }) {

  if (!root) {
    return (
      <div style={{
        color: '#ff453a',
        fontSize: 13,
        padding: 12,
        border: '1px solid #3a3a3c',
        borderRadius: 10,
        background: '#0d0d0d'
      }}>
        Invalid or empty widget spec
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
      ...(style || {})
    }}>
      <div style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 10,
        border: '1px solid #3a3a3c',
        background: '#1e1e1e',
        overflow: 'auto',
        padding: 8
      }}>
        <TreeNode node={root} selectedPath={selectedPath} onSelect={onSelect} path={'0'} isWidget={true} />
      </div>
    </div>
  );
}
