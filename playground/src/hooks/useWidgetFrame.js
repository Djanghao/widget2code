/**
 * @file useWidgetFrame.js
 * @description React hook for monitoring widget frame size changes.
 * Tracks widget dimensions via ResizeObserver for display purposes only.
 * @author Houston Zhang
 * @date 2025-10-15
 */

import { useState, useEffect } from 'react';

export default function useWidgetFrame(frameEl) {
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!frameEl) return;

    const update = () => {
      const rect = frameEl.getBoundingClientRect();
      setFrameSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(frameEl);

    return () => ro.disconnect();
  }, [frameEl]);

  return { frameSize, setFrameSize };
}
