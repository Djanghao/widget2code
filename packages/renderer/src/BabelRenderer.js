import * as Babel from '@babel/standalone';

export function renderJSXToComponent(jsxCode, dependencies = {}) {
  if (!jsxCode) {
    throw new Error('JSX code is required');
  }

  const {
    React,
    primitives = {},
    lucideReact = {}
  } = dependencies;

  if (!React) {
    throw new Error('React is required in dependencies');
  }

  try {
    let processedCode = jsxCode;

    processedCode = processedCode.replace(/import\s+React\s+from\s+['"]react['"];?\n?/g, '');
    processedCode = processedCode.replace(/import\s+\{[^}]*\}\s+from\s+['"]@widget-factory\/primitives['"];?\n?/g, '');
    processedCode = processedCode.replace(/import\s+\*\s+as\s+\w+\s+from\s+['"]@widget-factory\/primitives['"];?\n?/g, '');

    const lucideImportMatch = processedCode.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?\n?/);
    const lucideIcons = lucideImportMatch ? lucideImportMatch[1].split(',').map(s => s.trim()) : [];
    processedCode = processedCode.replace(/import\s+\{[^}]*\}\s+from\s+['"]lucide-react['"];?\n?/g, '');

    processedCode = processedCode.replace(/export\s+default\s+/g, '');

    const primitivesDestructure = Object.keys(primitives).length > 0
      ? `const { ${Object.keys(primitives).join(', ')} } = primitives;\n`
      : '';

    const lucideDestructure = lucideIcons.length > 0 && Object.keys(lucideReact).length > 0
      ? `const { ${lucideIcons.join(', ')} } = lucideReact;\n`
      : '';

    processedCode = primitivesDestructure + lucideDestructure + processedCode;

    const transformed = Babel.transform(processedCode, {
      presets: ['react'],
      filename: 'widget.jsx'
    }).code;

    const componentFactory = new Function(
      'React',
      'primitives',
      'lucideReact',
      `${transformed}\nreturn Widget;`
    );

    const Component = componentFactory(React, primitives, lucideReact);

    return Component;

  } catch (err) {
    throw new Error(`Failed to render JSX: ${err.message}`);
  }
}
