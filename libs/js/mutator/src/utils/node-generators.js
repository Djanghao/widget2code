import { selectFromArray } from "./helpers.js";

export function createDefaultSeedDSL() {
  return {
    widget: {
      backgroundColor: "#ffffff",
      borderRadius: 20,
      padding: 16,
      aspectRatio: 1.0,
      root: {
        type: "container",
        direction: "col",
        gap: 8,
        children: [
          {
            type: "leaf",
            component: "Text",
            flex: 0,
            props: {
              fontSize: 16,
              color: "#333333",
              fontWeight: 600,
            },
            content: "Sample Widget",
          },
          {
            type: "leaf",
            component: "Icon",
            flex: 0,
            props: {
              name: "sf:star.fill",
              size: 20,
              color: "#FFCC00",
            },
          },
        ],
      },
    },
  };
}

export function generateRandomNode(palette) {
  if (Math.random() < 0.3) {
    return {
      type: "container",
      direction: selectFromArray(palette.containerValues.direction),
      gap: selectFromArray(palette.containerValues.gap),
      children: [],
    };
  } else {
    const allComponents = [
      ...palette.components.basic,
      ...palette.components.charts,
    ];
    const component = selectFromArray(allComponents);

    return {
      type: "leaf",
      component: component,
      props: generateDefaultProps(component, palette),
      flex: selectFromArray(palette.containerValues.flex),
    };
  }
}

export function generateDefaultProps(componentType, palette) {
  const chartComponents = palette.components.charts;

  if (componentType === "Text") {
    return {
      fontSize: selectFromArray(palette.textProps.fontSize),
      color: selectFromArray(palette.textProps.color),
    };
  } else if (componentType === "Icon") {
    const sfNames = palette.iconProps.sfNames;
    const name = selectFromArray(sfNames);
    return {
      name: `sf:${name}`,
      size: selectFromArray(palette.iconProps.size),
      color: selectFromArray(palette.iconProps.color),
    };
  } else if (chartComponents.includes(componentType)) {
    return generateChartProps(componentType, palette);
  }

  return {};
}

export function generateChartProps(chartType, palette) {
  const pattern = "small";
  const dataConfig = palette.dataPatterns[pattern];
  const count = selectFromArray(dataConfig.count);
  const range = selectFromArray(dataConfig.range);

  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(Math.floor(Math.random() * range));
  }

  const props = { data };

  if (
    chartType !== "Sparkline" &&
    chartType !== "ProgressBar" &&
    chartType !== "ProgressRing"
  ) {
    props.labels = generateLabels(count, palette);
  }

  if (chartType === "BarChart") {
    props.orientation = selectFromArray(
      palette.chartProps.barChart.orientation
    );
  } else if (chartType === "PieChart") {
    props.variant = selectFromArray(palette.chartProps.pieChart.variant);
  } else if (chartType === "ProgressBar" || chartType === "ProgressRing") {
    props.value = Math.floor(Math.random() * 100);
  }

  return props;
}

export function generateLabels(count, palette) {
  const labelCategories = Object.values(palette.textContent).flat();

  if (labelCategories.length === 0) {
    return Array.from({ length: count }, (_, i) => `Label ${i + 1}`);
  }

  const labels = [];
  for (let i = 0; i < count; i++) {
    const label = selectFromArray(labelCategories);
    labels.push(label !== null ? label : `Label ${i + 1}`);
  }

  return labels;
}
