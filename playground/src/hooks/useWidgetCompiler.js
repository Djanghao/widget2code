/**
 * @file useWidgetCompiler.js
 * @description React hook for legacy widget compilation (pre-store migration).
 * Compiles widget specs to JSX and manages loading states.
 * Note: New code should use renderingSlice.startCompiling() instead.
 * @author Houston Zhang
 * @date 2025-10-15
 */

import { useState, useEffect } from 'react';
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';

export default function useWidgetCompiler(
  editedSpec,
  currentExample,
  resizingRef,
  latestWriteTokenRef,
  expectedSizeRef
) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [treeRoot, setTreeRoot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const compileAndWrite = async () => {
      try {
        const spec = editedSpec ? JSON.parse(editedSpec) : currentExample.spec;
        const jsx = compileWidgetSpecToJSX(spec);
        setGeneratedCode(jsx);
        setTreeRoot(spec?.widget || null);

        const isResizeWrite = !!resizingRef.current;
        if (isResizeWrite) {
          latestWriteTokenRef.current += 1;
          const token = latestWriteTokenRef.current;
          const w = spec?.widget?.width;
          const h = spec?.widget?.height;
          expectedSizeRef.current = typeof w === 'number' && typeof h === 'number' ? { width: Math.round(w), height: Math.round(h) } : null;
          setIsLoading(true);

          await fetch('/__write_widget', {
            method: 'POST',
            body: jsx,
            headers: { 'Content-Type': 'text/plain' }
          });

          if (!expectedSizeRef.current && latestWriteTokenRef.current === token) {
            setIsLoading(false);
          }
        } else {
          expectedSizeRef.current = null;
          setIsLoading(false);
          await fetch('/__write_widget', {
            method: 'POST',
            body: jsx,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      } catch (err) {
        setGeneratedCode(`// Error: ${err.message}`);
        setTreeRoot(null);
        setIsLoading(false);
      }
    };

    compileAndWrite();
  }, [editedSpec, currentExample, resizingRef, latestWriteTokenRef, expectedSizeRef]);

  return { generatedCode, treeRoot, isLoading, setIsLoading };
}
