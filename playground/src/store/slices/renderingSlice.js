/**
 * @file renderingSlice.js
 * @description Zustand store slice for widget rendering pipeline management.
 * Handles compilation, natural size detection, auto-resize, and widget lifecycle.
 * Provides unified token-based cancellation for all async operations.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import { compileWidgetSpec, writeWidgetFile, cleanupWidgetFiles } from '../../core/compileWidget.js';
import { examples } from '../../constants/examples.js';

const createRenderingSlice = (set, get) => ({
  renderingPhase: 'idle',
  operationMode: 'idle',
  compileToken: 0,
  widgetSpec: null,
  generatedJSX: '',
  treeRoot: null,
  naturalSize: null,
  finalSize: null,
  currentWidgetFileName: null,

  selectedPreset: 'weatherSmallLight',
  ratioInput: '',
  enableAutoResize: true,
  autoSizing: false,

  setRenderingPhase: (phase) => set({ renderingPhase: phase }),

  setOperationMode: (mode) => {
    console.log(`🔒 [Operation Mode] ${get().operationMode} → ${mode}`);
    set({ operationMode: mode });
  },

  incrementToken: () => set((state) => ({ compileToken: state.compileToken + 1 })),

  setWidgetSpec: (spec) => set({ widgetSpec: spec }),

  setGeneratedJSX: (jsx) => set({ generatedJSX: jsx }),

  setTreeRoot: (tree) => set({ treeRoot: tree }),

  setNaturalSize: (size) => set({ naturalSize: size }),

  setFinalSize: (size) => set({ finalSize: size }),

  setSelectedPreset: (preset) => set({ selectedPreset: preset }),

  setRatioInput: (ratio) => set({ ratioInput: ratio }),

  setEnableAutoResize: (enabled) => {
    if (typeof enabled === 'function') {
      set((state) => ({ enableAutoResize: enabled(state.enableAutoResize) }));
    } else {
      set({ enableAutoResize: enabled });
    }
  },

  setAutoSizing: (sizing) => set({ autoSizing: sizing }),

  _compile: (spec, token) => {
    if (get().compileToken !== token) {
      console.log(`🚫 [Compile] Token mismatch, aborting (expected: ${token}, current: ${get().compileToken})`);
      return { success: false, cancelled: true };
    }

    console.log(`🔨 [Compile] Starting with token: ${token}`);
    const result = compileWidgetSpec(spec);

    if (get().compileToken !== token) {
      console.log(`🚫 [Compile] Token changed during compilation, aborting`);
      return { success: false, cancelled: true };
    }

    if (result.success) {
      set({
        generatedJSX: result.jsx,
        treeRoot: result.treeRoot,
        currentWidgetFileName: result.fileName
      });
      console.log(`✅ [Compile] Success with token: ${token}, fileName: ${result.fileName}`);
    } else {
      console.error(`❌ [Compile] Error:`, result.error);
      set({
        generatedJSX: result.jsx,
        treeRoot: null,
        currentWidgetFileName: null
      });
    }

    return result;
  },

  _writeWidget: async (jsx, fileName, token) => {
    if (get().compileToken !== token) {
      console.log(`🚫 [Write] Token mismatch, aborting`);
      return { success: false, cancelled: true };
    }

    console.log(`📝 [Write] Writing widget file: ${fileName} with token: ${token}`);
    const result = await writeWidgetFile(jsx, fileName);

    if (get().compileToken !== token) {
      console.log(`🚫 [Write] Token changed during write, aborting`);
      return { success: false, cancelled: true };
    }

    if (result.success) {
      console.log(`✅ [Write] Success with token: ${token}, file: ${fileName}`);
    } else {
      console.error(`❌ [Write] Error:`, result.error);
    }

    return result;
  },

  _waitForNaturalSize: async (widgetFrameRef, token) => {
    if (get().compileToken !== token) {
      console.log(`🚫 [Natural Size] Token mismatch, aborting`);
      return null;
    }

    console.log(`⏱️  [Natural Size] Waiting for widget to mount and render naturally...`);

    return new Promise((resolve) => {
      let attempts = 0;
      let frameMounted = false;
      let sizeHistory = [];
      let hasSeenChange = false;

      const checkNaturalSize = () => {
        if (get().compileToken !== token) {
          console.log(`🚫 [Natural Size] Token changed, stopping detection`);
          resolve(null);
          return;
        }

        attempts++;
        const frame = widgetFrameRef.current;

        if (!frame) {
          if (attempts < 120) {
            requestAnimationFrame(checkNaturalSize);
          } else {
            console.log(`❌ [Natural Size] Timeout waiting for frame to mount`);
            resolve(null);
          }
          return;
        }

        if (!frameMounted) {
          frameMounted = true;
          console.log(`✅ [Natural Size] Frame mounted, now monitoring size changes...`);
        }

        const rect = frame.getBoundingClientRect();
        const currentSize = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`;
        sizeHistory.push(currentSize);

        if (sizeHistory.length === 1) {
          console.log(`🔎 [Natural Size] Initial size: ${currentSize} (likely old element, waiting for change...)`);
          requestAnimationFrame(checkNaturalSize);
          return;
        }

        const prevSize = sizeHistory[sizeHistory.length - 2];

        if (!hasSeenChange && currentSize === prevSize) {
          const stableCount = sizeHistory.filter(s => s === currentSize).length;
          if (stableCount >= 10) {
            console.log(`📐 [Natural Size] Initial size stable at: ${currentSize} (stable for ${stableCount} frames, no change detected - assuming this is natural size)`);
            const [w, h] = currentSize.split('x').map(parseFloat);
            resolve({ width: Math.round(w), height: Math.round(h) });
            return;
          }
        }

        if (currentSize !== prevSize && !hasSeenChange) {
          hasSeenChange = true;
          console.log(`🔄 [Natural Size] Size changed: ${prevSize} → ${currentSize} (new element detected!)`);
          sizeHistory = [currentSize];
          requestAnimationFrame(checkNaturalSize);
          return;
        }

        if (hasSeenChange) {
          if (currentSize === prevSize) {
            const stableCount = sizeHistory.filter(s => s === currentSize).length;
            if (stableCount >= 3) {
              console.log(`📐 [Natural Size] Natural size stabilized at: ${currentSize} (stable for ${stableCount} frames after change, total ${attempts} checks)`);
              const [w, h] = currentSize.split('x').map(parseFloat);
              resolve({ width: Math.round(w), height: Math.round(h) });
            } else {
              requestAnimationFrame(checkNaturalSize);
            }
          } else {
            console.log(`🔄 [Natural Size] Size still changing: ${prevSize} → ${currentSize}`);
            sizeHistory = [currentSize];
            if (attempts < 120) {
              requestAnimationFrame(checkNaturalSize);
            } else {
              console.log(`⏰ [Natural Size] Max attempts reached, using current size: ${currentSize}`);
              const [w, h] = currentSize.split('x').map(parseFloat);
              resolve({ width: Math.round(w), height: Math.round(h) });
            }
          }
        } else {
          if (attempts < 120) {
            requestAnimationFrame(checkNaturalSize);
          } else {
            console.log(`⏰ [Natural Size] No size change detected within timeout, using current: ${currentSize}`);
            const [w, h] = currentSize.split('x').map(parseFloat);
            resolve({ width: Math.round(w), height: Math.round(h) });
          }
        }
      };

      requestAnimationFrame(checkNaturalSize);
    });
  },

  startCompiling: async (spec, widgetFrameRef, options = {}) => {
    const { skipAutoResize = false } = options;
    const newToken = get().compileToken + 1;
    console.log(`\n🎬 [Start Compiling] New operation with token: ${newToken}${skipAutoResize ? ' (skip auto-resize)' : ''}`);

    set({
      compileToken: newToken,
      renderingPhase: 'compiling',
      operationMode: 'compiling',
      widgetSpec: spec
    });

    const compileResult = get()._compile(spec, newToken);

    if (compileResult.cancelled) {
      console.log(`⏭️  [Start Compiling] Cancelled`);
      return { success: false, cancelled: true };
    }

    if (!compileResult.success) {
      set({ renderingPhase: 'idle' });
      return compileResult;
    }

    const writeResult = await get()._writeWidget(compileResult.jsx, compileResult.fileName, newToken);

    if (writeResult.cancelled) {
      console.log(`⏭️  [Start Compiling] Cancelled during write`);
      return { success: false, cancelled: true };
    }

    if (get().compileToken !== newToken) {
      console.log(`⏭️  [Start Compiling] Token changed, aborting`);
      return { success: false, cancelled: true };
    }

    const hasWidth = spec.widget?.width !== undefined;
    const hasHeight = spec.widget?.height !== undefined;
    const aspectRatio = spec.widget?.aspectRatio;
    const shouldAutoResize = !skipAutoResize &&
                            !hasWidth && !hasHeight &&
                            typeof aspectRatio === 'number' &&
                            isFinite(aspectRatio) &&
                            aspectRatio > 0 &&
                            get().enableAutoResize &&
                            widgetFrameRef;

    if (shouldAutoResize) {
      console.log(`🔍 [Start Compiling] Waiting for natural size with ratio: ${aspectRatio}`);

      const naturalSize = await get()._waitForNaturalSize(widgetFrameRef, newToken);

      if (get().compileToken !== newToken) {
        console.log(`⏭️  [Start Compiling] Token changed during natural size detection`);
        return { success: false, cancelled: true };
      }

      if (naturalSize) {
        set({ naturalSize });
        console.log(`✅ [Start Compiling] Natural size detected: ${naturalSize.width}×${naturalSize.height}`);
        console.log(`⚡ [Start Compiling] Auto-triggering resize with ratio: ${aspectRatio}`);

        await get().executeAutoResize(aspectRatio, widgetFrameRef);
      } else {
        console.log(`⚠️ [Start Compiling] Could not detect natural size, skipping auto-resize`);
      }
    }

    if (get().compileToken === newToken) {
      set({
        renderingPhase: 'idle',
        operationMode: 'idle'
      });
      console.log(`✨ [Start Compiling] Completed with token: ${newToken}\n`);
    }

    return { success: true, token: newToken };
  },

  cancelCurrentOperation: () => {
    const oldToken = get().compileToken;
    get().incrementToken();
    console.log(`🛑 [Cancel] Operation cancelled, token: ${oldToken} → ${get().compileToken}`);
  },

  writebackSpecSize: (width, height) => {
    const { widgetSpec } = get();
    if (!widgetSpec || !widgetSpec.widget) {
      console.warn(`⚠️ [Writeback] No widget spec to update`);
      return;
    }

    console.log(`✍️ [Writeback] Updating spec size: ${width}×${height} (no recompile)`);

    const formatSpecWithRootLast = (spec) => {
      if (!spec || typeof spec !== 'object') return spec;
      const w = spec.widget;
      if (!w || typeof w !== 'object' || !('root' in w)) return spec;
      const { root, ...rest } = w;
      return { ...spec, widget: { ...rest, root } };
    };

    const updatedSpec = {
      ...widgetSpec,
      widget: {
        ...widgetSpec.widget,
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height))
      }
    };

    const formatted = formatSpecWithRootLast(updatedSpec);

    set({
      widgetSpec: formatted,
      finalSize: { width: Math.round(width), height: Math.round(height) }
    });

    console.log(`✅ [Writeback] Spec updated`);
  },

  removeSpecSize: async (widgetFrameRef) => {
    const { widgetSpec, naturalSize } = get();
    if (!widgetSpec || !widgetSpec.widget) {
      console.warn(`⚠️ [Writeback] No widget spec to update`);
      return;
    }

    console.log(`🗑️ [Writeback] Removing size from spec (restore to natural)`);

    const formatSpecWithRootLast = (spec) => {
      if (!spec || typeof spec !== 'object') return spec;
      const w = spec.widget;
      if (!w || typeof w !== 'object' || !('root' in w)) return spec;
      const { root, ...rest } = w;
      return { ...spec, widget: { ...rest, root } };
    };

    const updatedWidget = { ...widgetSpec.widget };
    delete updatedWidget.width;
    delete updatedWidget.height;

    const updatedSpec = {
      ...widgetSpec,
      widget: updatedWidget
    };

    const formatted = formatSpecWithRootLast(updatedSpec);

    set({
      widgetSpec: formatted,
      finalSize: naturalSize
    });

    console.log(`✅ [Writeback] Size removed, recompiling to restore natural rendering...`);

    await get().startCompiling(formatted, widgetFrameRef, { skipAutoResize: true });
  },

  switchPreset: async (presetKey, widgetFrameRef) => {
    console.log(`\n🔄 [Preset Change] Switching to: ${presetKey}`);

    console.log(`🧹 [Cleanup] Cleaning up old widget files...`);
    const cleanupResult = await cleanupWidgetFiles();
    if (cleanupResult.success) {
      console.log(`✅ [Cleanup] Old widget files deleted`);
    } else {
      console.warn(`⚠️ [Cleanup] Failed to delete old files:`, cleanupResult.error);
    }

    console.log(`🧹 [Cleanup] Resetting all state and refs...`);

    get().incrementToken();
    console.log(`🎫 [Cleanup] Token invalidated: ${get().compileToken}`);

    set({
      selectedPreset: presetKey,
      widgetSpec: null,
      generatedJSX: '',
      treeRoot: null,
      naturalSize: null,
      finalSize: null,
      currentWidgetFileName: null,
      ratioInput: '',
      autoSizing: false
    });

    console.log(`✨ [Cleanup] Complete`);

    const newSpec = examples[presetKey]?.spec;
    if (!newSpec) {
      console.error(`❌ [Preset Change] Preset not found: ${presetKey}`);
      return;
    }

    await get().startCompiling(newSpec, widgetFrameRef);
  },

  _waitForLayoutStable: async () => {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
  },

  _measureOverflow: (widgetElement) => {
    if (!widgetElement) return { fits: false };

    const cw = widgetElement.clientWidth;
    const ch = widgetElement.clientHeight;
    const sw = widgetElement.scrollWidth;
    const sh = widgetElement.scrollHeight;

    let fits = sw <= cw && sh <= ch;

    try {
      const rootRect = widgetElement.getBoundingClientRect();
      const cs = window.getComputedStyle(widgetElement);
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
      const all = widgetElement.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (el === widgetElement) continue;
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
  },

  validateWidget: (widgetElement, spec) => {
    const issues = [];
    const warnings = [];

    if (!widgetElement) {
      return {
        valid: false,
        issues: ['Widget element not found'],
        warnings: [],
        metadata: null
      };
    }

    const overflow = get()._measureOverflow(widgetElement);
    const rect = widgetElement.getBoundingClientRect();
    const actualWidth = Math.round(rect.width);
    const actualHeight = Math.round(rect.height);
    const actualRatio = actualWidth / actualHeight;

    const expectedWidth = spec?.widget?.width;
    const expectedHeight = spec?.widget?.height;
    const expectedRatio = spec?.widget?.aspectRatio;

    if (!overflow.fits) {
      issues.push('Content overflows container or padding area');
    }

    if (expectedRatio && typeof expectedRatio === 'number' && isFinite(expectedRatio)) {
      const deviation = Math.abs(actualRatio - expectedRatio) / expectedRatio;
      if (deviation > 0.05) {
        issues.push(
          `Aspect ratio mismatch: expected ${expectedRatio.toFixed(3)}, got ${actualRatio.toFixed(3)} (${(deviation * 100).toFixed(1)}% off)`
        );
      } else if (deviation > 0.02) {
        warnings.push(
          `Aspect ratio slightly off: expected ${expectedRatio.toFixed(3)}, got ${actualRatio.toFixed(3)} (${(deviation * 100).toFixed(1)}% off)`
        );
      }
    }

    if (expectedWidth && Math.abs(actualWidth - expectedWidth) > 1) {
      warnings.push(`Width mismatch: expected ${expectedWidth}px, got ${actualWidth}px`);
    }

    if (expectedHeight && Math.abs(actualHeight - expectedHeight) > 1) {
      warnings.push(`Height mismatch: expected ${expectedHeight}px, got ${actualHeight}px`);
    }

    const metadata = {
      width: actualWidth,
      height: actualHeight,
      aspectRatio: parseFloat(actualRatio.toFixed(4)),
      hasOverflow: !overflow.fits,
      scrollWidth: overflow.sw,
      scrollHeight: overflow.sh
    };

    console.log(`🔍 [Validation]`, {
      valid: issues.length === 0,
      issues,
      warnings,
      metadata
    });

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      metadata
    };
  },

  _applySizeToDOMAndMeasure: async (widgetElement, w, h) => {
    if (!widgetElement) return { fits: false };

    widgetElement.style.width = `${w}px`;
    widgetElement.style.height = `${h}px`;

    await get()._waitForLayoutStable();
    const m = get()._measureOverflow(widgetElement);
    return m;
  },

  executeAutoResize: async (aspectRatio, widgetFrameRef, tokenRef) => {
    if (get().autoSizing) {
      console.log(`⏭️  [AutoResize] Already running, skipping`);
      return;
    }

    const r = aspectRatio;
    if (!r) {
      console.warn(`⚠️ [AutoResize] No aspect ratio provided`);
      return;
    }

    const currentToken = tokenRef ? tokenRef.current : get().compileToken;
    console.log(`\n🎫 [AutoResize] Starting with token: ${currentToken}, ratio: ${r}`);

    set({
      autoSizing: true,
      operationMode: 'autoresizing'
    });

    try {
      const frame = widgetFrameRef.current;
      if (!frame) {
        console.log(`❌ [AutoResize] No frame element`);
        return;
      }

      const widgetElement = frame.firstElementChild;
      if (!widgetElement) {
        console.log(`❌ [AutoResize] No widget element`);
        return;
      }

      const rect = widgetElement.getBoundingClientRect();
      const startW = Math.max(40, Math.round(rect.width));
      const startH = Math.max(40, Math.round(startW / r));

      console.log(`📐 [AutoResize] Natural size: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}, Starting: ${startW}×${startH}, Ratio: ${r}`);

      const checkToken = () => {
        if (tokenRef) {
          return tokenRef.current === currentToken;
        } else {
          return get().compileToken === currentToken;
        }
      };

      if (!checkToken()) {
        console.log(`🚫 [AutoResize] Token mismatch, aborting`);
        return;
      }

      let m = await get()._applySizeToDOMAndMeasure(widgetElement, startW, startH);
      let best = { w: startW, h: startH };

      if (!checkToken()) return;

      if (m.fits) {
        console.log(`✓ [AutoResize] Initial size fits, searching for minimum...`);
        let low = 40;
        let high = startW;

        const lm = await get()._applySizeToDOMAndMeasure(widgetElement, low, Math.max(40, Math.round(low / r)));
        if (!checkToken()) return;

        if (lm.fits) {
          best = { w: low, h: Math.max(40, Math.round(low / r)) };
          console.log(`✓ [AutoResize] Minimum size (${low}) already fits`);
        } else {
          while (high - low > 1) {
            if (!checkToken()) return;
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const mm = await get()._applySizeToDOMAndMeasure(widgetElement, mid, mh);
            if (mm.fits) {
              best = { w: mid, h: mh };
              high = mid;
            } else {
              low = mid;
            }
          }
          console.log(`✓ [AutoResize] Found minimum fitting size: ${best.w}×${best.h}`);
        }
      } else {
        console.log(`✗ [AutoResize] Initial size too small, expanding...`);
        let low = startW;
        let high = startW;
        let mm = m;
        const maxCap = 4096;

        while (!mm.fits && high < maxCap) {
          if (!checkToken()) return;
          low = high;
          high = Math.min(maxCap, high * 2);
          const hh = Math.max(40, Math.round(high / r));
          mm = await get()._applySizeToDOMAndMeasure(widgetElement, high, hh);
        }

        if (mm.fits) {
          best = { w: high, h: Math.max(40, Math.round(high / r)) };
          console.log(`✓ [AutoResize] Found fitting size at ${high}, searching for minimum...`);

          while (high - low > 1) {
            if (!checkToken()) return;
            const mid = Math.floor((low + high) / 2);
            const mh = Math.max(40, Math.round(mid / r));
            const m2 = await get()._applySizeToDOMAndMeasure(widgetElement, mid, mh);
            if (m2.fits) {
              best = { w: mid, h: mh };
              high = mid;
            } else {
              low = mid;
            }
          }
          console.log(`✓ [AutoResize] Found minimum fitting size: ${best.w}×${best.h}`);
        } else {
          best = { w: low, h: Math.max(40, Math.round(low / r)) };
          console.log(`⚠️ [AutoResize] Could not fit within max cap, using: ${best.w}×${best.h}`);
        }
      }

      if (!checkToken()) return;

      const safeW = best.w + 1;
      const safeH = best.h + 1;
      console.log(`📝 [AutoResize] Writing optimal size to spec: ${safeW}×${safeH} (${best.w}×${best.h} + 1px safety margin)`);
      get().writebackSpecSize(safeW, safeH);

      console.log(`🎨 [AutoResize] Applying final size to DOM: ${safeW}×${safeH}`);
      widgetElement.style.width = `${safeW}px`;
      widgetElement.style.height = `${safeH}px`;

      console.log(`✅ [AutoResize] Completed successfully\n`);
    } finally {
      set({
        autoSizing: false,
        operationMode: 'idle'
      });
    }
  },

  compileFromEdited: async (specString, widgetFrameRef) => {
    if (!specString || !specString.trim()) {
      console.log(`⏭️  [Compile From Edited] Empty spec, skipping`);
      return;
    }

    let spec;
    try {
      spec = JSON.parse(specString);
    } catch (err) {
      console.error(`❌ [Compile From Edited] Invalid JSON:`, err.message);
      set({
        generatedJSX: `// Error: Invalid JSON\n// ${err.message}`,
        treeRoot: null
      });
      return;
    }

    console.log(`📝 [Compile From Edited] Compiling edited spec...`);
    await get().startCompiling(spec, widgetFrameRef);
  },

  initializeApp: async (widgetFrameRef) => {
    console.log(`\n🚀 [Initialize] Starting app initialization...`);

    console.log(`🧹 [Initialize] Cleaning up old widget files...`);
    const cleanupResult = await cleanupWidgetFiles();

    if (cleanupResult.success) {
      console.log(`✅ [Initialize] Cleanup successful`);
    } else {
      console.warn(`⚠️ [Initialize] Cleanup failed:`, cleanupResult.error);
    }

    console.log(`🔄 [Initialize] Resetting all state...`);
    get().incrementToken();

    set({
      renderingPhase: 'idle',
      widgetSpec: null,
      generatedJSX: '',
      treeRoot: null,
      naturalSize: null,
      finalSize: null,
      currentWidgetFileName: null,
      ratioInput: '',
      autoSizing: false
    });

    console.log(`✨ [Initialize] State reset complete`);

    const isHeadless = typeof window !== 'undefined' && window.__headlessMode === true;

    if (isHeadless) {
      console.log(`🤖 [Initialize] Headless mode detected - skipping preset load`);
      console.log(`✅ [Initialize] App initialization complete\n`);
      return;
    }

    const defaultPreset = get().selectedPreset;
    console.log(`📦 [Initialize] Loading default preset: ${defaultPreset}`);

    await get().switchPreset(defaultPreset, widgetFrameRef);

    console.log(`✅ [Initialize] App initialization complete\n`);
  }
});

export default createRenderingSlice;
