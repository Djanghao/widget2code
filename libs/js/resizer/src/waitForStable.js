/**
 * @file waitForStable.js
 * @description Utility for waiting until element size stabilizes after layout changes.
 * Handles detection of element remounting and size changes.
 */

/**
 * Waits for an element's size to stabilize
 * @param {Object} options - Configuration options
 * @param {Function} options.getElement - Function that returns the element to monitor
 * @param {Function} [options.shouldAbort] - Optional function to check if operation should abort
 * @param {Function} [options.onLog] - Optional logging callback
 * @param {number} [options.maxAttempts=120] - Maximum number of checks before timeout
 * @param {number} [options.stableFramesInitial=10] - Frames to wait if no change detected initially
 * @param {number} [options.stableFramesAfterChange=3] - Frames to wait after change detected
 * @param {Function} [options.customCheck] - Optional custom check function for additional conditions
 * @returns {Promise<{width: number, height: number}|null>} Stabilized size or null if aborted/timeout
 */
export async function waitForStable(options = {}) {
  const {
    getElement,
    shouldAbort = () => false,
    onLog = () => {},
    maxAttempts = 120,
    stableFramesInitial = 10,
    stableFramesAfterChange = 3,
    customCheck = null
  } = options;

  return new Promise((resolve) => {
    let attempts = 0;
    let frameMounted = false;
    let sizeHistory = [];
    let hasSeenChange = false;
    let customCheckPassed = !customCheck;

    const checkSize = () => {
      if (shouldAbort()) {
        onLog('abort', 'Operation aborted by shouldAbort check');
        resolve(null);
        return;
      }

      attempts++;
      const element = getElement();

      if (!element) {
        if (attempts < maxAttempts) {
          requestAnimationFrame(checkSize);
        } else {
          onLog('timeout', 'Timeout waiting for element to mount');
          resolve(null);
        }
        return;
      }

      if (!frameMounted) {
        frameMounted = true;
        onLog('mounted', 'Element mounted, monitoring size changes');
      }

      if (customCheck && !customCheckPassed) {
        const passed = customCheck(element);
        if (!passed) {
          if (attempts < maxAttempts + 30) {
            requestAnimationFrame(checkSize);
          } else {
            onLog('customCheckTimeout', 'Custom check timeout, proceeding anyway');
            customCheckPassed = true;
          }
          return;
        }
        customCheckPassed = true;
        onLog('customCheckPassed', 'Custom check passed');
      }

      const rect = element.getBoundingClientRect();
      const currentSize = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`;
      sizeHistory.push(currentSize);

      if (sizeHistory.length === 1) {
        onLog('initial', `Initial size: ${currentSize}`);
        requestAnimationFrame(checkSize);
        return;
      }

      const prevSize = sizeHistory[sizeHistory.length - 2];

      if (!hasSeenChange && currentSize === prevSize) {
        const stableCount = sizeHistory.filter(s => s === currentSize).length;
        if (stableCount >= stableFramesInitial) {
          onLog('stableInitial', `Size stable at ${currentSize} (${stableCount} frames, no change detected)`);
          const [w, h] = currentSize.split('x').map(parseFloat);
          resolve({ width: Math.round(w), height: Math.round(h) });
          return;
        }
      }

      if (currentSize !== prevSize && !hasSeenChange) {
        hasSeenChange = true;
        onLog('change', `Size changed: ${prevSize} → ${currentSize}`);
        sizeHistory = [currentSize];
        requestAnimationFrame(checkSize);
        return;
      }

      if (hasSeenChange) {
        if (currentSize === prevSize) {
          const stableCount = sizeHistory.filter(s => s === currentSize).length;
          if (stableCount >= stableFramesAfterChange) {
            onLog('stableAfterChange', `Size stabilized at ${currentSize} (${stableCount} frames, ${attempts} checks)`);
            const [w, h] = currentSize.split('x').map(parseFloat);
            resolve({ width: Math.round(w), height: Math.round(h) });
          } else {
            requestAnimationFrame(checkSize);
          }
        } else {
          onLog('changing', `Size still changing: ${prevSize} → ${currentSize}`);
          sizeHistory = [currentSize];
          if (attempts < maxAttempts) {
            requestAnimationFrame(checkSize);
          } else {
            onLog('maxAttempts', `Max attempts reached, using current size: ${currentSize}`);
            const [w, h] = currentSize.split('x').map(parseFloat);
            resolve({ width: Math.round(w), height: Math.round(h) });
          }
        }
      } else {
        if (attempts < maxAttempts) {
          requestAnimationFrame(checkSize);
        } else {
          onLog('noChange', `No change detected within timeout, using current: ${currentSize}`);
          const [w, h] = currentSize.split('x').map(parseFloat);
          resolve({ width: Math.round(w), height: Math.round(h) });
        }
      }
    };

    requestAnimationFrame(checkSize);
  });
}
