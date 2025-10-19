import { compileWidgetSpecToJSX } from '@widget-factory/compiler';

export function compileWidgetSpec(spec) {
  try {
    const jsx = compileWidgetSpecToJSX(spec);
    const treeRoot = spec?.widget || null;

    return {
      success: true,
      jsx,
      treeRoot,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      jsx: `// Error: ${error.message}`,
      treeRoot: null,
      error
    };
  }
}

export async function writeWidgetFile(jsx) {
  try {
    const response = await fetch('/__write_widget', {
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
