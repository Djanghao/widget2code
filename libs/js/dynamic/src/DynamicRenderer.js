import * as Babel from '@babel/standalone';

export function renderDynamicComponent(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Component code is required and must be a string');
  }

  try {
    let processedCode = code.trim();

    processedCode = processedCode.replace(/import\s+React\s+from\s+['"]react['"];?\n?/g, '');
    processedCode = processedCode.replace(/import\s+.*from\s+['"][^'"]+['"];?\n?/g, '');
    processedCode = processedCode.replace(/export\s+default\s+/g, '');
    processedCode = processedCode.replace(/export\s+/g, '');

    if (processedCode.startsWith('```javascript') || processedCode.startsWith('```jsx')) {
      processedCode = processedCode.replace(/^```(javascript|jsx)\n/, '');
    }
    if (processedCode.startsWith('```')) {
      processedCode = processedCode.replace(/^```\n/, '');
    }
    if (processedCode.endsWith('```')) {
      processedCode = processedCode.replace(/\n```$/, '');
    }

    const transformed = Babel.transform(processedCode, {
      presets: ['react'],
      filename: 'dynamic-component.jsx'
    }).code;

    const componentFactory = new Function(
      'React',
      `${transformed}\nreturn Component;`
    );

    const Component = componentFactory(React);

    if (typeof Component !== 'function') {
      throw new Error('Generated code did not return a valid React component');
    }

    return Component;

  } catch (err) {
    console.error('[DynamicRenderer] Error:', err);
    throw new Error(`Failed to render dynamic component: ${err.message}`);
  }
}
