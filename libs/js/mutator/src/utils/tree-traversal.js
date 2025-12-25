export function traverseDSL(node, callback, path = "root", depth = 0) {
  if (depth > 10) return;
  if (!node) return;

  callback(node, path);

  if (node.type === "container" && node.children) {
    node.children.forEach((child, index) => {
      traverseDSL(child, callback, `${path}.children[${index}]`, depth + 1);
    });
  }
}

export function collectContainers(node, containers = []) {
  if (node && node.type === "container") {
    containers.push(node);
    if (node.children) {
      for (const child of node.children) {
        collectContainers(child, containers);
      }
    }
  }
  return containers;
}

export function collectComponents(node, components = [], componentType = null) {
  if (node) {
    if (
      node.type === "leaf" &&
      (!componentType || node.component === componentType)
    ) {
      components.push(node);
    }

    if (node.type === "container" && node.children) {
      for (const child of node.children) {
        collectComponents(child, components, componentType);
      }
    }
  }
  return components;
}

export function collectNodes(node, nodes = []) {
  if (node) {
    nodes.push(node);

    if (node.type === "container" && node.children) {
      for (const child of node.children) {
        collectNodes(child, nodes);
      }
    }
  }
  return nodes;
}

export function collectLeafs(node, leafs = []) {
  if (node) {
    if (node.type === "leaf") {
      leafs.push(node);
    } else if (node.type === "container" && node.children) {
      for (const child of node.children) {
        collectLeafs(child, leafs);
      }
    }
  }
  return leafs;
}

export function isChartComponent(component) {
  const chartComponents = [
    "BarChart",
    "LineChart",
    "PieChart",
    "RadarChart",
    "StackedBarChart",
    "Sparkline",
    "ProgressBar",
    "ProgressRing",
  ];
  return chartComponents.includes(component);
}

export function hasChartComponents(dsl) {
  let hasChart = false;
  traverseDSL(dsl?.widget?.root, (node) => {
    if (node.type === "leaf" && isChartComponent(node.component)) {
      hasChart = true;
    }
  });
  return hasChart;
}
