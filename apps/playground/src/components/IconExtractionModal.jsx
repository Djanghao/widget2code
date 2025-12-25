import React, { useMemo } from 'react';
import DSLEditor from './core/DSLEditor.jsx';
import { Icon } from '@widget-factory/primitives';

export default function IconExtractionModal({ isOpen, onClose, data, baseImageUrl }) {
  if (!isOpen) return null;

  const groundingBoxes = useMemo(() => {
    const arr = Array.isArray(data?.iconDebugInfo?.grounding?.pixel) ? data.iconDebugInfo.grounding.pixel : [];
    return arr.filter((d) => String(d?.label || '').toLowerCase() === 'icon' && Array.isArray(d?.bbox) && d.bbox.length === 4);
  }, [data]);

  const postProcessedBoxes = useMemo(() => {
    const arr = Array.isArray(data?.iconDebugInfo?.grounding?.postProcessed) ? data.iconDebugInfo.grounding.postProcessed : [];
    return arr.filter((d) => String(d?.label || '').toLowerCase() === 'icon' && Array.isArray(d?.bbox) && d.bbox.length === 4);
  }, [data]);

  const candidates = Array.isArray(data?.iconDebugInfo?.retrieval?.candidates) ? data.iconDebugInfo.retrieval.candidates : [];
  const processedSize = data?.iconDebugInfo?.detection?.imageSize || null;
  const perIcon = Array.isArray(data?.iconDebugInfo?.retrieval?.perIcon)
    ? data.iconDebugInfo.retrieval.perIcon
    : [];
  const [retrievalMode, setRetrievalMode] = React.useState('fused'); // 'fused' | 'image'

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={onClose}
    >
      <div
        style={{ background:'#1c1c1e', border:'1px solid #3a3a3c', borderRadius:16, width:'92vw', maxWidth:1400, maxHeight:'88vh', padding:20, display:'flex', flexDirection:'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <h2 style={{ margin:0, color:'#f5f5f7', fontSize:20, fontWeight:700 }}>Icon Extraction</h2>
          <button onClick={onClose} style={{ background:'#2c2c2e', border:'1px solid #3a3a3c', color:'#f5f5f7', width:32, height:32, borderRadius:8, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.4fr', gap:12, minHeight:0, flex:1 }}>
          <div style={{ minHeight:0, height:'100%', display:'flex', flexDirection:'column' }}>
            <DetectionPreview title="Grounding (icons)" boxes={groundingBoxes} baseImageUrl={baseImageUrl} processedSize={processedSize} color="#0A84FF" />
          </div>
          <div style={{ minHeight:0, height:'100%', display:'flex', flexDirection:'column' }}>
            <DetectionPreview title="Post-processed (icons)" boxes={postProcessedBoxes} baseImageUrl={baseImageUrl} processedSize={processedSize} color="#34C759" />
          </div>
          <div style={{ minHeight:0, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#0A84FF' }} />
                <div style={{ fontSize:15, fontWeight:600, color:'#f5f5f7' }}>Icon Retrieval</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <label style={{ fontSize:12, color:'#8e8e93' }}>View</label>
                <select
                  value={retrievalMode}
                  onChange={(e) => setRetrievalMode(e.target.value)}
                  style={{
                    background:'#1a1a1c', color:'#f5f5f7', border:'1px solid #3a3a3c',
                    borderRadius:6, padding:'4px 8px', fontSize:12
                  }}
                >
                  <option value="fused">Fused (image+text)</option>
                  <option value="image">Image only (Top10)</option>
                </select>
              </div>
            </div>
            <div style={{ flex:1, minHeight:0, overflow:'auto', border:'1px solid #3a3a3c', borderRadius:10, background:'#0d0d0d', padding:16 }}>
              {perIcon.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {perIcon.map((item, i) => (
                    <RetrievalRow key={i} item={item} baseImageUrl={baseImageUrl} processedSize={processedSize} mode={retrievalMode} />
                  ))}
                </div>
              ) : (
                <div>
                  {candidates.length === 0 && (
                    <div style={{ color:'#8e8e93', fontSize:12 }}>No icon candidates.</div>
                  )}
                  {candidates.length > 0 && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:12 }}>
                      {candidates.map((fullName, idx) => {
                        const size = 40;
                        const name = typeof fullName === 'string' ? fullName : (fullName?.name || '');
                        const display = name;
                        return (
                          <div key={idx} style={{ background:'#1a1a1c', border:'1px solid #2a2a2c', borderRadius:10, padding:12, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                            <div style={{ width:size+8, height:size+8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Icon name={name} size={size} />
                            </div>
                            <div style={{ fontSize:12, color:'#f5f5f7', textAlign:'center', wordBreak:'break-word' }}>{display || '—'}</div>
                            <div style={{ fontSize:11, color:'#8e8e93' }}>size: {size}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function DetectionPreview({ title, boxes, baseImageUrl, processedSize, color = '#0A84FF' }) {
  const containerRef = React.useRef(null);
  const imgRef = React.useRef(null);

  const draw = React.useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (!cw || !ch) return;

    // Compute rendered image rect under object-fit: contain
    const natW = img.naturalWidth || 1;
    const natH = img.naturalHeight || 1;
    const scale = Math.min(cw / natW, ch / natH);
    const rw = Math.round(natW * scale);
    const rh = Math.round(natH * scale);
    const offX = Math.floor((cw - rw) / 2);
    const offY = Math.floor((ch - rh) / 2);

    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    // Map detection coords (processed image space) → rendered image space
    let sx = 1, sy = 1;
    if (processedSize && processedSize.width > 0 && processedSize.height > 0) {
      sx = rw / processedSize.width;
      sy = rh / processedSize.height;
    }

    ctx.lineWidth = Math.max(1, Math.round(Math.min(rw, rh) * 0.003));
    ctx.strokeStyle = color;
    for (const d of (boxes || [])) {
      const b = Array.isArray(d?.bbox) ? d.bbox : null;
      if (!b || b.length !== 4) continue;
      const x1 = Math.floor(b[0] * sx) + offX;
      const y1 = Math.floor(b[1] * sy) + offY;
      const x2 = Math.floor(b[2] * sx) + offX;
      const y2 = Math.floor(b[3] * sy) + offY;
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const ww = Math.max(1, Math.abs(x2 - x1));
      const hh = Math.max(1, Math.abs(y2 - y1));
      ctx.strokeRect(x + 0.5, y + 0.5, ww, hh);
    }
  }, [processedSize, boxes, color]);

  React.useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <div style={{ minHeight:0, height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background: color }} />
        <div style={{ fontSize:15, fontWeight:600, color:'#f5f5f7' }}>{title}</div>
      </div>
      <div ref={containerRef} style={{ position:'relative', flex:1, minHeight:0, border:'1px solid #3a3a3c', borderRadius:10, background:'#0d0d0d', overflow:'hidden' }}>
        {baseImageUrl ? (
          <>
            <img ref={imgRef} src={baseImageUrl} alt={title} onLoad={draw} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
            <canvas style={{ position:'absolute', inset:0, pointerEvents:'none' }} />
          </>
        ) : (
          <div style={{ color:'#8e8e93', fontSize:12, padding:8 }}>No base image</div>
        )}
      </div>
    </div>
  );
}
function cropDataUrl(baseImageUrl, bbox, processedSize) {
  if (!baseImageUrl || !Array.isArray(bbox) || bbox.length !== 4) return Promise.resolve(null);
  const [x1, y1, x2, y2] = bbox.map(v => Math.max(0, Math.floor(v)));
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const srcW = img.naturalWidth || img.width;
          const srcH = img.naturalHeight || img.height;
          let sx = 1, sy = 1;
          if (processedSize && typeof processedSize.width === 'number' && typeof processedSize.height === 'number' && processedSize.width > 0 && processedSize.height > 0) {
            sx = srcW / processedSize.width;
            sy = srcH / processedSize.height;
          }
          const xs = Math.floor(x1 * sx);
          const ys = Math.floor(y1 * sy);
          const xe = Math.floor(x2 * sx);
          const ye = Math.floor(y2 * sy);
          const w = Math.max(1, xe - xs + 1);
          const h = Math.max(1, ye - ys + 1);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, xs, ys, w, h, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = baseImageUrl;
    } catch { resolve(null); }
  });
}

function RetrievalRow({ item, baseImageUrl, processedSize, mode = 'fused' }) {
  const [thumb, setThumb] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    cropDataUrl(baseImageUrl, item?.bbox, processedSize).then((url) => { if (alive) setThumb(url); });
    return () => { alive = false; };
  }, [baseImageUrl, item?.bbox, processedSize?.width, processedSize?.height]);

  const fused = Array.isArray(item?.topCandidates) ? item.topCandidates.slice(0, 10) : [];
  const imgOnly = Array.isArray(item?.imageOnlyTop10) ? item.imageOnlyTop10.slice(0, 10) : [];
  const top = mode === 'image' ? imgOnly : fused;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:12, alignItems:'center', background:'#1a1a1c', borderRadius:8, padding:10, border:'1px solid #2a2a2c' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <div style={{ width:80, height:80, background:'#0d0d0d', border:'1px solid #3a3a3c', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {thumb ? <img src={thumb} alt="icon-crop" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} /> : <div style={{ color:'#8e8e93', fontSize:10 }}>crop</div>}
        </div>
        {typeof item?.caption === 'string' && item.caption.trim() !== '' && (
          <div style={{ fontSize:11, color:'#c6c6c8', textAlign:'center', wordBreak:'break-word', lineHeight:1.2 }}>
            <span style={{ color:'#9a9aa0' }}>Caption: </span>{item.caption}
          </div>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(96px, 1fr))', gap:8 }}>
        {top.map((c, i) => {
          const name = typeof c?.name === 'string' ? c.name : '';
          const shown = name;
          return (
            <div key={i} style={{ background:'#0d0d0d', border:'1px solid #3a3a3c', borderRadius:8, padding:8, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={name} size={28} color={'rgba(255,255,255,0.9)'} />
              </div>
              <div style={{ fontSize:11, color:'#f5f5f7', textAlign:'center', wordBreak:'break-word' }}>{shown || '—'}</div>
              {mode === 'fused' && typeof c?.score_final === 'number' && (
                <div style={{ fontSize:10, color:'#8e8e93' }}>score: {c.score_final.toFixed(3)}</div>
              )}
              {mode === 'image' && typeof c?.score_img === 'number' && (
                <div style={{ fontSize:10, color:'#8e8e93' }}>img: {c.score_img.toFixed(3)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
