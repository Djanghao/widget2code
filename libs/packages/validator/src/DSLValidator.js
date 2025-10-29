import { AVAILABLE_COMPONENTS } from '@widget-factory/primitives/components';

const VALID_COMPONENTS = new Set(AVAILABLE_COMPONENTS);

export function validateWidgetDSL(spec) {
  const errors = [];
  const warnings = [];

  if (!spec) {
    return { valid: false, errors: ['Spec is null or undefined'], warnings: [], canCompile: false };
  }

  if (typeof spec !== 'object' || Array.isArray(spec)) {
    return { valid: false, errors: ['Spec must be an object'], warnings: [], canCompile: false };
  }

  if (!spec.widget) {
    errors.push('Missing required field: widget');
    return { valid: false, errors, warnings, canCompile: false };
  }

  if (!spec.widget.root) {
    errors.push('Missing required field: widget.root (will throw: "Invalid widget spec: missing widget.root")');
    return { valid: false, errors, warnings, canCompile: false };
  }

  function validateNode(node, path) {
    if (!node || typeof node !== 'object') {
      errors.push(`${path}: node must be an object`);
      return;
    }

    if (!node.type) {
      errors.push(`${path}: missing required field "type"`);
      return;
    }

    if (node.type !== 'container' && node.type !== 'leaf') {
      errors.push(`${path}: type must be "container" or "leaf", got "${node.type}"`);
      return;
    }

    if (node.type === 'container') {
      if (!node.children) {
        errors.push(`${path}: container must have "children" array`);
      } else if (!Array.isArray(node.children)) {
        errors.push(`${path}: children must be an array`);
      } else {
        node.children.forEach((child, i) => {
          validateNode(child, `${path}.children[${i}]`);
        });
      }
    }

    if (node.type === 'leaf') {
      if (!node.component) {
        errors.push(`${path}: leaf must have "component" field (will throw: "Invalid leaf node: missing component")`);
        return;
      }

      const isLucideIcon = node.component === 'Icon' &&
                          node.props?.name &&
                          typeof node.props.name === 'string' &&
                          node.props.name.startsWith('lucide:');

      const isSFIcon = node.component === 'Icon' &&
                       node.props?.name &&
                       typeof node.props.name === 'string' &&
                       node.props.name.startsWith('sf:');

      if (!isLucideIcon && !isSFIcon && !VALID_COMPONENTS.has(node.component)) {
        warnings.push(`${path}: unknown component "${node.component}" (not in @widget-factory/primitives)`);
      }

      if (node.component === 'Icon') {
        if (!node.props || !node.props.name) {
          errors.push(`${path}: Icon component requires props.name`);
        }
      }

      if (node.component === 'Image') {
        if (!node.props || !node.props.src) {
          errors.push(`${path}: Image component requires props.src`);
        }
      }
    }
  }

  validateNode(spec.widget.root, 'widget.root');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canCompile: errors.length === 0
  };
}

export function fixWidgetDSL(spec) {
  if (!spec || !spec.widget || !spec.widget.root) {
    return { fixed: spec, changes: [] };
  }

  const changes = [];
  const fixedSpec = JSON.parse(JSON.stringify(spec));

  function fixNode(node, path) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'container') {
      if (!node.children || !Array.isArray(node.children)) {
        node.children = [];
        changes.push(`${path}: added empty children array`);
      } else {
        node.children.forEach((child, i) => {
          fixNode(child, `${path}.children[${i}]`);
        });
      }
    }

    if (node.type === 'leaf') {
      if (!node.component) {
        node.component = 'Text';
        node.content = '[Missing Component]';
        changes.push(`${path}: added placeholder Text component`);
        return;
      }

      const isLucideIcon = node.component === 'Icon' &&
                          node.props?.name &&
                          typeof node.props.name === 'string' &&
                          node.props.name.startsWith('lucide:');

      const isSFIcon = node.component === 'Icon' &&
                       node.props?.name &&
                       typeof node.props.name === 'string' &&
                       node.props.name.startsWith('sf:');

      if (!isLucideIcon && !isSFIcon && !VALID_COMPONENTS.has(node.component)) {
        const originalComponent = node.component;
        node.component = 'Text';
        node.content = `[Unknown: ${originalComponent}]`;
        changes.push(`${path}: replaced unknown component "${originalComponent}" with Text placeholder`);
      }

      if (node.component === 'Icon') {
        if (!node.props || !node.props.name) {
          node.component = 'Text';
          node.content = '[Icon Missing Name]';
          changes.push(`${path}: replaced Icon with missing name with Text placeholder`);
        }
      }

      if (node.component === 'Image') {
        if (!node.props || !node.props.src) {
          node.component = 'Text';
          node.content = '[Image Missing Src]';
          changes.push(`${path}: replaced Image with missing src with Text placeholder`);
        }
      }
    }
  }

  fixNode(fixedSpec.widget.root, 'widget.root');

  return {
    fixed: fixedSpec,
    changes
  };
}

export function validateAndFix(spec) {
  const validation = validateWidgetDSL(spec);

  if (validation.canCompile && validation.warnings.length === 0) {
    return {
      ...validation,
      fixed: spec,
      changes: []
    };
  }

  const { fixed, changes } = fixWidgetDSL(spec);
  const revalidation = validateWidgetDSL(fixed);

  return {
    original: validation,
    fixed,
    changes,
    canCompile: revalidation.canCompile,
    errors: revalidation.errors,
    warnings: [...validation.warnings, ...revalidation.warnings]
  };
}
