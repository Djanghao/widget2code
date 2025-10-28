export function compileWidgetDSLToJSX(widgetDSL) {
  if (!widgetDSL.widget?.root) {
    throw new Error('Invalid widget spec: missing widget.root');
  }

  const imports = new Set();
  const lucideIcons = new Set();
  imports.add("import React from 'react';");
  imports.add("import { WidgetShell } from '@widget-factory/primitives';");

  const lines = [];
  const write = (line) => { lines.push(line); };
  const formatJsxPropValue = (value) =>
    typeof value === 'string' ? `=${JSON.stringify(value)}` : `={${JSON.stringify(value)}}`;

  function renderNode(node, depth = 0) {
    const indent = '  '.repeat(depth);

    if (node.type === 'container') {
      const { direction = 'row', gap = 8, padding, alignMain, alignCross, flex, width, height, backgroundColor, children = [] } = node;

      const styles = [];
      styles.push(`display: 'flex'`);
      styles.push(`flexDirection: '${direction === 'col' ? 'column' : 'row'}'`);
      if (gap) styles.push(`gap: ${gap}`);
      if (padding) styles.push(`padding: ${padding}`);
      if (flex !== undefined) styles.push(`flex: ${flex}`);
      if (width !== undefined) {
        if (typeof width === 'string') styles.push(`width: '${width}'`);
        else styles.push(`width: ${width}`);
      }
      if (height !== undefined) {
        if (typeof height === 'string') styles.push(`height: '${height}'`);
        else styles.push(`height: ${height}`);
      }
      if (backgroundColor) styles.push(`backgroundColor: '${backgroundColor}'`);
      if (alignMain) {
        const alignMap = { start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between' };
        styles.push(`justifyContent: '${alignMap[alignMain] || alignMain}'`);
      }
      if (alignCross) {
        const alignMap = { start: 'flex-start', end: 'flex-end', center: 'center' };
        styles.push(`alignItems: '${alignMap[alignCross] || alignCross}'`);
      }

      write(`${indent}<div style={{ ${styles.join(', ')} }}>`);
      children.forEach((child) => renderNode(child, depth + 1));
      write(`${indent}</div>`);
      return;
    }

    if (node.type === 'leaf') {
      const { component, props = {}, flex, width, height, content } = node;

      const componentName = component;
      if (!componentName) {
        throw new Error('Invalid leaf node: missing component (kind is deprecated).');
      }

      const isIcon = componentName === 'Icon';
      const iconName = isIcon ? props?.name : null;
      const isLucideIcon = iconName && typeof iconName === 'string' && iconName.startsWith('lucide:');

      if (isLucideIcon) {
        const lucideName = iconName.replace('lucide:', '');
        lucideIcons.add(lucideName);

        const mergedProps = { ...props };
        delete mergedProps.name;

        const propsCode = [];
        for (const [key, value] of Object.entries(mergedProps)) {
          if (typeof value === 'string') propsCode.push(`${key}="${value}"`);
          else propsCode.push(`${key}={${JSON.stringify(value)}}`);
        }
        if (flex !== undefined) {
          if (typeof flex === 'string') propsCode.push(`flex="${flex}"`);
          else propsCode.push(`flex={${JSON.stringify(flex)}}`);
        }
        if (width !== undefined) propsCode.push(`width={${JSON.stringify(width)}}`);
        if (height !== undefined) propsCode.push(`height={${JSON.stringify(height)}}`);

        const propsStr = propsCode.length > 0 ? ' ' + propsCode.join(' ') : '';
        write(`${indent}<${lucideName}${propsStr} />`);
        return;
      }

      imports.add(`import { ${componentName} } from '@widget-factory/primitives';`);

      const mergedProps = { ...props };

      const propsCode = [];
      for (const [key, value] of Object.entries(mergedProps)) {
        if (typeof value === 'string') propsCode.push(`${key}="${value}"`);
        else propsCode.push(`${key}={${JSON.stringify(value)}}`);
      }
      if (flex !== undefined) {
        if (typeof flex === 'string') propsCode.push(`flex="${flex}"`);
        else propsCode.push(`flex={${JSON.stringify(flex)}}`);
      }
      if (width !== undefined) propsCode.push(`width={${JSON.stringify(width)}}`);
      if (height !== undefined) propsCode.push(`height={${JSON.stringify(height)}}`);

      let childrenStr = '';
      if (content) {
        childrenStr = content;
      }

      const propsStr = propsCode.length > 0 ? ' ' + propsCode.join(' ') : '';
      if (childrenStr) write(`${indent}<${componentName}${propsStr}>${childrenStr}</${componentName}>`);
      else write(`${indent}<${componentName}${propsStr} />`);
      return;
    }
  }

  renderNode(widgetDSL.widget.root, 2);

  let importsCode = Array.from(imports).join('\n');
  if (lucideIcons.size > 0) {
    const lucideImport = `import { ${Array.from(lucideIcons).join(', ')} } from 'lucide-react';`;
    importsCode += '\n' + lucideImport;
  }

  const { backgroundColor, borderRadius, padding, width, height } = widgetDSL.widget;
  const shellProps = [];
  if (backgroundColor) shellProps.push(`backgroundColor="${backgroundColor}"`);
  if (borderRadius !== undefined) shellProps.push(`borderRadius={${borderRadius}}`);
  if (padding !== undefined) shellProps.push(`padding={${padding}}`);
  if (width !== undefined) shellProps.push(`width${formatJsxPropValue(width)}`);
  if (height !== undefined) shellProps.push(`height${formatJsxPropValue(height)}`);
  const shellPropsStr = shellProps.length > 0 ? ' ' + shellProps.join(' ') : '';

  const prefix = `${importsCode}\n\nexport default function Widget() {\n  return (\n    <WidgetShell${shellPropsStr}>\n`;
  const suffix = `\n    </WidgetShell>\n  );\n}\n`;

  const code = prefix + lines.join('\n') + suffix;
  return code;
}
