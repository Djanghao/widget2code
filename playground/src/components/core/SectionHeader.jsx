import React from 'react';

export default function SectionHeader({ title, dotColor = '#34C759', children }) {
  return (
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
        backgroundColor: dotColor
      }} />
      {title}
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {children}
        </div>
      )}
    </h2>
  );
}
