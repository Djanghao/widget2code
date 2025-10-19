/**
 * @file DirectWidgetRenderer.jsx
 * @description Direct widget renderer using Babel standalone.
 * Transforms and executes JSX code without file system or lazy imports.
 * @author Houston Zhang
 * @date 2025-10-18
 */

import React, { useEffect, useState, useRef } from 'react';
import * as Babel from '@babel/standalone';
import * as WidgetPrimitives from '@widget-factory/primitives';

if (typeof window !== 'undefined') {
  window.React = React;
  window.WidgetPrimitives = WidgetPrimitives;
}

function DirectWidgetRenderer({ jsxCode, onMount, onError }) {
  const [WidgetComponent, setWidgetComponent] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!jsxCode) {
      setWidgetComponent(null);
      setError(null);
      return;
    }

    try {
      console.log('[DirectRenderer] Transforming JSX code...');

      let processedCode = jsxCode;

      processedCode = processedCode.replace(/import\s+React\s+from\s+['"]react['"];?\n?/g, '');
      processedCode = processedCode.replace(/import\s+\{[^}]*\}\s+from\s+['"]@widget-factory\/primitives['"];?\n?/g, '');
      processedCode = processedCode.replace(/import\s+\*\s+as\s+\w+\s+from\s+['"]@widget-factory\/primitives['"];?\n?/g, '');

      const primitivesDestructure = `const { ${Object.keys(WidgetPrimitives).join(', ')} } = window.WidgetPrimitives;\n`;
      processedCode = primitivesDestructure + processedCode;

      const transformed = Babel.transform(processedCode, {
        presets: ['react'],
        filename: 'widget.jsx'
      }).code;

      console.log('[DirectRenderer] Creating component...');

      const componentFactory = new Function(
        'React',
        `${transformed}\nreturn Widget;`
      );

      const Component = componentFactory(React);
      setWidgetComponent(() => Component);
      setError(null);

      console.log('[DirectRenderer] Component created successfully');

      if (!mountedRef.current) {
        mountedRef.current = true;
        if (onMount) {
          setTimeout(() => onMount(), 0);
        }
      }

    } catch (err) {
      console.error('[DirectRenderer] Error:', err);
      setError(err);
      setWidgetComponent(null);
      if (onError) {
        onError(err);
      }
    }
  }, [jsxCode, onMount, onError]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (error) {
    return (
      <div style={{
        display: 'inline-flex',
        maxWidth: 640,
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: '#ff6b6b',
        backgroundColor: '#3a0a0a',
        border: '1px solid #6e1a1a',
        borderRadius: 10,
        padding: 12,
        boxSizing: 'border-box'
      }}>
        <div style={{ fontWeight: 700, marginRight: 8 }}>Render Error:</div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(error?.message || error)}</div>
      </div>
    );
  }

  if (!WidgetComponent) {
    return null;
  }

  return <WidgetComponent />;
}

export default DirectWidgetRenderer;
