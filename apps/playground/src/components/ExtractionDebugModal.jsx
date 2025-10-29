import React from 'react';
import DSLEditor from './core/DSLEditor.jsx';
import { Icon } from '@widget-factory/primitives';

function DetectionPreview({ title, boxes, baseImageUrl, processedSize, color }) {
  if (!processedSize || !processedSize.width || !processedSize.height) {
    return (
      <div style={{ color: '#8e8e93', fontSize: 12, padding: 16 }}>
        No image size info
      </div>
    );
  }

  const containerWidth = 100;
  const containerHeight = (containerWidth * processedSize.height) / processedSize.width;

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: `${containerHeight}%` }}>
      {baseImageUrl && (
        <img
          src={baseImageUrl}
          alt="Preview"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.6
          }}
        />
      )}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        viewBox={`0 0 ${processedSize.width} ${processedSize.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {boxes.map((box, idx) => {
          const [x1, y1, x2, y2] = box.bbox;
          return (
            <rect
              key={idx}
              x={x1}
              y={y1}
              width={x2 - x1}
              height={y2 - y1}
              stroke={color}
              strokeWidth="2"
              fill="none"
            />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute',
        top: 4,
        right: 4,
        background: 'rgba(0,0,0,0.8)',
        color: '#f5f5f7',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 11
      }}>
        {boxes.length} boxes
      </div>
    </div>
  );
}

function RetrievalRow({ item, baseImageUrl, processedSize, mode }) {
  const bbox = item?.bbox || [];
  if (bbox.length !== 4) return null;

  const candidates = mode === 'fused'
    ? (item?.topCandidates || [])
    : (item?.imageOnlyTop10 || []);

  return (
    <div style={{
      background: '#1a1a1c',
      border: '1px solid #2a2a2c',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: '0 0 120px' }}>
          <div style={{ fontSize: 11, color: '#8e8e93', marginBottom: 4 }}>
            bbox: [{bbox.map(v => Math.round(v)).join(', ')}]
          </div>
          <DetectionPreview
            boxes={[{ bbox }]}
            baseImageUrl={baseImageUrl}
            processedSize={processedSize}
            color="#0A84FF"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 8 }}>
            Top {candidates.length} candidates ({mode}):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {candidates.slice(0, 10).map((c, i) => {
              const name = c?.name || '';
              const score = mode === 'fused' ? c?.score_final : c?.score_img;
              return (
                <div key={i} style={{
                  background: '#0d0d0d',
                  border: '1px solid #2a2a2c',
                  borderRadius: 6,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Icon name={name} size={24} />
                  <div style={{ fontSize: 10, color: '#f5f5f7', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2 }}>
                    {name}
                  </div>
                  {score !== undefined && (
                    <div style={{ fontSize: 9, color: '#8e8e93' }}>
                      {score.toFixed(3)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExtractionDebugModal({ isOpen, onClose, data, baseImageUrl }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = React.useState('icon'); // 'icon' | 'graph' | 'prompt'
  const [retrievalMode, setRetrievalMode] = React.useState('fused');
  const [selectedPromptStage, setSelectedPromptStage] = React.useState('final');

  // Icon data
  const iconDebug = data?.iconDebugInfo || {};
  const groundingBoxes = (iconDebug?.grounding?.pixel || []).filter(
    d => String(d?.label || '').toLowerCase() === 'icon' && Array.isArray(d?.bbox) && d.bbox.length === 4
  );
  const postProcessedBoxes = (iconDebug?.grounding?.postProcessed || []).filter(
    d => String(d?.label || '').toLowerCase() === 'icon' && Array.isArray(d?.bbox) && d.bbox.length === 4
  );
  const candidates = iconDebug?.retrieval?.candidates || [];
  const perIcon = iconDebug?.retrieval?.perIcon || [];
  const processedSize = iconDebug?.detection?.imageSize || null;

  // Graph data
  const graphDebug = data?.graphDebugInfo || {};
  const chartCounts = graphDebug?.detection?.chartCounts || {};
  const graphSpecs = graphDebug?.specs || [];
  const graphInjectionText = graphDebug?.promptInjection?.injectedText || '';

  // Prompt data
  const promptDebug = data?.promptDebugInfo || {};
  const stage1_base = promptDebug?.stage1_base || '';
  const stage2_withGraphs = promptDebug?.stage2_withGraphs || '';
  const stage3_withIcons = promptDebug?.stage3_withIcons || '';
  const stage4_final = promptDebug?.stage4_final || '';
  const graphInjection = promptDebug?.injections?.graph || '';
  const iconInjection = promptDebug?.injections?.icon || '';
  const componentsInjection = promptDebug?.injections?.components || '';

  const promptStages = [
    { id: 'base', label: 'Stage 1: Base', value: stage1_base },
    { id: 'graphs', label: 'Stage 2: + Graphs', value: stage2_withGraphs },
    { id: 'icons', label: 'Stage 3: + Icons', value: stage3_withIcons },
    { id: 'final', label: 'Stage 4: + Components (Final)', value: stage4_final },
    { id: 'graph-inject', label: 'Graph Injection Only', value: graphInjection },
    { id: 'icon-inject', label: 'Icon Injection Only', value: iconInjection },
    { id: 'components-inject', label: 'Components List Only', value: componentsInjection },
  ];

  const currentPrompt = promptStages.find(s => s.id === selectedPromptStage) || promptStages[3];

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
          maxWidth: 1600,
          height: '88vh',
          padding: 20,
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: 20, fontWeight: 700 }}>Extraction Debug</h2>
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, borderBottom: '1px solid #3a3a3c', paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab('icon')}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === 'icon' ? '#0A84FF' : 'transparent',
              color: '#f5f5f7',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Icon Extraction
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === 'graph' ? '#0A84FF' : 'transparent',
              color: '#f5f5f7',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Graph Extraction
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === 'prompt' ? '#0A84FF' : 'transparent',
              color: '#f5f5f7',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Prompt Stages
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {activeTab === 'icon' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 12, height: '100%', minHeight: 0 }}>
              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A84FF' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Grounding</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16 }}>
                  <DetectionPreview boxes={groundingBoxes} baseImageUrl={baseImageUrl} processedSize={processedSize} color="#0A84FF" />
                </div>
              </div>

              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Post-processed</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16 }}>
                  <DetectionPreview boxes={postProcessedBoxes} baseImageUrl={baseImageUrl} processedSize={processedSize} color="#34C759" />
                </div>
              </div>

              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A84FF' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Retrieval</div>
                  </div>
                  <select
                    value={retrievalMode}
                    onChange={(e) => setRetrievalMode(e.target.value)}
                    style={{
                      background: '#1a1a1c',
                      color: '#f5f5f7',
                      border: '1px solid #3a3a3c',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 12
                    }}
                  >
                    <option value="fused">Fused (image+text)</option>
                    <option value="image">Image only</option>
                  </select>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16 }}>
                  {perIcon.length > 0 ? (
                    perIcon.map((item, i) => (
                      <RetrievalRow key={i} item={item} baseImageUrl={baseImageUrl} processedSize={processedSize} mode={retrievalMode} />
                    ))
                  ) : (
                    <div style={{ color: '#8e8e93', fontSize: 12 }}>No retrieval data</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr', gap: 12, height: '100%', minHeight: 0 }}>
              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9500' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Detected Charts</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16 }}>
                  {Object.keys(chartCounts).length === 0 ? (
                    <div style={{ color: '#8e8e93', fontSize: 12 }}>No charts detected</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Object.entries(chartCounts).map(([type, count]) => (
                        <div key={type} style={{ background: '#1a1a1c', border: '1px solid #2a2a2c', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7', marginBottom: 4 }}>{type}</div>
                          <div style={{ fontSize: 12, color: '#8e8e93' }}>Count: {count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5E5CE6' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Graph Injection</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#f5f5f7', whiteSpace: 'pre-wrap' }}>
                  {graphInjectionText || 'No graph injection'}
                </div>
              </div>

              <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30D158' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Graph DSL ({graphSpecs.length})</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#f5f5f7', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(graphSpecs, null, 2)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF375F' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>Prompt Stages</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {promptStages.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedPromptStage(stage.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      background: selectedPromptStage === stage.id ? '#0A84FF' : '#2c2c2e',
                      color: '#f5f5f7',
                      border: selectedPromptStage === stage.id ? '1px solid #0A84FF' : '1px solid #3a3a3c',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #3a3a3c', borderRadius: 10, background: '#0d0d0d', padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#f5f5f7', whiteSpace: 'pre-wrap' }}>
                {currentPrompt.value || 'No content'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
