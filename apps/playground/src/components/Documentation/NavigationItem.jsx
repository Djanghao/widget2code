import React from 'react';

export default function NavigationItem({
  id,
  label,
  active,
  onClick,
  isMainSection = false
}) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        width: '100%',
        padding: isMainSection ? '8px 16px' : '6px 16px',
        textAlign: 'left',
        border: 'none',
        backgroundColor: active ? '#3a3a3a' : 'transparent',
        color: isMainSection ? '#fff' : (active ? '#fff' : '#b3b3b3'),
        fontSize: 15,
        fontWeight: isMainSection ? 600 : 400,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        borderRadius: 6,
        marginTop: isMainSection ? 16 : 0
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#2a2a2a';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {label}
    </button>
  );
}
