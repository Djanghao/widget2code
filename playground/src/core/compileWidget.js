import { compileWidgetSpecToJSX } from '@widget-factory/compiler';

function generateWidgetFileName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `Widget-${timestamp}-${random}.jsx`;
}

export function compileWidgetSpec(spec) {
  try {
    const jsx = compileWidgetSpecToJSX(spec);
    const treeRoot = spec?.widget || null;
    const fileName = generateWidgetFileName();

    return {
      success: true,
      jsx,
      fileName,
      treeRoot,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      jsx: `// Error: ${error.message}`,
      fileName: null,
      treeRoot: null,
      error
    };
  }
}

export async function writeWidgetFile(jsx, fileName) {
  try {
    const url = fileName ? `/__write_widget?file=${encodeURIComponent(fileName)}` : '/__write_widget';
    const response = await fetch(url, {
      method: 'POST',
      body: jsx,
      headers: { 'Content-Type': 'text/plain' }
    });

    if (!response.ok) {
      throw new Error(`Failed to write widget file: ${response.statusText}`);
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function cleanupWidgetFiles() {
  try {
    const response = await fetch('/__cleanup_widgets', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to cleanup widget files: ${response.statusText}`);
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}
