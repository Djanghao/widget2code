/**
 * @file renderingSlice.js
 * @description Zustand store slice for widget rendering pipeline management.
 * Handles compilation, natural size detection, auto-resize, and widget lifecycle.
 * Provides unified token-based cancellation for all async operations.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import { compileWidgetDSL } from '../../core/compileWidget.js';
import { examples } from '../../constants/examples.js';
import { extractResources } from '@widget-factory/primitives/utils/extractResources.js';
import { preloadIcons } from '@widget-factory/primitives/utils/preloadIcons.js';
import { preloadImages } from '@widget-factory/primitives/utils/preloadImages.js';
import { iconCache } from '@widget-factory/primitives/utils/iconCache.js';
import { sfDynamicIconImports } from '@widget-factory/icons/sf-symbols';
import { findOptimalSize, waitForStable } from '@widget-factory/resizer/index.js';
import { validateWidget as validateWidgetFn } from '@widget-factory/validator/index.js';

const createRenderingSlice = (set, get) => ({
  renderingPhase: 'idle',
  operationMode: 'idle',
  compileToken: 0,
  widgetDSL: null,
  generatedJSX: '',
  treeRoot: null,
  naturalSize: null,
  finalSize: null,

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

  setWidgetDSL: (spec) => set({ widgetDSL: spec }),

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
    const result = compileWidgetDSL(spec);

    if (get().compileToken !== token) {
      console.log(`🚫 [Compile] Token changed during compilation, aborting`);
      return { success: false, cancelled: true };
    }

    if (result.success) {
      set({
        generatedJSX: result.jsx,
        treeRoot: result.treeRoot
      });
      console.log(`✅ [Compile] Success with token: ${token}`);
    } else {
      console.error(`❌ [Compile] Error:`, result.error);
      set({
        generatedJSX: result.jsx,
        treeRoot: null
      });
    }

    return result;
  },


  _waitForNaturalSize: async (widgetFrameRef, token, options = {}) => {
    const { hasGraphs = false } = options;

    if (get().compileToken !== token) {
      console.log(`🚫 [Natural Size] Token mismatch, aborting`);
      return null;
    }

    console.log(`⏱️  [Natural Size] Waiting for widget to mount and render naturally...${hasGraphs ? ' (with graphs)' : ''}`);

    let graphsFullyLoaded = !hasGraphs;

    const checkGraphsLoaded = (frame) => {
      if (!hasGraphs || graphsFullyLoaded) return true;

      const canvases = frame.querySelectorAll('canvas');
      if (canvases.length === 0) {
        return false;
      }

      let allLoaded = true;
      canvases.forEach((canvas) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          allLoaded = false;
          return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((value, index) => {
          if (index % 4 === 3) return false;
          return value !== 0;
        });

        if (!hasContent) {
          allLoaded = false;
        }
      });

      if (allLoaded && !graphsFullyLoaded) {
        graphsFullyLoaded = true;
        console.log(`📊 [Natural Size] All ${canvases.length} graph(s) have rendered content`);
      }

      return allLoaded;
    };

    return waitForStable({
      getElement: () => widgetFrameRef.current,
      shouldAbort: () => get().compileToken !== token,
      onLog: (type, message) => {
        const logMap = {
          abort: `🚫 [Natural Size] ${message}`,
          timeout: `❌ [Natural Size] ${message}`,
          mounted: `✅ [Natural Size] ${message}`,
          customCheckPassed: `📊 [Natural Size] ${message}`,
          customCheckTimeout: `⏰ [Natural Size] ${message}`,
          initial: `🔎 [Natural Size] ${message} (likely old element, waiting for change...)`,
          stableInitial: `📐 [Natural Size] ${message} - assuming this is natural size`,
          change: `🔄 [Natural Size] ${message} (new element detected!)`,
          stableAfterChange: `📐 [Natural Size] Natural size ${message}`,
          changing: `🔄 [Natural Size] ${message}`,
          maxAttempts: `⏰ [Natural Size] ${message}`,
          noChange: `⏰ [Natural Size] ${message}`
        };
        console.log(logMap[type] || `[Natural Size] ${message}`);
      },
      customCheck: hasGraphs ? checkGraphsLoaded : null
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
      widgetDSL: spec
    });

    console.log(`📦 [Resource Preload] Extracting resources from widgetDSL...`);
    const { sfIcons, reactIcons, images, graphs } = extractResources(spec);
    console.log(`📦 [Resource Preload] Found ${sfIcons.length} SF icons, ${reactIcons.length} react-icons, ${images.length} images, and ${graphs.length} graphs`);

    if (sfIcons.length > 0 || reactIcons.length > 0 || images.length > 0) {
      console.log(`⏳ [Resource Preload] Starting resource preloading...`);
      const preloadStartTime = performance.now();

      try {
        await Promise.all([
          sfIcons.length > 0 ? preloadIcons(sfIcons, sfDynamicIconImports, iconCache) : Promise.resolve(),
          images.length > 0 ? preloadImages(images) : Promise.resolve()
        ]);

        if (reactIcons.length > 0) {
          console.log(`ℹ️  [Resource Preload] ${reactIcons.length} react-icons are statically imported (no preload needed)`);
        }

        const preloadTime = performance.now() - preloadStartTime;
        console.log(`✅ [Resource Preload] All resources preloaded in ${preloadTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`❌ [Resource Preload] Error during preloading:`, error);
      }
    } else {
      console.log(`ℹ️  [Resource Preload] No resources to preload`);
    }

    if (get().compileToken !== newToken) {
      console.log(`⏭️  [Start Compiling] Token changed during resource preloading, aborting`);
      return { success: false, cancelled: true };
    }

    const compileResult = get()._compile(spec, newToken);

    if (compileResult.cancelled) {
      console.log(`⏭️  [Start Compiling] Cancelled`);
      return { success: false, cancelled: true };
    }

    if (!compileResult.success) {
      set({ renderingPhase: 'idle' });
      return compileResult;
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

      const naturalSize = await get()._waitForNaturalSize(widgetFrameRef, newToken, { hasGraphs: graphs.length > 0 });

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
    const { widgetDSL } = get();
    if (!widgetDSL || !widgetDSL.widget) {
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
      ...widgetDSL,
      widget: {
        ...widgetDSL.widget,
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height))
      }
    };

    const formatted = formatSpecWithRootLast(updatedSpec);

    set({
      widgetDSL: formatted,
      finalSize: { width: Math.round(width), height: Math.round(height) }
    });

    console.log(`✅ [Writeback] Spec updated`);
  },

  removeSpecSize: async (widgetFrameRef) => {
    const { widgetDSL, naturalSize } = get();
    if (!widgetDSL || !widgetDSL.widget) {
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

    const updatedWidget = { ...widgetDSL.widget };
    delete updatedWidget.width;
    delete updatedWidget.height;

    const updatedSpec = {
      ...widgetDSL,
      widget: updatedWidget
    };

    const formatted = formatSpecWithRootLast(updatedSpec);

    set({
      widgetDSL: formatted,
      finalSize: naturalSize
    });

    console.log(`✅ [Writeback] Size removed, recompiling to restore natural rendering...`);

    await get().startCompiling(formatted, widgetFrameRef, { skipAutoResize: true });
  },

  switchPreset: async (presetKey, widgetFrameRef) => {
    console.log(`\n🔄 [Preset Change] Switching to: ${presetKey}`);

    console.log(`🧹 [Cleanup] Resetting all state and refs...`);

    get().incrementToken();
    console.log(`🎫 [Cleanup] Token invalidated: ${get().compileToken}`);

    set({
      selectedPreset: presetKey,
      widgetDSL: null,
      generatedJSX: '',
      treeRoot: null,
      naturalSize: null,
      finalSize: null,
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


  validateWidget: (widgetElement, spec) => {
    const result = validateWidgetFn(widgetElement, spec);
    console.log(`🔍 [Validation]`, result);
    return result;
  },

  executeAutoResize: async (aspectRatio, widgetFrameRef, tokenRef) => {
    if (get().autoSizing) {
      console.log(`⏭️  [AutoResize] Already running, skipping`);
      return;
    }

    const currentToken = tokenRef ? tokenRef.current : get().compileToken;
    console.log(`\n🎫 [AutoResize] Starting with token: ${currentToken}, ratio: ${aspectRatio}`);

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

      const checkToken = () => {
        if (tokenRef) {
          return tokenRef.current === currentToken;
        } else {
          return get().compileToken === currentToken;
        }
      };

      const result = await findOptimalSize(widgetElement, aspectRatio, {
        minSize: 40,
        maxSize: 4096,
        safetyMargin: 1,
        shouldContinue: checkToken,
        logger: console
      });

      if (!result) {
        return;
      }

      const { width, height } = result;

      console.log(`📝 [AutoResize] Writing optimal size to spec: ${width}×${height}`);
      get().writebackSpecSize(width, height);

      console.log(`🎨 [AutoResize] Applying final size to DOM: ${width}×${height}`);
      widgetElement.style.width = `${width}px`;
      widgetElement.style.height = `${height}px`;

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

    console.log(`🔄 [Initialize] Resetting all state...`);
    get().incrementToken();

    set({
      renderingPhase: 'idle',
      widgetDSL: null,
      generatedJSX: '',
      treeRoot: null,
      naturalSize: null,
      finalSize: null,
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
