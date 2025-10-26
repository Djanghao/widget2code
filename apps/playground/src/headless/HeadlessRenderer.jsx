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
  const [frameEl, setFrameEl] = useState(null);

  const {
    widgetDSL,
    renderingPhase,
    operationMode,
    naturalSize,
    finalSize,
    generatedJSX,
    initializeApp,
    startCompiling,
    validateWidget,
    setEnableAutoResize
  } = usePlaygroundStore();

  useEffect(() => {
    console.log('[Headless] 🎬 Initializing headless renderer...');
    initializeApp(widgetFrameRef);

    window.renderWidget = async (spec, options = {}) => {
      const { enableAutoResize = true, captureOptions = {} } = options;
      const renderStartTime = performance.now();

      return new Promise(async (resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        try {
          console.log('\n[Headless] 🚀 ========== Starting widget rendering ==========');
          console.log('[Headless] 📋 Spec:', JSON.stringify(spec, null, 2));
          console.log('[Headless] ⚙️  Options:', options);
          console.log('[Headless] 🎚️  AutoResize enabled:', enableAutoResize);

          setEnableAutoResize(enableAutoResize);

          console.log('[Headless] 🔨 Calling startCompiling...');
          const compileStartTime = performance.now();
          const result = await startCompiling(spec, widgetFrameRef);
          const compileTime = performance.now() - compileStartTime;

          if (!result.success) {
            console.error('[Headless] ❌ Compilation failed');
            throw new Error('Compilation failed');
          }

          console.log(`[Headless] ✅ Compilation completed in ${compileTime.toFixed(2)}ms`);
          console.log('[Headless] ⏳ Waiting for rendering pipeline to complete...');

          const maxWaitTime = 30000;
          const startTime = Date.now();
          let lastPhase = '';
          let lastMode = '';

          const waitForIdle = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxWaitTime) {
              console.error('[Headless] ⏰ Timeout waiting for rendering to complete');
              reject(new Error('Timeout waiting for rendering to complete'));
              return;
            }

            const state = usePlaygroundStore.getState();

            if (state.renderingPhase !== lastPhase || state.operationMode !== lastMode) {
              console.log(`[Headless] 📊 State: phase=${state.renderingPhase}, mode=${state.operationMode}, elapsed=${elapsed}ms`);
              lastPhase = state.renderingPhase;
              lastMode = state.operationMode;
            }

            if (state.renderingPhase === 'idle' && state.operationMode === 'idle') {
              console.log('[Headless] ✨ Pipeline complete, waiting 500ms for stabilization...');
              setTimeout(() => {
                completeRendering(resolve, reject, captureOptions, renderStartTime);
              }, 500);
            } else {
              requestAnimationFrame(waitForIdle);
            }
          };

          requestAnimationFrame(waitForIdle);

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
      const validation = validateWidget(widgetElement, state.widgetDSL);

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
