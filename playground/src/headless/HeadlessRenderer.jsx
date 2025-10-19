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
import { captureWidgetAsPNG } from '../utils/widgetExport.js';
import DirectWidgetRenderer from '../components/DirectWidgetRenderer.jsx';

function HeadlessRenderer() {
  const widgetFrameRef = useRef(null);
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);
  const [frameEl, setFrameEl] = useState(null);

  const {
    widgetSpec,
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
    initializeApp(widgetFrameRef);

    window.renderWidget = async (spec, options = {}) => {
      const { enableAutoResize = true, captureOptions = {} } = options;

      return new Promise(async (resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        try {
          console.log('[Headless] Starting widget rendering...');
          console.log('[Headless] Spec:', JSON.stringify(spec, null, 2));
          console.log('[Headless] Options:', options);

          setEnableAutoResize(enableAutoResize);

          const result = await startCompiling(spec, widgetFrameRef);

          if (!result.success) {
            throw new Error('Compilation failed');
          }

          const maxWaitTime = 30000;
          const startTime = Date.now();

          const waitForIdle = () => {
            if (Date.now() - startTime > maxWaitTime) {
              reject(new Error('Timeout waiting for rendering to complete'));
              return;
            }

            const state = usePlaygroundStore.getState();

            if (state.renderingPhase === 'idle' && state.operationMode === 'idle') {
              setTimeout(() => {
                completeRendering(resolve, reject, captureOptions);
              }, 500);
            } else {
              requestAnimationFrame(waitForIdle);
            }
          };

          requestAnimationFrame(waitForIdle);

        } catch (error) {
          console.error('[Headless] Rendering error:', error);
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

  const completeRendering = async (resolve, reject, captureOptions) => {
    try {
      const widgetElement = widgetFrameRef.current?.firstElementChild;

      if (!widgetElement) {
        reject(new Error('Widget element not found'));
        return;
      }

      const state = usePlaygroundStore.getState();
      const validation = validateWidget(widgetElement, state.widgetSpec);

      if (!validation.valid) {
        console.warn('[Headless] Validation failed:', validation.issues);
      }

      console.log('[Headless] Capturing PNG...');
      const blob = await captureWidgetAsPNG(widgetElement, {
        scale: 2,
        backgroundColor: null,
        ...captureOptions
      });

      const base64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(blob);
      });

      console.log('[Headless] Rendering complete');

      resolve({
        success: true,
        validation,
        metadata: validation.metadata,
        naturalSize: state.naturalSize,
        finalSize: state.finalSize,
        spec: state.widgetSpec,
        jsx: state.generatedJSX,
        imageData: base64
      });

    } catch (error) {
      console.error('[Headless] Capture error:', error);
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
          <DirectWidgetRenderer
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
