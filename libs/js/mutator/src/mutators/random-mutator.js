import {
  selectFromArray,
  adjustColor,
  traverseDSL,
  isChartComponent,
  hasChartComponents,
  findRandomContainer,
  findRandomComponent,
  findRandomNode,
  findRandomLeaf,
  getParentNode,
  findBackgroundColorTarget,
  findTextColorTarget,
  findFontSizeTarget,
  findGapTarget,
  findPaddingTarget,
  findFlexTarget,
  findDirectionTarget,
  findAlignmentTarget,
  findSizeTarget,
  findIconNameTarget,
  findIconSizeTarget,
  findContentTarget,
  findChartDataTarget,
  findChartColorTarget,
  findChartOrientationTarget,
  generateRandomNode,
  generateDefaultProps,
  generateLabels,
} from "../utils/index.js";

export class RandomMutator {
  constructor(palette) {
    this.palette = palette;
    this.lastMutation = null;
  }

  mutate(dsl) {
    const mutant = JSON.parse(JSON.stringify(dsl));
    const numMutations = Math.floor(Math.random() * 5) + 2;
    const mutationHistory = [];

    for (let i = 0; i < numMutations; i++) {
      let mutation;
      let attempts = 0;
      do {
        mutation = this.selectMutation();
        attempts++;
      } while (
        !this.isMutationApplicable(mutant, mutation.operation) &&
        attempts < 10
      );

      if (!this.isMutationApplicable(mutant, mutation.operation)) {
        continue;
      }

      const beforeState = this.captureMutationState(mutant, mutation);

      this.applyMutation(mutant, mutation);

      const afterState = this.captureMutationState(mutant, mutation);

      mutationHistory.push({
        step: mutationHistory.length + 1,
        mutation: mutation.operation,
        type: mutation.type,
        description: this.getMutationDescription(mutation),
        before: beforeState,
        after: afterState,
        change: this.describeChange(beforeState, afterState),
      });
    }

    return {
      dsl: mutant,
      mutations: mutationHistory,
    };
  }

