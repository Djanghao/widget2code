import React, { Suspense } from 'react';
import { PreviewErrorBoundary } from './PreviewErrorBoundary.jsx';

const LazyWidget = React.lazy(() => import('./generated/Widget.jsx'));

export default function WidgetFrame({ resetKey }) {
  return (
    <PreviewErrorBoundary
      resetKey={resetKey}
      fallback={(error) => (
        <div style={{
          display: 'inline-flex',
          maxWidth: 640,
          alignItems: 'center',
          justifyContent: 'flex-start',
          color: '#ff6b6b',
          backgroundColor: '#3a0a0a',
          border: '1px solid #6e1a1a',
          borderRadius: 10,
          padding: 12,
          boxSizing: 'border-box'
        }}>
          <div style={{ fontWeight: 700, marginRight: 8 }}>Preview Error:</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(error?.message || error)}</div>
        </div>
      )}
    >
      <Suspense
        fallback={(
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#8e8e93' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" role="img" aria-label="loading">
              <circle cx="12" cy="12" r="10" stroke="#8e8e93" strokeWidth="3" fill="none" opacity="0.25" />
              <path d="M12 2 a10 10 0 0 1 0 20" stroke="#f5f5f7" strokeWidth="3" strokeLinecap="round" fill="none">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
              </path>
            </svg>
            Loading preview...
          </div>
        )}
      >
        <LazyWidget />
      </Suspense>
    </PreviewErrorBoundary>
  );
}

