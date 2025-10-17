/**
 * @file useWidgetFrame.js
 * @description React hook for monitoring widget frame size changes.
 * Tracks widget dimensions via ResizeObserver and reports loading state.
 * @author Houston Zhang
 * @date 2025-10-15
 */

import { useState, useEffect } from 'react';

export default function useWidgetFrame(
  frameEl,
  expectedSizeRef,
  setIsLoading
) {
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

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
  }, [frameEl, expectedSizeRef, setIsLoading]);

  return { frameSize, setFrameSize };
}
