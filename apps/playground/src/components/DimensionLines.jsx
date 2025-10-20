/**
 * @file DimensionLines.jsx
 * @description Dimension measurement lines component for widget preview
 * @author Houston Zhang
 * @date 2025-01-20
 */

import React from 'react';

export default function DimensionLines({ width, height }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 4
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -20,
          height: 0
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: -5, width: 1, height: 12, background: '#8e8e93' }} />
        <div style={{ position: 'absolute', right: 0, top: -5, width: 1, height: 12, background: '#8e8e93' }} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1,
            height: 1,
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(142,142,147,0.9) 0 6px, rgba(142,142,147,0) 6px 12px)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translate(-50%, -60%)',
            background: 'rgba(44,44,46,0.9)',
            color: '#d1d1d6',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9999,
            padding: '3px 10px',
            fontSize: 11,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            letterSpacing: 0.2,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {width}px
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 'calc(100% + 16px)',
          width: 0
        }}
      >
        <div style={{ position: 'absolute', left: -5, top: 0, width: 12, height: 1, background: '#8e8e93' }} />
        <div style={{ position: 'absolute', left: -5, bottom: 0, width: 12, height: 1, background: '#8e8e93' }} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 1,
            width: 1,
            backgroundImage: 'repeating-linear-gradient(180deg, rgba(142,142,147,0.9) 0 6px, rgba(142,142,147,0) 6px 12px)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(44,44,46,0.9)',
            color: '#d1d1d6',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9999,
            padding: '3px 10px',
            fontSize: 11,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            letterSpacing: 0.2,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {height}px
        </div>
      </div>
    </div>
  );
}
