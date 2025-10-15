import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';
import Widget from './generated/Widget.jsx';

export default function BatchRenderer() {
  const [status, setStatus] = useState('waiting');
  const [widgetSpec, setWidgetSpec] = useState(null);
  const widgetFrameRef = useRef(null);
  const [renderComplete, setRenderComplete] = useState(false);

  useEffect(() => {
    window.renderWidget = async (spec) => {
      try {
        setStatus('compiling');
        setRenderComplete(false);

        const jsx = compileWidgetSpecToJSX(spec);

        setStatus('writing jsx');
        await fetch('/__write_widget', {
          method: 'POST',
          body: jsx,
          headers: { 'Content-Type': 'text/plain' }
        });

        setStatus('loading widget');
        setWidgetSpec(spec);

        return new Promise((resolve, reject) => {
          window._renderResolve = resolve;
          window._renderReject = reject;
        });
      } catch (error) {
        setStatus(`error: ${error.message}`);
        throw error;
      }
    };

    setStatus('ready');
  }, []);

  useEffect(() => {
    if (!widgetSpec) return;

    const waitForStable = async () => {
      setStatus('waiting for widget mount');

      let attempts = 0;
      const maxAttempts = 120;

      while (attempts < maxAttempts) {
        const frame = widgetFrameRef.current;
        if (frame && frame.firstElementChild) {
          break;
        }
        await new Promise(r => requestAnimationFrame(r));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        const error = new Error('Widget failed to mount');
        window._renderReject?.(error);
        setStatus('error: mount timeout');
        return;
      }

      setStatus('waiting for natural size');

      const frame = widgetFrameRef.current;
      const widgetElement = frame.firstElementChild;

      await new Promise(r => setTimeout(r, 200));

      let sizeHistory = [];
      let stableCount = 0;

      for (let i = 0; i < 60; i++) {
        const rect = widgetElement.getBoundingClientRect();
        const currentSize = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`;

        sizeHistory.push(currentSize);
        if (sizeHistory.length > 1 && currentSize === sizeHistory[sizeHistory.length - 2]) {
          stableCount++;
          if (stableCount >= 3) {
            break;
          }
        } else {
          stableCount = 0;
        }

        await new Promise(r => requestAnimationFrame(r));
      }

      const hasAutoResize = widgetSpec.widget?.aspectRatio &&
                           !widgetSpec.widget?.width &&
                           !widgetSpec.widget?.height;

      if (hasAutoResize) {
        setStatus('auto-resizing');

        const ratio = widgetSpec.widget.aspectRatio;
        const rect = widgetElement.getBoundingClientRect();
        const startW = rect ? Math.max(40, Math.round(rect.height * ratio)) : 200;
        const startH = Math.max(40, Math.round(startW / ratio));

        const applySizeAndMeasure = async (w, h) => {
          widgetElement.style.width = `${w}px`;
          widgetElement.style.height = `${h}px`;
          await new Promise(r => requestAnimationFrame(r));
          await new Promise(r => requestAnimationFrame(r));

          const root = widgetElement;
          const cw = root.clientWidth;
          const ch = root.clientHeight;
          const sw = root.scrollWidth;
          const sh = root.scrollHeight;

          let fits = sw <= cw && sh <= ch;

          try {
            const rootRect = root.getBoundingClientRect();
            const cs = window.getComputedStyle(root);
            const padL = parseFloat(cs.paddingLeft) || 0;
            const padR = parseFloat(cs.paddingRight) || 0;
            const padT = parseFloat(cs.paddingTop) || 0;
            const padB = parseFloat(cs.paddingBottom) || 0;
            const innerLeft = rootRect.left + padL;
            const innerRight = rootRect.right - padR;
            const innerTop = rootRect.top + padT;
            const innerBottom = rootRect.bottom - padB;
            const tol = 0.5;

            const all = root.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
              const el = all[i];
              if (el === root) continue;
              const r = el.getBoundingClientRect();
              if ((r.width || 0) <= 0 && (r.height || 0) <= 0) continue;

              if (r.left < rootRect.left - tol || r.right > rootRect.right + tol ||
                  r.top < rootRect.top - tol || r.bottom > rootRect.bottom + tol) {
                fits = false;
                break;
              }
              if (r.left < innerLeft - tol || r.right > innerRight + tol ||
                  r.top < innerTop - tol || r.bottom > innerBottom + tol) {
                fits = false;
                break;
              }
            }
          } catch (e) {
          }

          return { fits, cw, ch, sw, sh };
        };

        let m = await applySizeAndMeasure(startW, startH);
        let best = { w: startW, h: startH };

        if (m.fits) {
          let low = 40;
          let high = startW;

          const lm = await applySizeAndMeasure(low, Math.max(40, Math.round(low / ratio)));
          if (lm.fits) {
            best = { w: low, h: Math.max(40, Math.round(low / ratio)) };
          } else {
            while (high - low > 1) {
              const mid = Math.floor((low + high) / 2);
              const mh = Math.max(40, Math.round(mid / ratio));
              const mm = await applySizeAndMeasure(mid, mh);
              if (mm.fits) {
                best = { w: mid, h: mh };
                high = mid;
              } else {
                low = mid;
              }
            }
          }
        } else {
          let low = startW;
          let high = startW;
          let mm = m;
          const maxCap = 4096;

          while (!mm.fits && high < maxCap) {
            low = high;
            high = Math.min(maxCap, high * 2);
            const hh = Math.max(40, Math.round(high / ratio));
            mm = await applySizeAndMeasure(high, hh);
          }

          if (mm.fits) {
            best = { w: high, h: Math.max(40, Math.round(high / ratio)) };
            while (high - low > 1) {
              const mid = Math.floor((low + high) / 2);
              const mh = Math.max(40, Math.round(mid / ratio));
              const m2 = await applySizeAndMeasure(mid, mh);
              if (m2.fits) {
                best = { w: mid, h: mh };
                high = mid;
              } else {
                low = mid;
              }
            }
          } else {
            best = { w: low, h: Math.max(40, Math.round(low / ratio)) };
          }
        }

        await applySizeAndMeasure(best.w, best.h);

        widgetSpec.widget.width = Math.round(best.w);
        widgetSpec.widget.height = Math.round(best.h);
      }

      setStatus('capturing screenshot');
      await new Promise(r => setTimeout(r, 100));

      try {
        const canvas = await html2canvas(widgetElement, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        const finalJsx = compileWidgetSpecToJSX(widgetSpec);

        setStatus('complete');
        setRenderComplete(true);

        window._renderResolve?.({
          png: base64,
          jsx: finalJsx,
          spec: widgetSpec,
          width: widgetSpec.widget?.width,
          height: widgetSpec.widget?.height
        });
      } catch (error) {
        setStatus(`error: ${error.message}`);
        window._renderReject?.(error);
      }
    };

    waitForStable();
  }, [widgetSpec]);

  return (
    <>
      <div id="status">{status}</div>
      {widgetSpec && (
        <div
          ref={widgetFrameRef}
          style={{
            display: 'inline-block',
            position: 'relative'
          }}
        >
          <Widget />
        </div>
      )}
    </>
  );
}
