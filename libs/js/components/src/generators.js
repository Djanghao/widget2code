/**
 * Component generators - helper functions to create components for each primitive type
 */

import { createComponent } from "./schema.js";

/**
 * Generate an Icon component
 */
export function generateIcon(config) {
  const { id, domain, iconName, size = 24, color = "#000000", tags = [] } = config;

  return createComponent({
    id,
    domain,
    category: "icon",
    primitives: ["Icon"],
    node: {
      type: "leaf",
      component: "Icon",
      props: {
        name: iconName,
        size: size,
        color: color,
      },
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["header", "content", "sidebar"],
      size: size <= 20 ? "small" : size <= 32 ? "medium" : "large",
      tags: ["icon", ...tags],
    },
  });
}

/**
 * Generate a Text component
 */
export function generateText(config) {
  const {
    id,
    domain,
    content,
    fontSize = 16,
    fontWeight = 400,
    color = "#000000",
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "text",
    primitives: ["Text"],
    node: {
      type: "leaf",
      component: "Text",
      props: {
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
      },
      content: content,
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["header", "content"],
      size: fontSize <= 14 ? "small" : fontSize <= 24 ? "medium" : "large",
      tags: ["text", ...tags],
    },
  });
}

/**
 * Generate a Button component
 */
export function generateButton(config) {
  const {
    id,
    domain,
    label,
    variant = "primary",
    size = "medium",
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "button",
    primitives: ["Button"],
    node: {
      type: "leaf",
      component: "Button",
      props: {
        variant: variant,
        size: size,
      },
      content: label,
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["header", "footer", "content"],
      size: size,
      tags: ["button", "action", ...tags],
    },
  });
}

/**
 * Generate an Image component
 */
export function generateImage(config) {
  const { id, domain, width = 100, height = 100, borderRadius = 0, tags = [] } = config;

  return createComponent({
    id,
    domain,
    category: "image",
    primitives: ["Image"],
    node: {
      type: "leaf",
      component: "Image",
      width: width,
      height: height,
      props: {
        src: "https://via.placeholder.com/150",
        alt: "placeholder",
        ...(borderRadius && { borderRadius: borderRadius }),
      },
    },
    metadata: {
      visualComplexity: "medium",
      semanticFit: ["content", "sidebar"],
      size: width <= 60 ? "small" : width <= 120 ? "medium" : "large",
      tags: ["image", ...tags],
    },
  });
}

/**
 * Generate a MapImage component
 */
export function generateMapImage(config) {
  const { id, domain, width = 200, height = 150, borderRadius = 8, tags = [] } = config;

  return createComponent({
    id,
    domain,
    category: "image",
    primitives: ["MapImage"],
    node: {
      type: "leaf",
      component: "MapImage",
      width: width,
      height: height,
      props: {
        latitude: 37.7749,
        longitude: -122.4194,
        zoom: 13,
        borderRadius: borderRadius,
      },
    },
    metadata: {
      visualComplexity: "medium",
      semanticFit: ["content"],
      size: "large",
      tags: ["map", "location", ...tags],
    },
  });
}

/**
 * Generate an AppLogo component
 */
export function generateAppLogo(config) {
  const {
    id,
    domain,
    letter,
    size = 40,
    backgroundColor = "#007AFF",
    textColor = "#FFFFFF",
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "image",
    primitives: ["AppLogo"],
    node: {
      type: "leaf",
      component: "AppLogo",
      width: size,
      height: size,
      props: {
        letter: letter,
        backgroundColor: backgroundColor,
        textColor: textColor,
      },
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["header", "sidebar", "content"],
      size: size <= 30 ? "small" : size <= 50 ? "medium" : "large",
      tags: ["logo", "app", ...tags],
    },
  });
}

/**
 * Generate a Checkbox component
 */
export function generateCheckbox(config) {
  const { id, domain, checked = false, size = 20, tags = [] } = config;

  return createComponent({
    id,
    domain,
    category: "checkbox",
    primitives: ["Checkbox"],
    node: {
      type: "leaf",
      component: "Checkbox",
      props: {
        checked: checked,
        size: size,
      },
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["content"],
      size: "small",
      tags: ["checkbox", "input", ...tags],
    },
  });
}

/**
 * Generate a Divider component
 */
export function generateDivider(config) {
  const {
    id,
    domain,
    orientation = "horizontal",
    color = "#E5E5EA",
    thickness = 1,
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "divider",
    primitives: ["Divider"],
    node: {
      type: "leaf",
      component: "Divider",
      props: {
        orientation: orientation,
        color: color,
        thickness: thickness,
      },
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["content"],
      size: "small",
      tags: ["divider", "separator", ...tags],
    },
  });
}

/**
 * Generate an Indicator component
 */
export function generateIndicator(config) {
  const { id, domain, color = "#007AFF", width = 4, height = 40, tags = [] } = config;

  return createComponent({
    id,
    domain,
    category: "indicator",
    primitives: ["Indicator"],
    node: {
      type: "leaf",
      component: "Indicator",
      width: width,
      height: height,
      props: {
        color: color,
      },
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["sidebar", "content"],
      size: "small",
      tags: ["indicator", "status", ...tags],
    },
  });
}

/**
 * Generate a Sparkline component
 */
