import { selectFromArray, isChartComponent } from "../utils/index.js";

export class ThemeMutator {
  constructor(palette) {
    this.palette = palette;
  }

  applyControlledMutation(dsl, options = {}) {
    const {
      theme = null,
      size = null,
      mode = "hybrid",
    } = options;

    let mutant = JSON.parse(JSON.stringify(dsl));
    const mutationHistory = [];

    if (theme && this.palette.themes && this.palette.themes[theme]) {
      mutant = this.applyTheme(mutant, theme);
      mutationHistory.push({
        step: mutationHistory.length + 1,
        mutation: "applyTheme",
        type: "controlled",
        theme: theme,
        description: `Applied ${this.palette.themes[theme].name}`,
      });
    }

    if (size && this.palette.sizeVariants && this.palette.sizeVariants[size]) {
      mutant = this.applySize(mutant, size);
      mutationHistory.push({
        step: mutationHistory.length + 1,
        mutation: "applySize",
        type: "controlled",
        size: size,
        description: `Applied ${this.palette.sizeVariants[size].name} sizing`,
      });
    }

    return {
      dsl: mutant,
      mutations: mutationHistory,
      requiresRandomMutation: mode === "random" || mode === "hybrid",
    };
  }

  applyTheme(dsl, themeName) {
    const theme = this.palette.themes[themeName];
    if (!theme) return dsl;

    if (dsl.widget) {
      dsl.widget.backgroundColor = theme.widget.backgroundColor;
      dsl.widget.borderRadius = theme.widget.borderRadius;
    }

    this.traverseAndApplyTheme(dsl.widget?.root, theme, 0);

    return dsl;
  }

  traverseAndApplyTheme(node, theme, depth = 0) {
    if (!node) return;

    if (node.type === "container") {
      if (node.backgroundColor) {
        if (depth === 0) {
          node.backgroundColor = theme.backgrounds.primary;
        } else if (depth === 1) {
          node.backgroundColor = theme.backgrounds.secondary;
        } else {
          node.backgroundColor = theme.backgrounds.tertiary;
        }
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => {
          this.traverseAndApplyTheme(child, theme, depth + 1);
        });
      }
    }

    if (node.type === "leaf") {
      if (node.component === "Text" && node.props?.color) {
        const textLevel = this.getTextImportance(node);
        node.props.color = theme.text[textLevel];

        if (node.props.fontWeight && theme.text.fontWeights) {
          node.props.fontWeight = selectFromArray(theme.text.fontWeights);
        }
      }

      if (node.component === "Icon" && node.props?.color) {
        const iconCategory = this.categorizeIcon(node.props.name);

        if (iconCategory === "decorative" || iconCategory === "generic") {
          node.props.color = selectFromArray(theme.accents);
        } else {
          node.props.color = theme.text.secondary;
        }
      }

      if (isChartComponent(node.component) && node.props?.colors) {
        const colorCount = node.props.colors.length;
        node.props.colors = theme.accents.slice(0, colorCount);
      }
    }
  }

  applySize(dsl, sizeName) {
    const size = this.palette.sizeVariants[sizeName];
    if (!size) return dsl;

    this.traverseAndApplySize(dsl.widget?.root, size);

    if (dsl.widget?.borderRadius) {
      dsl.widget.borderRadius = Math.round(
        dsl.widget.borderRadius * size.borderRadius.multiplier
      );
    }

    return dsl;
  }

  traverseAndApplySize(node, size) {
    if (!node) return;

    if (node.type === "container") {
      if (node.gap !== undefined) {
        node.gap = selectFromArray(size.spacing.gap);
      }
      if (node.padding !== undefined) {
        node.padding = selectFromArray(size.spacing.padding);
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => {
          this.traverseAndApplySize(child, size);
        });
      }
    }

    if (node.type === "leaf") {
      if (node.component === "Text" && node.props?.fontSize) {
        const textRole = this.getTextRole(node);
        const sizeArray = size.fontSize[textRole] || size.fontSize.base;
        node.props.fontSize = selectFromArray(sizeArray);
      }

      if (node.component === "Icon" && node.props?.size) {
        const iconCategory = this.categorizeIconSize(node.props.size);
        node.props.size = selectFromArray(size.iconSize[iconCategory]);
      }
    }
  }

  getTextImportance(node) {
    if (!node.props) return "tertiary";

    const fontSize = node.props.fontSize || 14;
    const fontWeight = node.props.fontWeight || 400;

    if (fontSize >= 24 || fontWeight >= 600) return "primary";
    if (fontSize >= 16 || fontWeight >= 500) return "secondary";
    return "tertiary";
  }

  getTextRole(node) {
    if (!node.props) return "base";

    const fontSize = node.props.fontSize || 14;
    if (fontSize >= 20) return "title";
    if (fontSize >= 16) return "subtitle";
    return "base";
  }

  categorizeIconSize(size) {
    if (size < 20) return "small";
    if (size < 32) return "medium";
    return "large";
  }

  categorizeIcon(iconName) {
    if (!iconName) return "generic";

    const patterns = {
      status: /check|x\.circle|alert|warning|error|success/,
      weather: /sun|cloud|rain|snow|wind|moon/,
      navigation: /arrow|chevron|caret|triangle/,
      data: /chart|graph|bar|line|pie|percent/,
      decorative: /star|heart|sparkle|flame|leaf/,
    };

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(iconName)) return category;
    }
    return "generic";
  }
}

export function applyTheme(dsl, themeName, palette) {
  const mutator = new ThemeMutator(palette);
  return mutator.applyTheme(dsl, themeName);
}

export function applySize(dsl, sizeName, palette) {
  const mutator = new ThemeMutator(palette);
  return mutator.applySize(dsl, sizeName);
}
