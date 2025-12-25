import React, { useMemo } from 'react';
import DSLEditor from './core/DSLEditor.jsx';
import PromptViewerModal from './PromptViewerModal.jsx';

export default function GraphExtractionModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const chartCounts = data?.graphDebugInfo?.detection?.chartCounts || {};
  const graphSpecs = Array.isArray(data?.graphDebugInfo?.specs) ? data.graphDebugInfo.specs : [];
  const hasGraphs = data?.graphDebugInfo?.detection?.hasGraphs || false;
  const graphCount = data?.graphDebugInfo?.detection?.graphCount || 0;

  // Get prompt information
  const graphInjectionText = data?.graphDebugInfo?.promptInjection?.injectedText || '';
  const iconInjectionText = data?.iconDebugInfo?.promptInjection?.injectedText || '';

  const [promptViewerOpen, setPromptViewerOpen] = React.useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1c1c1e',
          border: '1px solid #3a3a3c',
          borderRadius: 16,
          width: '92vw',
          maxWidth: 1400,
          maxHeight: '88vh',
          padding: 20,
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: 20, fontWeight: 700 }}>Graph Extraction</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPromptViewerOpen(true)}
              style={{
                background: '#2c2c2e',
                border: '1px solid #3a3a3c',
                color: '#f5f5f7',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500
              }}
            >
              View Full Prompts
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#2c2c2e',
                border: '1px solid #3a3a3c',
                color: '#f5f5f7',
                width: 32,
                height: 32,
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {!hasGraphs ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: '#8e8e93',
            fontSize: 14
          }}>
            No graphs detected in this image.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr 1fr', gap: 12, minHeight: 0, flex: 1 }}>
            {/* Chart Types Detected */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9500' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Detected Charts</div>
              </div>
              <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                border: '1px solid #3a3a3c',
                borderRadius: 10,
                background: '#0d0d0d',
                padding: 16
              }}>
                {Object.keys(chartCounts).length === 0 ? (
                  <div style={{ color: '#8e8e93', fontSize: 12 }}>No chart type information</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(chartCounts).map(([type, count]) => (
                      <div
                        key={type}
                        style={{
                          background: '#1a1a1c',
                          border: '1px solid #2a2a2c',
                          borderRadius: 8,
                          padding: 12
                        }}
                      >
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#f5f5f7',
                          marginBottom: 4
                        }}>
                          {type}
                        </div>
                        <div style={{ fontSize: 12, color: '#8e8e93' }}>
                          Count: {count}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Graph Injection Text */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5E5CE6' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Graph Injection</div>
              </div>
              <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                border: '1px solid #3a3a3c',
                borderRadius: 10,
                background: '#0d0d0d'
              }}>
                <DSLEditor
                  value={graphInjectionText || 'No graph injection text'}
                  readOnly={true}
                  language="markdown"
                />
              </div>
            </div>

            {/* Icon Injection Text */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A84FF' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Icon Injection</div>
              </div>
              <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                border: '1px solid #3a3a3c',
                borderRadius: 10,
                background: '#0d0d0d'
              }}>
                <DSLEditor
                  value={iconInjectionText || 'No icon injection text'}
                  readOnly={true}
                  language="markdown"
                />
              </div>
            </div>

            {/* Graph DSL Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30D158' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>
                  Graph DSL ({graphSpecs.length} specs)
                </div>
              </div>
              <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                border: '1px solid #3a3a3c',
                borderRadius: 10,
                background: '#0d0d0d'
              }}>
                <DSLEditor
                  value={JSON.stringify(graphSpecs, null, 2)}
                  readOnly={true}
                  language="json"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <PromptViewerModal
        isOpen={promptViewerOpen}
        onClose={() => setPromptViewerOpen(false)}
        data={data}
      />
    </div>
  );
}
