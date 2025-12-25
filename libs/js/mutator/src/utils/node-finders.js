import {
  collectContainers,
  collectComponents,
  collectNodes,
  collectLeafs,
  traverseDSL,
  isChartComponent,
} from "./tree-traversal.js";

export function findRandomContainer(node, depth = 0) {
  if (depth > 5) return null;

  const containers = collectContainers(node);
  if (containers.length === 0) return null;
  return containers[Math.floor(Math.random() * containers.length)];
}

export function findRandomComponent(node, componentType, depth = 0) {
  if (depth > 5) return null;

  const components = collectComponents(node, [], componentType);
  if (components.length === 0) return null;
  return components[Math.floor(Math.random() * components.length)];
}

export function findRandomNode(node, depth = 0) {
  if (depth > 5) return null;

  const nodes = collectNodes(node);
  if (nodes.length === 0) return null;
  return nodes[Math.floor(Math.random() * nodes.length)];
}

export function findRandomLeaf(node, depth = 0) {
  if (depth > 5) return null;

  const leafs = collectLeafs(node);
  if (leafs.length === 0) return null;
  return leafs[Math.floor(Math.random() * leafs.length)];
}

export function getParentNode(dsl, targetPath) {
  const pathParts = targetPath.match(/\d+/g);
  if (!pathParts || pathParts.length === 0) return null;

  if (pathParts.length === 1) {
    return dsl.widget.root;
  }

  let current = dsl.widget.root;
  let parent = null;

  for (let i = 0; i < pathParts.length - 1; i++) {
    parent = current;
    if (current.type === "container" && current.children) {
      const index = parseInt(pathParts[i]);
      current = current.children[index];
    } else {
      return null;
    }
  }

  return parent;
}

export function findBackgroundColorTarget(dsl) {
  if (Math.random() < 0.5 && dsl.widget) {
    return {
      path: "widget.backgroundColor",
      currentValue: dsl.widget.backgroundColor,
    };
  }

  const containers = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "container" && node.backgroundColor !== undefined) {
      containers.push({ path, value: node.backgroundColor });
    }
  });

  if (containers.length > 0) {
    const target = containers[Math.floor(Math.random() * containers.length)];
    return { path: target.path, currentValue: target.value };
  }

  return {
    path: "widget.backgroundColor",
    currentValue: dsl.widget?.backgroundColor,
  };
}

export function findTextColorTarget(dsl) {
  const textComponents = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (
      node.type === "leaf" &&
      node.component === "Text" &&
      node.props?.color
    ) {
      textComponents.push({ path, value: node.props.color });
    }
  });

  if (textComponents.length > 0) {
    const target =
      textComponents[Math.floor(Math.random() * textComponents.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findFontSizeTarget(dsl) {
  const textComponents = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (
      node.type === "leaf" &&
      node.component === "Text" &&
      node.props?.fontSize
    ) {
      textComponents.push({ path, value: node.props.fontSize });
    }
  });

  if (textComponents.length > 0) {
    const target =
      textComponents[Math.floor(Math.random() * textComponents.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findGapTarget(dsl) {
  const containers = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "container" && node.gap !== undefined) {
      containers.push({ path, value: node.gap });
    }
  });

  if (containers.length > 0) {
    const target = containers[Math.floor(Math.random() * containers.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findPaddingTarget(dsl) {
  if (Math.random() < 0.5 && dsl.widget?.padding !== undefined) {
    return { path: "widget.padding", currentValue: dsl.widget.padding };
  }

  const containers = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "container" && node.padding !== undefined) {
      containers.push({ path, value: node.padding });
    }
  });

  if (containers.length > 0) {
    const target = containers[Math.floor(Math.random() * containers.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "widget.padding", currentValue: dsl.widget?.padding };
}

export function findFlexTarget(dsl) {
  const nodes = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.flex !== undefined) {
      nodes.push({ path, value: node.flex });
    }
  });

  if (nodes.length > 0) {
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findDirectionTarget(dsl) {
  const containers = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "container" && node.direction) {
      containers.push({ path, value: node.direction });
    }
  });

  if (containers.length > 0) {
    const target = containers[Math.floor(Math.random() * containers.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findAlignmentTarget(dsl) {
  const containers = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "container") {
      if (node.alignMain) {
        containers.push({ path: `${path}.alignMain`, value: node.alignMain });
      }
      if (node.alignCross) {
        containers.push({ path: `${path}.alignCross`, value: node.alignCross });
      }
    }
  });

  if (containers.length > 0) {
    const target = containers[Math.floor(Math.random() * containers.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findSizeTarget(dsl) {
  const nodes = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.width) nodes.push({ path: `${path}.width`, value: node.width });
    if (node.height) nodes.push({ path: `${path}.height`, value: node.height });
  });

  if (nodes.length > 0) {
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findIconNameTarget(dsl) {
  const icons = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (
      node.type === "leaf" &&
      node.component === "Icon" &&
      node.props?.name
    ) {
      icons.push({ path, value: node.props.name });
    }
  });

  if (icons.length > 0) {
    const target = icons[Math.floor(Math.random() * icons.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findIconSizeTarget(dsl) {
  const icons = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (
      node.type === "leaf" &&
      node.component === "Icon" &&
      node.props?.size
    ) {
      icons.push({ path, value: node.props.size });
    }
  });

  if (icons.length > 0) {
    const target = icons[Math.floor(Math.random() * icons.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findContentTarget(dsl) {
  const textNodes = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "leaf" && node.component === "Text") {
      if (node.content)
        textNodes.push({ path: `${path}.content`, value: node.content });
      if (node.props?.children)
        textNodes.push({
          path: `${path}.props.children`,
          value: node.props.children,
        });
    }
  });

  if (textNodes.length > 0) {
    const target = textNodes[Math.floor(Math.random() * textNodes.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findChartDataTarget(dsl) {
  const charts = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (
      node.type === "leaf" &&
      isChartComponent(node.component) &&
      Array.isArray(node.props?.data) &&
      node.props.data.length > 0
    ) {
      const preview = `[${node.props.data.slice(0, 3).join(", ")}${
        node.props.data.length > 3 ? "..." : ""
      }]`;
      charts.push({ path: `${path}.props.data`, value: preview });
    }
  });

  if (charts.length > 0) {
    const target = charts[Math.floor(Math.random() * charts.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findChartColorTarget(dsl) {
  const charts = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (node.type === "leaf" && isChartComponent(node.component)) {
      if (node.props?.color)
        charts.push({ path: `${path}.props.color`, value: node.props.color });
      if (node.props?.colors) {
        const preview = `[${node.props.colors.slice(0, 3).join(", ")}${
          node.props.colors.length > 3 ? "..." : ""
        }]`;
        charts.push({ path: `${path}.props.colors`, value: preview });
      }
    }
  });

  if (charts.length > 0) {
    const target = charts[Math.floor(Math.random() * charts.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}

export function findChartOrientationTarget(dsl) {
  const charts = [];
  traverseDSL(dsl.widget?.root, (node, path) => {
    if (
      node.type === "leaf" &&
      node.component === "BarChart" &&
      node.props?.orientation
    ) {
      charts.push({ path, value: node.props.orientation });
    }
  });

  if (charts.length > 0) {
    const target = charts[Math.floor(Math.random() * charts.length)];
    return { path: target.path, currentValue: target.value };
  }

  return { path: "unknown", currentValue: null };
}
