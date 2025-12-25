/**
 * Component schema and validation
 */

/**
 * Component structure:
 * {
 *   id: string - unique identifier
 *   domain: string - domain category (health, finance, etc.)
 *   category: string - component category (icon, text, metric, chart, composite, etc.)
 *   primitives: string[] - which primitive components are used
 *   node: object | array - WidgetDSL node or array of nodes
 *   metadata: {
 *     visualComplexity: "simple" | "medium" | "complex"
 *     semanticFit: string[] - which container semantics this fits
 *     size: "small" | "medium" | "large"
 *     tags: string[] - searchable tags
 *   }
 * }
 */

export const DOMAINS = [
  "health",
  "finance",
  "weather",
  "productivity",
  "media",
  "communication",
  "smart-home",
  "navigation",
  "utilities",
  "sports",
];

export const CATEGORIES = [
  "icon",
  "text",
  "metric",
  "chart",
  "image",
  "button",
  "checkbox",
  "divider",
  "indicator",
  "progress",
  "composite",
];

export const PRIMITIVES = [
  "Text",
  "Icon",
  "Button",
  "Image",
  "MapImage",
  "AppLogo",
  "Checkbox",
  "Divider",
  "Indicator",
  "Sparkline",
  "ProgressBar",
  "ProgressRing",
  "LineChart",
  "BarChart",
  "StackedBarChart",
  "RadarChart",
  "PieChart",
];

export const VISUAL_COMPLEXITY = ["simple", "medium", "complex"];

export const SEMANTIC_FIT = ["header", "content", "footer", "sidebar", "primary", "secondary"];

export const SIZE = ["small", "medium", "large"];

/**
 * Validate a component
 */
export function validateComponent(component) {
  const errors = [];

  // Required fields
  if (!component.id) errors.push("Missing 'id'");
  if (!component.domain) errors.push("Missing 'domain'");
  if (!component.category) errors.push("Missing 'category'");
  if (!component.primitives) errors.push("Missing 'primitives'");
  if (!component.node) errors.push("Missing 'node'");
  if (!component.metadata) errors.push("Missing 'metadata'");

  // Validate domain
  if (component.domain && !DOMAINS.includes(component.domain)) {
    errors.push(`Invalid domain '${component.domain}'`);
  }

  // Validate category
  if (component.category && !CATEGORIES.includes(component.category)) {
    errors.push(`Invalid category '${component.category}'`);
  }

  // Validate primitives is array
  if (component.primitives && !Array.isArray(component.primitives)) {
    errors.push("'primitives' must be an array");
  }

  // Validate node structure
  if (component.node) {
    if (Array.isArray(component.node)) {
      // Array of nodes (composite)
      component.node.forEach((n, idx) => {
        if (!n.type || !n.component) {
          errors.push(`node[${idx}] missing 'type' or 'component'`);
        }
      });
    } else {
      // Single node
      if (!component.node.type || !component.node.component) {
        errors.push("node missing 'type' or 'component'");
      }
    }
  }

  // Validate metadata
  if (component.metadata) {
    const { visualComplexity, semanticFit, size } = component.metadata;

    if (visualComplexity && !VISUAL_COMPLEXITY.includes(visualComplexity)) {
      errors.push(`Invalid visualComplexity '${visualComplexity}'`);
    }

    if (semanticFit && !Array.isArray(semanticFit)) {
      errors.push("'semanticFit' must be an array");
    }

    if (size && !SIZE.includes(size)) {
      errors.push(`Invalid size '${size}'`);
    }

    if (!Array.isArray(component.metadata.tags)) {
      errors.push("'metadata.tags' must be an array");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a component object with defaults
 */
export function createComponent(config) {
  return {
    id: config.id,
    domain: config.domain,
    category: config.category,
    primitives: config.primitives || [],
    node: config.node,
    metadata: {
      visualComplexity: config.metadata?.visualComplexity || "simple",
      semanticFit: config.metadata?.semanticFit || ["content"],
      size: config.metadata?.size || "medium",
      tags: config.metadata?.tags || [],
    },
  };
}
