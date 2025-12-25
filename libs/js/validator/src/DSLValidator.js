/**
 * @file DSLValidator.js
 * @description WidgetDSL specification validator with auto-fix capabilities
 * @author Houston Zhang
 * @date 2025-10-29
 */

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

    // Auto-fix invalid type values
    if (node.type !== 'container' && node.type !== 'leaf') {
      const originalType = node.type;
      // Check if node has children
      const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;

      if (hasChildren) {
        // Convert to container to preserve nested content
        node.type = 'container';
        changes.push(`${path}: auto-converted invalid type "${originalType}" to container (has ${node.children.length} children)`);
      } else if (originalType === 'divider') {
        // Special case: divider without children becomes Divider component
        node.type = 'leaf';
        node.component = 'Divider';
        if (!node.props) node.props = {};
        delete node.children;
        changes.push(`${path}: auto-converted type "divider" to leaf with Divider component`);
      } else {
        // Any other invalid type becomes Placeholder
        node.type = 'leaf';
        node.component = 'Placeholder';
        if (!node.props) node.props = {};
        delete node.children;
        changes.push(`${path}: auto-converted invalid type "${originalType}" to leaf with Placeholder component`);
      }
    }

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
        node.component = 'Placeholder';

        // Preserve all visual/layout props for Placeholder
        // Keep: backgroundColor, borderRadius, padding, margin, border, opacity, width, height, flex
        // Remove: component-specific props that don't make sense for Placeholder
        if (node.props) {
          const visualProps = [
            'backgroundColor', 'borderRadius', 'padding', 'margin',
            'border', 'opacity', 'color'
          ];
          const propsToKeep = {};
          for (const key of visualProps) {
            if (node.props[key] !== undefined) {
              propsToKeep[key] = node.props[key];
            }
          }
          node.props = propsToKeep;
        }

        // Don't show label - keep visual fidelity
        delete node.content;

        changes.push(`${path}: replaced unknown component "${originalComponent}" with Placeholder`);
      }

      if (node.component === 'Icon') {
        if (!node.props || !node.props.name) {
          node.component = 'Placeholder';

          // Keep visual props if any
          if (node.props) {
            const { name, ...visualProps } = node.props;
            node.props = visualProps;
          }

          delete node.content;
          changes.push(`${path}: replaced Icon with missing name with Placeholder`);
        }
      }

      if (node.component === 'Image') {
        if (!node.props || !node.props.src) {
          node.component = 'Placeholder';

          // Keep visual props but remove invalid image props
          if (node.props) {
            const { src, url, ...visualProps } = node.props;
            node.props = visualProps;
          }

          delete node.content;
          changes.push(`${path}: replaced Image with missing src with Placeholder`);
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
