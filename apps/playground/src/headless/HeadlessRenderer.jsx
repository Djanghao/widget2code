/**
 * @file HeadlessRenderer.jsx
 * @description Headless rendering component for batch widget processing.
 * Exposes rendering API to window object for Playwright automation.
 * Reuses existing store and rendering pipeline for consistency.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import React, { useRef, useEffect, useState } from 'react';
import usePlaygroundStore from '../store/index.js';
import { captureWidgetAsPNG } from '@widget-factory/exporter';
import WidgetRenderer from '../components/WidgetRenderer.jsx';

function HeadlessRenderer() {
  const widgetFrameRef = useRef(null);
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);
  const enableAutoResizeRef = useRef(false);
  const [frameEl, setFrameEl] = useState(null);

  const {
    widgetDSL,
    renderingPhase,
    operationMode,
    naturalSize,
    finalSize,
    generatedJSX,
    initializeApp,
    validateWidget,
    setEnableAutoResize,
    setWidgetDSL,
    compileToken
  } = usePlaygroundStore();

  useEffect(() => {
    console.log('[Headless] 🎬 Initializing headless renderer...');
    initializeApp(widgetFrameRef);

    window.renderWidgetFromJSX = async (jsxCode, options = {}) => {
      const { enableAutoResize = true, captureOptions = {}, spec = null } = options;
      const renderStartTime = performance.now();

      return new Promise(async (resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        try {
          console.log('\n[Headless] 🚀 ========== Starting widget rendering from JSX ==========');
          console.log('[Headless] 📝 JSX code length:', jsxCode.length);
          console.log('[Headless] ⚙️  Options:', options);
          console.log('[Headless] 🎚️  AutoResize enabled:', enableAutoResize);
          console.log('[Headless] 📐 Spec provided:', !!spec);

          enableAutoResizeRef.current = enableAutoResize;
          setEnableAutoResize(enableAutoResize);

          const state = usePlaygroundStore.getState();

          // Set widgetDSL if spec is provided (needed for writebackSpecSize)
          if (spec) {
            state.setWidgetDSL(spec);
            console.log('[Headless] ✅ widgetDSL set from spec');
          }

          state.setGeneratedJSX(jsxCode);
          state.setRenderingPhase('compiling');

          console.log('[Headless] ⏳ Waiting for rendering pipeline to complete...');

          const maxWaitTime = 30000;
          const startTime = Date.now();
          let lastPhase = '';
          let lastMode = '';

          const waitForIdle = async () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxWaitTime) {
              console.error('[Headless] ⏰ Timeout waiting for rendering to complete');
              reject(new Error('Timeout waiting for rendering to complete'));
              return;
            }

            const currentState = usePlaygroundStore.getState();

            if (currentState.renderingPhase !== lastPhase || currentState.operationMode !== lastMode) {
              console.log(`[Headless] 📊 State: phase=${currentState.renderingPhase}, mode=${currentState.operationMode}, elapsed=${elapsed}ms`);
              lastPhase = currentState.renderingPhase;
              lastMode = currentState.operationMode;
            }

            if (currentState.renderingPhase === 'idle' && currentState.operationMode === 'idle') {
              console.log('[Headless] ✨ Pipeline complete');

              // Check if we need to autoresize (same logic as startCompiling)
              const currentSpec = spec || currentState.widgetDSL;
              const hasWidth = currentSpec?.widget?.width !== undefined;
              const hasHeight = currentSpec?.widget?.height !== undefined;
              const aspectRatio = currentSpec?.widget?.aspectRatio;
              const shouldAutoResize = enableAutoResize &&
                                      !hasWidth && !hasHeight &&
                                      typeof aspectRatio === 'number' &&
                                      isFinite(aspectRatio) &&
                                      aspectRatio > 0;

              if (shouldAutoResize) {
                console.log('[Headless] 🔍 Measuring natural size...');

                // Step 1: Measure natural size (same as startCompiling)
                const measuredNaturalSize = await currentState._waitForNaturalSize(widgetFrameRef, currentState.compileToken);

                if (measuredNaturalSize) {
                  console.log(`[Headless] ✅ Natural size: ${measuredNaturalSize.width}×${measuredNaturalSize.height}`);
                  currentState.setNaturalSize(measuredNaturalSize);
                } else {
                  console.log('[Headless] ⚠️  Could not measure natural size');
                }

                // Step 2: Execute auto-resize (same as startCompiling)
                console.log('[Headless] 🔄 Triggering auto-resize with ratio:', aspectRatio);
                await currentState.executeAutoResize(aspectRatio, widgetFrameRef);
                // Note: executeAutoResize will call writebackSpecSize, which now works because widgetDSL is set

                console.log('[Headless] ✅ Auto-resize complete, waiting 1000ms for stabilization...');
              } else {
                console.log('[Headless] ⏭️  Skipping auto-resize');
              }

              // Wait longer to allow image error handlers to complete
              setTimeout(() => {
                completeRendering(resolve, reject, captureOptions, renderStartTime);
              }, 1000);
            } else {
              requestAnimationFrame(waitForIdle);
            }
          };

          setTimeout(() => {
            state.setRenderingPhase('idle');
            requestAnimationFrame(waitForIdle);
          }, 100);

        } catch (error) {
          console.error('[Headless] ❌ Rendering error:', error);
          reject(error);
        }
      });
    };

    window.getWidgetElement = () => {
      return widgetFrameRef.current?.firstElementChild || null;
    };

    window.getWidgetState = () => {
      const state = usePlaygroundStore.getState();
      return {
        renderingPhase: state.renderingPhase,
        operationMode: state.operationMode,
        naturalSize: state.naturalSize,
        finalSize: state.finalSize,
        hasWidget: !!widgetFrameRef.current?.firstElementChild
      };
    };

    console.log('[Headless] API initialized');
    window.__headlessReady = true;

  }, []);

  const completeRendering = async (resolve, reject, captureOptions, renderStartTime) => {
    try {
      console.log('[Headless] 🎯 Starting final capture phase...');
      const widgetElement = widgetFrameRef.current?.firstElementChild;

      if (!widgetElement) {
        console.error('[Headless] ❌ Widget element not found');
        reject(new Error('Widget element not found'));
        return;
      }

      console.log('[Headless] ✅ Widget element found');

      const state = usePlaygroundStore.getState();
      console.log('[Headless] 🔍 Validating widget...');
      // Only check aspect ratio if autoresize was enabled
      const validation = validateWidget(widgetElement, state.widgetDSL, {
        checkAspectRatio: enableAutoResizeRef.current
      });

      if (!validation.valid) {
        console.warn('[Headless] ⚠️  Validation failed:', validation.issues);
      } else {
        console.log('[Headless] ✅ Validation passed');
      }

      console.log('[Headless] 📐 Widget dimensions:', validation.metadata);
      console.log('[Headless] 📏 Natural size:', state.naturalSize);
      console.log('[Headless] 📏 Final size:', state.finalSize);

      console.log('[Headless] 📸 Capturing PNG with options:', captureOptions);
      const captureStartTime = performance.now();
      const blob = await captureWidgetAsPNG(widgetElement, {
        scale: 2,
        backgroundColor: null,
        ...captureOptions
      });
      const captureTime = performance.now() - captureStartTime;
      console.log(`[Headless] ✅ PNG captured in ${captureTime.toFixed(2)}ms (size: ${(blob.size / 1024).toFixed(2)}KB)`);

      console.log('[Headless] 🔄 Converting to base64...');
      const base64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(blob);
      });

      const totalTime = performance.now() - renderStartTime;
      console.log(`[Headless] 🎉 ========== Rendering complete in ${totalTime.toFixed(2)}ms ==========\n`);

      resolve({
        success: true,
        validation,
        metadata: validation.metadata,
        naturalSize: state.naturalSize,
        finalSize: state.finalSize,
        spec: state.widgetDSL,
        jsx: state.generatedJSX,
        imageData: base64
      });

    } catch (error) {
      console.error('[Headless] ❌ Capture error:', error);
      reject(error);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1c1c1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        ref={(el) => {
          widgetFrameRef.current = el;
          setFrameEl(el);
        }}
        style={{
          display: 'inline-block',
          position: 'relative'
        }}
      >
        {generatedJSX && (
          <WidgetRenderer
            jsxCode={generatedJSX}
          />
        )}
      </div>

      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        color: '#666',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        Phase: {renderingPhase} | Mode: {operationMode}
      </div>
    </div>
  );
}

export default HeadlessRenderer;