  selectMutation() {
    const weights = this.palette.mutationWeights;

    const mutationsByType = {
      colorMutations: [
        "mutateBackgroundColor",
        "mutateTextColor",
        "mutateChartColors",
      ],
      sizeMutations: [
        "mutateFontSize",
        "mutateIconSize",
        "mutateSize",
        "mutateBorderRadius",
      ],
      layoutMutations: [
        "mutateGap",
        "mutatePadding",
        "mutateFlex",
        "mutateDirection",
        "mutateAlignment",
      ],
      contentMutations: ["mutateContent", "mutateChartData"],
      chartMutations: ["mutateChartOrientation", "mutateChartVariant"],
      structureMutations: [
        "addNode",
        "removeNode",
        "swapNodes",
        "changeComponentType",
        "mutateWidgetProperties",
        "duplicateNode",
        "nestNode",
        "flattenNode",
      ],
      styleMutations: [
        "mutateFontWeight",
        "mutateLineHeight",
        "mutateTextAlignment",
        "mutateWidgetAspectRatio",
      ],
    };

    const rand = Math.random();
    let cumulative = 0;
    let selectedType = null;

    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        selectedType = type;
        break;
      }
    }

    if (!selectedType) {
      selectedType = Object.keys(mutationsByType)[0];
    }

    const typeOperations = mutationsByType[selectedType];
    if (!typeOperations || typeOperations.length === 0) {
      return { type: "colorMutations", operation: "mutateBackgroundColor" };
    }

    const operation =
      typeOperations[Math.floor(Math.random() * typeOperations.length)];

    return { type: selectedType, operation };
  }

  isMutationApplicable(dsl, operation) {
    const chartMutations = [
      "mutateChartData",
      "mutateChartColors",
      "mutateChartOrientation",
      "mutateChartVariant",
    ];
    if (chartMutations.includes(operation)) {
      return hasChartComponents(dsl);
    }
    return true;
  }

  applyMutation(dsl, mutation) {
    switch (mutation.operation) {
      case "mutateBackgroundColor":
        this.mutateBackgroundColor(dsl);
        break;
      case "mutateTextColor":
        this.mutateTextColor(dsl);
        break;
      case "mutateFontSize":
        this.mutateFontSize(dsl);
        break;
      case "mutateGap":
        this.mutateGap(dsl);
        break;
      case "mutatePadding":
        this.mutatePadding(dsl);
        break;
      case "mutateFlex":
        this.mutateFlex(dsl);
        break;
      case "mutateDirection":
        this.mutateDirection(dsl);
        break;
      case "mutateAlignment":
        this.mutateAlignment(dsl);
        break;
      case "mutateBorderRadius":
        this.mutateBorderRadius(dsl);
        break;
      case "mutateSize":
        this.mutateSize(dsl);
        break;
      case "mutateIconName":
        this.mutateIconName(dsl);
        break;
      case "mutateIconSize":
        this.mutateIconSize(dsl);
        break;
      case "mutateContent":
        this.mutateContent(dsl);
        break;
      case "mutateChartData":
        this.mutateChartData(dsl);
        break;
      case "mutateChartColors":
        this.mutateChartColors(dsl);
        break;
      case "mutateChartOrientation":
        this.mutateChartOrientation(dsl);
        break;
      case "addNode":
        this.addNode(dsl);
        break;
      case "removeNode":
        this.removeNode(dsl);
        break;
      case "swapNodes":
        this.swapNodes(dsl);
        break;
      case "changeComponentType":
        this.changeComponentType(dsl);
        break;
      case "mutateWidgetProperties":
        this.mutateWidgetProperties(dsl);
        break;
      case "mutateFontWeight":
        this.mutateFontWeight(dsl);
        break;
      case "mutateLineHeight":
        this.mutateLineHeight(dsl);
        break;
      case "mutateWidgetAspectRatio":
        this.mutateWidgetAspectRatio(dsl);
        break;
      case "duplicateNode":
        this.duplicateNode(dsl);
        break;
      case "nestNode":
        this.nestNode(dsl);
        break;
      case "flattenNode":
        this.flattenNode(dsl);
        break;
      case "mutateChartVariant":
        this.mutateChartVariant(dsl);
        break;
      case "mutateTextAlignment":
        this.mutateTextAlignment(dsl);
        break;
    }
  }

  getMutationDescription(mutation) {
    const descriptions = {
      mutateBackgroundColor: "Changed background color",
      mutateTextColor: "Changed text color",
      mutateFontSize: "Changed font size",
      mutateGap: "Changed gap spacing",
      mutatePadding: "Changed padding",
      mutateFlex: "Changed flex property",
      mutateDirection: "Changed layout direction",
      mutateAlignment: "Changed alignment",
      mutateBorderRadius: "Changed border radius",
      mutateSize: "Changed component size",
      mutateIconName: "Changed icon",
      mutateIconSize: "Changed icon size",
      mutateContent: "Changed text content",
      mutateChartData: "Generated new chart data",
      mutateChartColors: "Changed chart colors",
      mutateChartOrientation: "Changed chart orientation",
      addNode: "Added new component",
      removeNode: "Removed component",
      swapNodes: "Swapped component positions",
      changeComponentType: "Changed component type",
      mutateWidgetProperties: "Changed widget properties",
      mutateFontWeight: "Changed font weight",
      mutateLineHeight: "Changed line height",
      mutateTextAlignment: "Changed text alignment",
      mutateWidgetAspectRatio: "Changed widget aspect ratio",
      duplicateNode: "Duplicated component",
      nestNode: "Nested component in container",
      flattenNode: "Flattened container",
      mutateChartVariant: "Changed chart variant",
    };

    return descriptions[mutation.operation] || "Applied mutation";
  }

  captureMutationState(dsl, mutation) {
    const targetInfo = this.findMutationTarget(dsl, mutation);

    switch (mutation.operation) {
      case "mutateBackgroundColor":
      case "mutateTextColor":
      case "mutateFontSize":
      case "mutateGap":
      case "mutatePadding":
      case "mutateFlex":
      case "mutateDirection":
      case "mutateAlignment":
      case "mutateSize":
      case "mutateIconName":
      case "mutateIconSize":
      case "mutateContent":
      case "mutateChartData":
      case "mutateChartColors":
      case "mutateChartOrientation":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "mutateBorderRadius":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      case "addNode":
        return { action: "add", parent: targetInfo.path };
      case "removeNode":
        return { action: "remove", target: targetInfo.path };
      case "swapNodes":
        return { action: "swap", targets: targetInfo.paths };
      case "changeComponentType":
        return { target: targetInfo.path, from: targetInfo.currentValue };
      case "mutateWidgetProperties":
        return { target: targetInfo.path, value: targetInfo.currentValue };
      default:
        return {};
    }
  }

  findMutationTarget(dsl, mutation) {
    switch (mutation.operation) {
      case "mutateBackgroundColor":
        return findBackgroundColorTarget(dsl);
      case "mutateTextColor":
        return findTextColorTarget(dsl);
      case "mutateFontSize":
        return findFontSizeTarget(dsl);
      case "mutateGap":
        return findGapTarget(dsl);
      case "mutatePadding":
        return findPaddingTarget(dsl);
      case "mutateFlex":
        return findFlexTarget(dsl);
      case "mutateDirection":
        return findDirectionTarget(dsl);
      case "mutateAlignment":
        return findAlignmentTarget(dsl);
      case "mutateBorderRadius":
        return {
          path: "widget.borderRadius",
          currentValue: dsl.widget?.borderRadius,
        };
      case "mutateSize":
        return findSizeTarget(dsl);
      case "mutateIconName":
        return findIconNameTarget(dsl);
      case "mutateIconSize":
        return findIconSizeTarget(dsl);
      case "mutateContent":
        return findContentTarget(dsl);
      case "mutateChartData":
        return findChartDataTarget(dsl);
      case "mutateChartColors":
        return findChartColorTarget(dsl);
      case "mutateChartOrientation":
        return findChartOrientationTarget(dsl);
      case "swapNodes":
        return { paths: ["unknown", "unknown"] };
      case "addNode":
        return { path: "unknown" };
      case "removeNode":
        return { path: "unknown" };
      case "changeComponentType":
        const leaf = findRandomLeaf(dsl.widget?.root);
        return leaf
          ? { path: "unknown", currentValue: leaf.component }
          : { path: "unknown", currentValue: null };
      case "mutateWidgetProperties":
        return { path: "widget", currentValue: dsl.widget };
      case "mutateFontWeight":
        return findTextColorTarget(dsl);
      case "mutateLineHeight":
        return findTextColorTarget(dsl);
      case "mutateWidgetAspectRatio":
        return {
          path: "widget.aspectRatio",
          currentValue: dsl.widget?.aspectRatio,
        };
      case "duplicateNode":
        return { path: "unknown" };
      case "nestNode":
        return { path: "unknown" };
      default:
        return { path: "unknown", currentValue: null };
    }
  }

  describeChange(before, after) {
    if (before.action === "add") {
      return `Added new component to ${before.parent}`;
    }
    if (before.action === "remove") {
      return `Removed component at ${before.target}`;
    }
    if (before.action === "swap") {
      return `Swapped components at ${before.targets.join(" and ")}`;
    }
    if (before.from) {
      return `Changed component type from "${before.from}" to "${after.value}" at ${before.target}`;
    }

    const beforeValue = before.value;
    const afterValue = after.value;

    if (beforeValue !== afterValue) {
      return `${before.target}: "${beforeValue}" -> "${afterValue}"`;
    }

    return "Applied change";
  }

  mutateBackgroundColor(dsl) {
    const colors = this.palette.containerValues.backgroundColor;
    const newColor = selectFromArray(colors);

    if (Math.random() < 0.5 && dsl.widget) {
      dsl.widget.backgroundColor = newColor;
    } else {
      const container = findRandomContainer(dsl.widget?.root);
      if (container) {
        container.backgroundColor = newColor;
      }
    }
  }

  mutateTextColor(dsl) {
    const colors = this.palette.textProps.color;
    const newColor = selectFromArray(colors);

    const textComponent = findRandomComponent(dsl.widget?.root, "Text");
    if (textComponent && textComponent.props) {
      textComponent.props.color = newColor;
    }
  }

  mutateFontSize(dsl) {
    const fontSizes = this.palette.textProps.fontSize;
    const newSize = selectFromArray(fontSizes);

    const textComponent = findRandomComponent(dsl.widget?.root, "Text");
    if (textComponent && textComponent.props) {
      textComponent.props.fontSize = newSize;
    }
  }

  mutateGap(dsl) {
    const gaps = this.palette.containerValues.gap;
    const newGap = selectFromArray(gaps);

    const container = findRandomContainer(dsl.widget?.root);
    if (container) {
      container.gap = newGap;
    }
  }

  mutatePadding(dsl) {
    const paddings = this.palette.containerValues.padding;
    const newPadding = selectFromArray(paddings);

    if (Math.random() < 0.5 && dsl.widget) {
      dsl.widget.padding = newPadding;
    } else {
      const container = findRandomContainer(dsl.widget?.root);
      if (container) {
        container.padding = newPadding;
      }
    }
  }

  mutateFlex(dsl) {
    const flexValues = this.palette.containerValues.flex;
    const newFlex = selectFromArray(flexValues);

    const randomNode = findRandomNode(dsl.widget?.root);
    if (randomNode) {
      randomNode.flex = newFlex;
    }
  }

  mutateDirection(dsl) {
    const directions = this.palette.containerValues.direction;
    const newDirection = selectFromArray(directions);

    const container = findRandomContainer(dsl.widget?.root);
    if (container) {
      container.direction = newDirection;
    }
  }

  mutateAlignment(dsl) {
    if (Math.random() < 0.5) {
      const alignMains = this.palette.containerValues.alignMain;
      const newAlignMain = selectFromArray(alignMains);
      const container = findRandomContainer(dsl.widget?.root);
      if (container) {
        container.alignMain = newAlignMain;
      }
    } else {
      const alignCrosses = this.palette.containerValues.alignCross;
      const newAlignCross = selectFromArray(alignCrosses);
      const container = findRandomContainer(dsl.widget?.root);
      if (container) {
        container.alignCross = newAlignCross;
      }
    }
  }

  mutateBorderRadius(dsl) {
    const borderRadii = this.palette.widgetProperties.borderRadius;
    const newBorderRadius = selectFromArray(borderRadii);

    if (dsl.widget) {
      dsl.widget.borderRadius = newBorderRadius;
    }
  }

  mutateSize(dsl) {
    const sizes = [100, 150, 200, 250, 300, 350, 400];
    const newSize = selectFromArray(sizes);

    const randomNode = findRandomNode(dsl.widget?.root);
    if (randomNode) {
      if (Math.random() < 0.5) {
        randomNode.width = newSize;
      } else {
        randomNode.height = newSize;
      }
    }
  }

  mutateIconName(dsl) {
    const sfNames = this.palette.iconProps.sfNames;
    const lucideNames = this.palette.iconProps.lucideNames;

    let newName;
    if (Math.random() < 0.7) {
      const name = selectFromArray(sfNames);
      newName = `sf:${name}`;
    } else {
      const name = selectFromArray(lucideNames);
      newName = `lucide:${name}`;
    }

    const iconComponent = findRandomComponent(dsl.widget?.root, "Icon");
    if (iconComponent && iconComponent.props) {
      iconComponent.props.name = newName;
    }
  }

  mutateIconSize(dsl) {
    const sizes = this.palette.iconProps.size;
    const newSize = selectFromArray(sizes);

    const iconComponent = findRandomComponent(dsl.widget?.root, "Icon");
    if (iconComponent && iconComponent.props) {
      iconComponent.props.size = newSize;
    }
  }

  mutateContent(dsl) {
    const contentCategories = Object.keys(this.palette.textContent);
    if (contentCategories.length === 0) return;

    const category = selectFromArray(contentCategories);
    const contents = this.palette.textContent[category];
    if (!contents || contents.length === 0) return;

    const newContent = selectFromArray(contents);
    if (newContent === null) return;

    const textComponent = findRandomComponent(dsl.widget?.root, "Text");
    if (textComponent) {
      if (Math.random() < 0.5 && textComponent.props) {
        textComponent.props.children = newContent;
      } else {
        textComponent.content = newContent;
      }
    }
  }

  mutateChartData(dsl) {
    const chartTypes = [
      "BarChart",
      "LineChart",
      "PieChart",
      "Sparkline",
      "ProgressBar",
      "ProgressRing",
    ];
    const chartType = selectFromArray(chartTypes);

    const chartComponent = findRandomComponent(dsl.widget?.root, chartType);
    if (chartComponent && chartComponent.props) {
      const pattern = Math.random() < 0.5 ? "small" : "medium";
      const dataConfig = this.palette.dataPatterns[pattern];
      const count = selectFromArray(dataConfig.count);
      const range = selectFromArray(dataConfig.range);

      const newData = [];
      for (let i = 0; i < count; i++) {
        newData.push(Math.floor(Math.random() * range));
      }

      chartComponent.props.data = newData;

      if (
        chartType !== "Sparkline" &&
        chartType !== "ProgressBar" &&
        chartType !== "ProgressRing"
      ) {
        const labels = generateLabels(count, this.palette);
        chartComponent.props.labels = labels;
      }
    }
  }

  mutateChartColors(dsl) {
    const colors = [
      "#007bff",
      "#28a745",
      "#dc3545",
      "#ffc107",
      "#17a2b8",
      "#6f42c1",
      "#fd7e14",
      "#20c997",
    ];
    const newColor = selectFromArray(colors);

    const chartTypes = ["BarChart", "LineChart", "PieChart", "Sparkline"];
    const chartType = selectFromArray(chartTypes);

    const chartComponent = findRandomComponent(dsl.widget?.root, chartType);
    if (chartComponent && chartComponent.props) {
      if (Math.random() < 0.5) {
        chartComponent.props.color = newColor;
      } else {
        chartComponent.props.colors = [newColor, adjustColor(newColor)];
      }
    }
  }

  mutateChartOrientation(dsl) {
    const chartComponent = findRandomComponent(dsl.widget?.root, "BarChart");
    if (chartComponent && chartComponent.props) {
      const orientations = ["vertical", "horizontal"];
      const currentOrientation = chartComponent.props.orientation || "vertical";
      const newOrientation = orientations.find((o) => o !== currentOrientation);
      chartComponent.props.orientation = newOrientation;
    }
  }

  addNode(dsl) {
    const container = findRandomContainer(dsl.widget?.root);
    if (container && container.children && container.children.length < 10) {
      const newNode = generateRandomNode(this.palette);
      const insertIndex = Math.floor(
        Math.random() * (container.children.length + 1)
      );
      container.children.splice(insertIndex, 0, newNode);
    }
  }

  removeNode(dsl) {
    const container = findRandomContainer(dsl.widget?.root);
    if (container && container.children && container.children.length > 1) {
      const removeIndex = Math.floor(Math.random() * container.children.length);
      container.children.splice(removeIndex, 1);
    }
  }

  swapNodes(dsl) {
    const container = findRandomContainer(dsl.widget?.root);
    if (container && container.children && container.children.length >= 2) {
      const index1 = Math.floor(Math.random() * container.children.length);
      let index2 = Math.floor(Math.random() * container.children.length);
      while (index2 === index1) {
        index2 = Math.floor(Math.random() * container.children.length);
      }

      const temp = container.children[index1];
      container.children[index1] = container.children[index2];
      container.children[index2] = temp;
    }
  }

  changeComponentType(dsl) {
    const allComponents = [
      ...this.palette.components.basic,
      ...this.palette.components.charts,
    ];
    const newComponent = selectFromArray(allComponents);

    const leafComponent = findRandomLeaf(dsl.widget?.root);
    if (leafComponent) {
      leafComponent.component = newComponent;
      leafComponent.props = generateDefaultProps(newComponent, this.palette);
    }
  }

  mutateWidgetProperties(dsl) {
    if (!dsl.widget) return;

    const mutations = [
      () => {
        const aspectRatios = this.palette.widgetProperties.aspectRatio;
        dsl.widget.aspectRatio = selectFromArray(aspectRatios);
      },
      () => {
        const widths = this.palette.widgetProperties.width;
        dsl.widget.width = selectFromArray(widths);
      },
      () => {
        const heights = this.palette.widgetProperties.height;
        dsl.widget.height = selectFromArray(heights);
      },
    ];

    const mutation = selectFromArray(mutations);
    mutation();
  }

  mutateFontWeight(dsl) {
    const textComponents = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (node.type === "leaf" && node.component === "Text" && node.props) {
        textComponents.push({ path, node });
      }
    });

    if (textComponents.length > 0) {
      const target = selectFromArray(textComponents);
      const fontWeights = this.palette.textProps.fontWeight;
      const newWeight = selectFromArray(fontWeights);
      target.node.props.fontWeight = newWeight;
    }
  }

  mutateLineHeight(dsl) {
    const textComponents = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (node.type === "leaf" && node.component === "Text" && node.props) {
        textComponents.push({ path, node });
      }
    });

    if (textComponents.length > 0) {
      const target = selectFromArray(textComponents);
      const lineHeights = this.palette.textProps.lineHeight;
      const newLineHeight = selectFromArray(lineHeights);
      target.node.props.lineHeight = newLineHeight;
    }
  }

  mutateTextAlignment(dsl) {
    const textComponents = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (node.type === "leaf" && node.component === "Text" && node.props) {
        textComponents.push({ path, node });
      }
    });

    if (textComponents.length > 0) {
      const target = selectFromArray(textComponents);
      const alignments = this.palette.textProps.align;
      const newAlign = selectFromArray(alignments);
      target.node.props.align = newAlign;
    }
  }

  mutateWidgetAspectRatio(dsl) {
    if (!dsl.widget) return;

    const aspectRatios = this.palette.widgetProperties.aspectRatio;
    const newAspectRatio = selectFromArray(aspectRatios);
    dsl.widget.aspectRatio = newAspectRatio;
  }

  mutateChartVariant(dsl) {
    const charts = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (
        node.type === "leaf" &&
        (node.component === "PieChart" || node.component === "ProgressBar") &&
        node.props
      ) {
        charts.push({ path, node });
      }
    });

    if (charts.length > 0) {
      const target = selectFromArray(charts);

      if (target.node.component === "PieChart") {
        const variants = this.palette.chartProps.pieChart.variant;
        target.node.props.variant = selectFromArray(variants);
      } else if (target.node.component === "ProgressBar") {
        const variants = this.palette.chartProps.progressBar.variant;
        target.node.props.variant = selectFromArray(variants);
      }
    }
  }

  duplicateNode(dsl) {
    const nodes = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (node.type === "leaf") {
        nodes.push({ path, node, parent: getParentNode(dsl, path) });
      }
    });

    if (nodes.length > 0) {
      const target = selectFromArray(nodes);
      const duplicatedNode = JSON.parse(JSON.stringify(target.node));

      if (target.parent && Array.isArray(target.parent.children)) {
        const index = target.parent.children.indexOf(target.node);
        target.parent.children.splice(index + 1, 0, duplicatedNode);
      }
    }
  }

  nestNode(dsl) {
    const leafNodes = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (node.type === "leaf") {
        leafNodes.push({ path, node, parent: getParentNode(dsl, path) });
      }
    });

    if (leafNodes.length >= 2) {
      const target = selectFromArray(leafNodes);

      const newContainer = {
        type: "container",
        direction: selectFromArray(this.palette.containerValues.direction),
        gap: selectFromArray(this.palette.containerValues.gap),
        children: [target.node],
      };

      if (target.parent && Array.isArray(target.parent.children)) {
        const index = target.parent.children.indexOf(target.node);
        target.parent.children[index] = newContainer;
      }
    }
  }

  flattenNode(dsl) {
    const containers = [];
    traverseDSL(dsl.widget?.root, (node, path) => {
      if (
        node.type === "container" &&
        Array.isArray(node.children) &&
        node.children.length === 1
      ) {
        containers.push({ path, node, parent: getParentNode(dsl, path) });
      }
    });

    if (containers.length > 0) {
      const target = selectFromArray(containers);
      const childNode = target.node.children[0];

      if (target.parent && Array.isArray(target.parent.children)) {
        const index = target.parent.children.indexOf(target.node);
        target.parent.children[index] = childNode;
      }
    }
  }
}