export function generateSparkline(config) {
  const {
    id,
    domain,
    data,
    width = 120,
    height = 40,
    color = "#007AFF",
    lineWidth = 2,
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "chart",
    primitives: ["Sparkline"],
    node: {
      type: "leaf",
      component: "Sparkline",
      width: width,
      height: height,
      props: {
        data: data,
        color: color,
        lineWidth: lineWidth,
      },
    },
    metadata: {
      visualComplexity: "medium",
      semanticFit: ["content"],
      size: "small",
      tags: ["chart", "sparkline", "trend", ...tags],
    },
  });
}

/**
 * Generate a ProgressBar component
 */
export function generateProgressBar(config) {
  const {
    id,
    domain,
    progress = 0.7,
    width = 200,
    height = 8,
    color = "#007AFF",
    backgroundColor = "#E5E5EA",
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "progress",
    primitives: ["ProgressBar"],
    node: {
      type: "leaf",
      component: "ProgressBar",
      width: width,
      height: height,
      props: {
        progress: progress,
        color: color,
        backgroundColor: backgroundColor,
      },
    },
    metadata: {
      visualComplexity: "simple",
      semanticFit: ["content"],
      size: "medium",
      tags: ["progress", "bar", ...tags],
    },
  });
}

/**
 * Generate a ProgressRing component
 */
export function generateProgressRing(config) {
  const {
    id,
    domain,
    value,
    goal,
    size = 100,
    color = "#007AFF",
    ringWidth = 10,
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "progress",
    primitives: ["ProgressRing"],
    node: {
      type: "leaf",
      component: "ProgressRing",
      width: size,
      height: size,
      props: {
        value: value,
        goal: goal,
        color: color,
        ringWidth: ringWidth,
      },
    },
    metadata: {
      visualComplexity: "medium",
      semanticFit: ["content"],
      size: size <= 80 ? "medium" : "large",
      tags: ["progress", "ring", "circular", ...tags],
    },
  });
}

/**
 * Generate a LineChart component
 */
export function generateLineChart(config) {
  const {
    id,
    domain,
    data,
    width = 200,
    height = 120,
    color = "#007AFF",
    lineWidth = 2,
    smooth = false,
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "chart",
    primitives: ["LineChart"],
    node: {
      type: "leaf",
      component: "LineChart",
      width: width,
      height: height,
      props: {
        data: data,
        color: color,
        lineWidth: lineWidth,
        smooth: smooth,
      },
    },
    metadata: {
      visualComplexity: "complex",
      semanticFit: ["content"],
      size: "large",
      tags: ["chart", "line", "time-series", ...tags],
    },
  });
}

/**
 * Generate a BarChart component
 */
export function generateBarChart(config) {
  const {
    id,
    domain,
    data,
    width = 200,
    height = 120,
    color = "#007AFF",
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "chart",
    primitives: ["BarChart"],
    node: {
      type: "leaf",
      component: "BarChart",
      width: width,
      height: height,
      props: {
        data: data,
        color: color,
      },
    },
    metadata: {
      visualComplexity: "complex",
      semanticFit: ["content"],
      size: "large",
      tags: ["chart", "bar", "comparison", ...tags],
    },
  });
}

/**
 * Generate a StackedBarChart component
 */
export function generateStackedBarChart(config) {
  const {
    id,
    domain,
    data,
    width = 200,
    height = 120,
    colors = ["#007AFF", "#34C759", "#FF9500"],
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "chart",
    primitives: ["StackedBarChart"],
    node: {
      type: "leaf",
      component: "StackedBarChart",
      width: width,
      height: height,
      props: {
        data: data,
        colors: colors,
      },
    },
    metadata: {
      visualComplexity: "complex",
      semanticFit: ["content"],
      size: "large",
      tags: ["chart", "stacked-bar", "composition", ...tags],
    },
  });
}

/**
 * Generate a RadarChart component
 */
export function generateRadarChart(config) {
  const {
    id,
    domain,
    data,
    labels,
    size = 150,
    color = "#007AFF",
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "chart",
    primitives: ["RadarChart"],
    node: {
      type: "leaf",
      component: "RadarChart",
      width: size,
      height: size,
      props: {
        data: data,
        labels: labels,
        color: color,
      },
    },
    metadata: {
      visualComplexity: "complex",
      semanticFit: ["content"],
      size: "large",
      tags: ["chart", "radar", "multi-dimensional", ...tags],
    },
  });
}

/**
 * Generate a PieChart component
 */
export function generatePieChart(config) {
  const {
    id,
    domain,
    data,
    labels,
    size = 120,
    colors = ["#007AFF", "#34C759", "#FF9500", "#FF3B30"],
    tags = [],
  } = config;

  return createComponent({
    id,
    domain,
    category: "chart",
    primitives: ["PieChart"],
    node: {
      type: "leaf",
      component: "PieChart",
      width: size,
      height: size,
      props: {
        data: data,
        labels: labels,
        colors: colors,
      },
    },
    metadata: {
      visualComplexity: "complex",
      semanticFit: ["content"],
      size: "medium",
      tags: ["chart", "pie", "proportions", ...tags],
    },
  });
}

/**
 * Generate a composite component (multiple nodes)
 */
export function generateComposite(config) {
  const { id, domain, nodes, visualComplexity = "medium", size = "medium", tags = [] } = config;

  // Collect all primitives used
  const primitives = new Set();
  nodes.forEach((node) => {
    if (node.component) {
      primitives.add(node.component);
    }
  });

  return createComponent({
    id,
    domain,
    category: "composite",
    primitives: Array.from(primitives),
    node: nodes,
    metadata: {
      visualComplexity: visualComplexity,
      semanticFit: ["content", "header"],
      size: size,
      tags: ["composite", ...tags],
    },
  });
}
