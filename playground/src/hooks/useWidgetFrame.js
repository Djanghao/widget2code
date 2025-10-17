/**
 * @file useWidgetFrame.js
 * @description React hook for monitoring widget frame size changes.
 * Tracks widget dimensions via ResizeObserver and reports loading state.
 * @author Houston Zhang
 * @date 2025-10-15
 */

import { useState, useEffect } from 'react';
import usePlaygroundStore from '../store/index.js';

export default function useWidgetFrame(
  frameEl,
  enableAutoResize,
  expectedSizeRef,
  setIsLoading,
  widgetFrameRef,
  currentExample,
  setRatioInput,
  handleAutoResizeByRatio
) {
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const storeWidgetSpec = usePlaygroundStore((state) => state.widgetSpec);

  useEffect(() => {
    if (!frameEl) return;
    const el = frameEl;
    let frameCount = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: Math.round(rect.width), height: Math.round(rect.height) };

      console.log(`📏 [Widget Size Change #${++frameCount}]`, {
        width: rect.width.toFixed(2),
        height: rect.height.toFixed(2),
        rounded: next,
        timestamp: new Date().toISOString().split('T')[1],
        autoResizeEnabled: enableAutoResize,
        hasExpectedSize: !!expectedSizeRef.current,
        expectedSize: expectedSizeRef.current
      });

      setFrameSize(next);
      const expected = expectedSizeRef.current;
      if (expected && next.width === expected.width && next.height === expected.height) {
        setIsLoading(false);
      }
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [frameEl, enableAutoResize, expectedSizeRef, setIsLoading]);

  useEffect(() => {
    if (!enableAutoResize) {
      console.log('⏸️  [AutoResize] Disabled, skipping');
      return;
    }
    const obj = storeWidgetSpec || currentExample.spec;
    if (!obj || !obj.widget) return;
    const w = obj.widget;
    const hasWH = w.width !== undefined && w.height !== undefined;
    const r = w.aspectRatio;
    console.log('🔍 [AutoResize Check]', {
      hasWidth: w.width !== undefined,
      hasHeight: w.height !== undefined,
      aspectRatio: r,
      willTrigger: !hasWH && typeof r === 'number' && isFinite(r) && r > 0,
      source: storeWidgetSpec ? 'store' : 'example'
    });
    if (!hasWH && typeof r === 'number' && isFinite(r) && r > 0) {
      console.log('⏱️  [AutoResize] Waiting for new widget to mount and render naturally...');
      let attempts = 0;
      let frameMounted = false;
      let sizeHistory = [];
      let hasSeenChange = false;
      let cancelled = false;

      const checkNaturalSize = () => {
        if (cancelled) {
          console.log('🚫 [AutoResize] Cancelled, stopping natural size detection');
          return;
        }

        attempts++;
        const frame = widgetFrameRef.current;

        if (!frame) {
          if (attempts < 120) {
            requestAnimationFrame(checkNaturalSize);
          } else {
            console.log('❌ [AutoResize] Timeout waiting for frame to mount');
          }
          return;
        }

        if (!frameMounted) {
          frameMounted = true;
          console.log(`✅ [AutoResize] Frame mounted, now monitoring size changes...`);
        }

        const rect = frame.getBoundingClientRect();
        const currentSize = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`;
        sizeHistory.push(currentSize);

        if (sizeHistory.length === 1) {
          console.log(`🔎 [AutoResize] Initial size: ${currentSize} (likely old element, waiting for change...)`);
          requestAnimationFrame(checkNaturalSize);
          return;
        }

        const prevSize = sizeHistory[sizeHistory.length - 2];

        if (!hasSeenChange && currentSize === prevSize) {
          const stableCount = sizeHistory.filter(s => s === currentSize).length;
          if (stableCount >= 10) {
            console.log(`📐 [AutoResize] Initial size stable at: ${currentSize} (stable for ${stableCount} frames, no change detected - assuming this is natural size)`);
            console.log('⚡ [AutoResize] Triggering with ratio:', r);
            setRatioInput(r.toString());
            handleAutoResizeByRatio(r);
            return;
          }
        }

        if (currentSize !== prevSize && !hasSeenChange) {
          hasSeenChange = true;
          console.log(`🔄 [AutoResize] Size changed: ${prevSize} → ${currentSize} (new element detected!)`);
          sizeHistory = [currentSize];
          requestAnimationFrame(checkNaturalSize);
          return;
        }

        if (hasSeenChange) {
          if (currentSize === prevSize) {
            const stableCount = sizeHistory.filter(s => s === currentSize).length;
            if (stableCount >= 3) {
              console.log(`📐 [AutoResize] Natural size stabilized at: ${currentSize} (stable for ${stableCount} frames after change, total ${attempts} checks)`);
              console.log('⚡ [AutoResize] Triggering with ratio:', r);
              setRatioInput(r.toString());
              handleAutoResizeByRatio(r);
            } else {
              requestAnimationFrame(checkNaturalSize);
            }
          } else {
            console.log(`🔄 [AutoResize] Size still changing: ${prevSize} → ${currentSize}`);
            sizeHistory = [currentSize];
            if (attempts < 120) {
              requestAnimationFrame(checkNaturalSize);
            } else {
              console.log('⏰ [AutoResize] Max attempts reached, using current size:', currentSize);
              setRatioInput(r.toString());
              handleAutoResizeByRatio(r);
            }
          }
        } else {
          if (attempts < 120) {
            requestAnimationFrame(checkNaturalSize);
          } else {
            console.log('⏰ [AutoResize] No size change detected within timeout, using current:', currentSize);
            setRatioInput(r.toString());
            handleAutoResizeByRatio(r);
          }
        }
      };
      requestAnimationFrame(checkNaturalSize);

      return () => {
        cancelled = true;
      };
    }
  }, [enableAutoResize, storeWidgetSpec, currentExample, widgetFrameRef, setRatioInput, handleAutoResizeByRatio]);

  return { frameSize, setFrameSize };
}
