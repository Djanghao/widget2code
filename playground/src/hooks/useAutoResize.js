import { useState, useRef, useCallback } from 'react';

export function useAutoResize(widgetFrameRef, onSpecChange) {
  const [ratioInput, setRatioInput] = useState('');
  const [autoSizing, setAutoSizing] = useState(false);
  const resizingRef = useRef(false);

  const formatSpecWithRootLast = (spec) => {
    if (!spec || typeof spec !== 'object') return spec;
    const w = spec.widget;
    if (!w || typeof w !== 'object' || !('root' in w)) return spec;
    const { root, ...rest } = w;
    return { ...spec, widget: { ...rest, root } };
  };

  const parseAspectRatio = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    if (!s) return null;
    if (s.includes(':')) {
      const [a, b] = s.split(':');
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isFinite(na) || !isFinite(nb) || nb <= 0) return null;
      return na / nb;
    }
    const v = parseFloat(s);
    if (!isFinite(v) || v <= 0) return null;
    return v;
  };

  const waitForFrameToSize = async (targetW, targetH, timeoutMs = 3000) => {
    const start = Date.now();
    for (;;) {
      const node = widgetFrameRef.current;
      if (!node) break;
      const rect = node.getBoundingClientRect();
      if (Math.round(rect.width) === Math.round(targetW) && Math.round(rect.height) === Math.round(targetH)) {
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));
        return true;
      }
      if (Date.now() - start > timeoutMs) return false;
      await new Promise((r) => setTimeout(r, 16));
    }
    return false;
  };

  const measureOverflow = () => {
    const frame = widgetFrameRef.current;
    if (!frame) return { fits: false };
    const root = frame.firstElementChild;
    if (!root) return { fits: false };
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
      let crossesPaddingOrOutside = false;
      const all = root.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (el === root) continue;
        const r = el.getBoundingClientRect();
        if ((r.width || 0) <= 0 && (r.height || 0) <= 0) continue;

        if (r.left < rootRect.left - tol || r.right > rootRect.right + tol || r.top < rootRect.top - tol || r.bottom > rootRect.bottom + tol) {
          crossesPaddingOrOutside = true;
          break;
        }
        if (r.left < innerLeft - tol || r.right > innerRight + tol || r.top < innerTop - tol || r.bottom > innerBottom + tol) {
          crossesPaddingOrOutside = true;
          break;
        }
      }

      if (crossesPaddingOrOutside) {
        fits = false;
      }
      return { fits, cw, ch, sw, sh };
    } catch (e) {
      return { fits, cw, ch, sw, sh };
    }
  };

  const applySizeToSpec = useCallback((spec, width, height) => {
    if (!spec || !spec.widget) return spec;
    const next = { ...spec, widget: { ...spec.widget } };
    next.widget.width = Math.max(1, Math.round(width));
    next.widget.height = Math.max(1, Math.round(height));
    return formatSpecWithRootLast(next);
  }, []);

  const restoreSizeInSpec = useCallback((spec) => {
    if (!spec || !spec.widget) return spec;
    const next = { ...spec, widget: { ...spec.widget } };
    delete next.widget.width;
    delete next.widget.height;
    return formatSpecWithRootLast(next);
  }, []);

  const applySizeAndMeasure = async (spec, w, h) => {
    resizingRef.current = true;
    const updatedSpec = applySizeToSpec(spec, w, h);
    onSpecChange(updatedSpec);
    await waitForFrameToSize(w, h);
    const m = measureOverflow();
    return { measurement: m, spec: updatedSpec };
  };

  const handleAutoResizeByRatio = async (spec, ratio) => {
    if (autoSizing) return spec;
    const r = typeof ratio === 'number' ? ratio : parseAspectRatio(ratioInput);
    if (!r) return spec;
    setAutoSizing(true);
    let currentSpec = spec;
    try {
      const frame = widgetFrameRef.current;
      const rect = frame ? frame.getBoundingClientRect() : null;
      const startW = rect ? Math.max(40, Math.round(rect.height * r)) : 200;
      const startH = Math.max(40, Math.round(startW / r));
      if (rect) {
        console.log(`🎯 [AutoResize Strategy] Natural size: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}, AspectRatio: ${r}, Starting from: ${startW}×${startH} (based on height)`);
      }
      let result = await applySizeAndMeasure(currentSpec, startW, startH);
      currentSpec = result.spec;
      let m = result.measurement;

      if (m.fits) {
        let low = 40;
        let high = startW;
        let best = { w: startW, h: startH, spec: currentSpec };
        const lResult = await applySizeAndMeasure(currentSpec, low, Math.max(40, Math.round(low / r)));
        currentSpec = lResult.spec;
        const lfit = lResult.measurement.fits;
        if (lfit) {
          best = { w: low, h: Math.max(40, Math.round(low / r)), spec: currentSpec };
        } else {
          while (high - low > 1) {
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const mResult = await applySizeAndMeasure(currentSpec, mid, mh);
            currentSpec = mResult.spec;
            if (mResult.measurement.fits) {
              best = { w: mid, h: mh, spec: currentSpec };
              high = mid;
            } else {
              low = mid;
            }
          }
        }
        const finalResult = await applySizeAndMeasure(currentSpec, best.w, best.h);
        currentSpec = finalResult.spec;
      } else {
        let low = startW;
        let high = startW;
        let mm = m;
        const maxCap = 4096;
        while (!mm.fits && high < maxCap) {
          low = high;
          high = Math.min(maxCap, high * 2);
          const hh = Math.max(40, Math.round(high / r));
          const hResult = await applySizeAndMeasure(currentSpec, high, hh);
          currentSpec = hResult.spec;
          mm = hResult.measurement;
        }
        let best = mm.fits ? { w: high, h: Math.max(40, Math.round(high / r)), spec: currentSpec } : { w: low, h: Math.max(40, Math.round(low / r)), spec: currentSpec };
        if (mm.fits) {
          while (high - low > 1) {
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const m2Result = await applySizeAndMeasure(currentSpec, mid, mh);
            currentSpec = m2Result.spec;
            if (m2Result.measurement.fits) {
              best = { w: mid, h: mh, spec: currentSpec };
              high = mid;
            } else {
              low = mid;
            }
          }
          const finalResult = await applySizeAndMeasure(currentSpec, best.w, best.h);
          currentSpec = finalResult.spec;
        }
      }
      return currentSpec;
    } finally {
      resizingRef.current = false;
      setAutoSizing(false);
    }
  };

  return {
    ratioInput,
    setRatioInput,
    autoSizing,
    resizingRef,
    handleAutoResizeByRatio,
    applySizeToSpec,
    restoreSizeInSpec
  };
}
