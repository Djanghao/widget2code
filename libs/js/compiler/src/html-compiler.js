/**
 * @file html-compiler.js
 * @description Compiles WidgetDSL specifications to HTML code
 * @author Baoze Lin
 * @date 2025-11-04
 */

import { parseIconName } from "./iconLibraryUtils.js";

export function compileWidgetDSLToHTML(widgetDSL) {
  if (!widgetDSL.widget?.root) {
    throw new Error("Invalid widget spec: missing widget.root");
  }

  const lines = [];
  const scripts = [];
  const styles = [];
  const componentCounter = { chart: 0, sparkline: 0 };

  const write = (line) => {
    lines.push(line);
  };

  const writeScript = (script) => {
    scripts.push(script);
  };

  const writeStyle = (style) => {
    styles.push(style);
  };

  const formatCssValue = (value) => {
    if (typeof value === "string") {
      // Handle unitless values that should stay unitless
      const unitlessProperties = [
        "font-weight",
        "line-height",
        "flex",
        "opacity",
        "z-index",
      ];
      return value;
    }
    return typeof value === "number" ? `${value}px` : value;
  };

  const formatStyleObject = (styles) => {
    return styles
      .map((style) => {
        const [property, value] = style.split(":");
        const cleanValue = value.replace(/['"]/g, "");
        return `${property}: ${formatCssValue(cleanValue)}`;
      })
      .join("; ");
  };

  function renderNode(node, depth = 0) {
    const indent = "  ".repeat(depth);

    if (node.type === "container") {
      const {
        direction = "row",
        gap = 8,
        padding,
        alignMain,
        alignCross,
        flex,
        width,
        height,
        backgroundColor,
        borderRadius,
        children = [],
      } = node;

      const cssStyles = [];
      cssStyles.push(`display: flex`);
      cssStyles.push(
        `flex-direction: ${direction === "col" ? "column" : "row"}`
      );
      if (gap) cssStyles.push(`gap: ${gap}px`);
      if (padding) cssStyles.push(`padding: ${padding}px`);
      if (flex !== undefined) {
        if (typeof flex === "string") cssStyles.push(`flex: ${flex}`);
        else cssStyles.push(`flex: ${flex}`);
      }
      if (width !== undefined)
        cssStyles.push(`width: ${formatCssValue(width)}`);
      if (height !== undefined)
        cssStyles.push(`height: ${formatCssValue(height)}`);
      if (backgroundColor)
        cssStyles.push(`background-color: ${backgroundColor}`);
      if (borderRadius !== undefined)
        cssStyles.push(`border-radius: ${borderRadius}px`);
      if (alignMain) {
        const alignMap = {
          start: "flex-start",
          end: "flex-end",
          center: "center",
          between: "space-between",
        };
        cssStyles.push(`justify-content: ${alignMap[alignMain] || alignMain}`);
      }
      if (alignCross) {
        const alignMap = {
          start: "flex-start",
          end: "flex-end",
          center: "center",
        };
        cssStyles.push(`align-items: ${alignMap[alignCross] || alignCross}`);
      }

      write(`${indent}<div style="${formatStyleObject(cssStyles)}">`);
      children.forEach((child) => renderNode(child, depth + 1));
      write(`${indent}</div>`);
      return;
    }

    if (node.type === "leaf") {
      const { component, props = {}, flex, width, height, content } = node;
      const componentName = component;

      if (!componentName) {
        throw new Error("Invalid leaf node: missing component");
      }

      const mergedProps = { ...props };

      // Components that use 'content' as a prop instead of children
      const usesContentProp = ["Button", "ProgressRing"];
      if (content && usesContentProp.includes(componentName)) {
        mergedProps.content = content;
      }

      // Handle different component types
      switch (componentName) {
        case "Text":
          renderTextComponent(mergedProps, content, depth, flex, width, height);
          break;
        case "Button":
          renderButtonComponent(mergedProps, depth, flex, width, height);
          break;
        case "Icon":
          renderIconComponent(mergedProps, depth, flex, width, height);
          break;
        case "Image":
          renderImageComponent(mergedProps, depth, flex, width, height);
          break;
        case "Checkbox":
          renderCheckboxComponent(mergedProps, depth, flex, width, height);
          break;
        case "Divider":
          renderDividerComponent(mergedProps, depth, flex, width, height);
          break;
        case "Indicator":
          renderIndicatorComponent(mergedProps, depth, flex, width, height);
          break;
        case "ProgressBar":
          renderProgressBarComponent(mergedProps, depth, flex, width, height);
          break;
        case "ProgressRing":
          renderProgressRingComponent(mergedProps, depth, flex, width, height);
          break;
        case "Sparkline":
          renderSparklineComponent(mergedProps, depth, flex, width, height);
          break;
        case "LineChart":
        case "BarChart":
        case "StackedBarChart":
        case "RadarChart":
        case "PieChart":
          renderChartComponent(
            componentName,
            mergedProps,
            depth,
            flex,
            width,
            height
          );
          break;
        default:
          renderGenericComponent(
            componentName,
            mergedProps,
            content,
            depth,
            flex,
            width,
            height
          );
      }
    }
  }

  function renderTextComponent(props, content, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const styles = getTextStyles(props, flex, width, height);

    const textContent = content || props.content || "";
    write(
      `${indent}<div style="${formatStyleObject(styles)}">${textContent}</div>`
    );
  }

  function renderButtonComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const { icon, content, iconSize, iconColor } = props;
    const styles = getButtonStyles(props, flex, width, height);

    // Create unique ID for potential interactions
    const buttonId = `button-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    write(
      `${indent}<div id="${buttonId}" style="${formatStyleObject(
        styles
      )}" role="button" tabindex="0">`
    );

    if (icon) {
      // Render icon with Font Awesome mapping
      const iconClass = mapToIconClass(icon);
      const iconStyles = [
        `display: flex`,
        `align-items: center`,
        `justify-content: center`,
        `width: ${iconSize || props.fontSize * 1.2 || 16.8}px`,
        `height: ${iconSize || props.fontSize * 1.2 || 16.8}px`,
        `color: ${iconColor || props.color || "white"}`,
      ];
      write(
        `${indent}  <i class="${iconClass}" style="${formatStyleObject(
          iconStyles
        )}"></i>`
      );
    } else if (content) {
      write(
        `${indent}  <span style="display: flex; align-items: center; justify-content: center;">${content}</span>`
      );
    } else {
      write(
        `${indent}  <span style="display: flex; align-items: center; justify-content: center;">Button</span>`
      );
    }

    write(`${indent}</div>`);

    // Add hover and active state handling
    writeScript(`
      (function() {
        const button = document.getElementById('${buttonId}');
        if (!button) return;

        // Add hover effects
        button.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.02)';
          this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          this.style.transition = 'all 0.2s ease';
        });

        button.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = 'none';
        });

        // Add active state
        button.addEventListener('mousedown', function() {
          this.style.transform = 'scale(0.98)';
        });

        button.addEventListener('mouseup', function() {
          this.style.transform = 'scale(1.02)';
        });

        // Keyboard support
        button.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.style.transform = 'scale(0.98)';
          }
        });

        button.addEventListener('keyup', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.style.transform = 'scale(1)';
          }
        });
      })();
    `);
  }

  function renderIconComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const { name, size = 20, color = "rgba(255, 255, 255, 0.85)" } = props;

    const styles = [
      `display: inline-flex`,
      `align-items: center`,
      `justify-content: center`,
      `width: ${size}px`,
      `height: ${size}px`,
      `color: ${color}`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    // Map icon names to FontAwesome or use simple placeholder
    const iconClass = mapToIconClass(name);

    write(
      `${indent}<i class="${iconClass}" style="${formatStyleObject(
        styles
      )}"></i>`
    );
  }

  function renderImageComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const { src, alt = "" } = props;

    const styles = [`display: block`, `max-width: 100%`, `max-height: 100%`];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    write(
      `${indent}<img src="${src}" alt="${alt}" style="${formatStyleObject(
        styles
      )}" />`
    );
  }

  function renderCheckboxComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const { checked = false } = props;

    const styles = [
      `width: 20px`,
      `height: 20px`,
      `border: 2px solid #ccc`,
      `border-radius: 4px`,
      `display: flex`,
      `align-items: center`,
      `justify-content: center`,
      `background-color: ${checked ? "#007AFF" : "white"}`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    const checkmark = checked ? "✓" : "";
    write(
      `${indent}<div style="${formatStyleObject(styles)}">${checkmark}</div>`
    );
  }

  function renderDividerComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const {
      orientation = "horizontal",
      color = "#e0e0e0",
      thickness = 1,
    } = props;

    const styles = [
      `background-color: ${color}`,
      orientation === "horizontal"
        ? `height: ${thickness}px`
        : `width: ${thickness}px`,
      orientation === "horizontal" ? `width: 100%` : `height: 100%`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined && orientation === "vertical")
      styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined && orientation === "horizontal")
      styles.push(`height: ${formatCssValue(height)}`);

    write(`${indent}<div style="${formatStyleObject(styles)}"></div>`);
  }

  function renderIndicatorComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const { color = "#34C759", size = 8 } = props;

    const styles = [
      `width: ${size}px`,
      `height: ${size}px`,
      `border-radius: 50%`,
      `background-color: ${color}`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    write(`${indent}<div style="${formatStyleObject(styles)}"></div>`);
  }

  function renderProgressBarComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const {
      progress = 0.5,
      color = "#007AFF",
      backgroundColor = "#e0e0e0",
    } = props;

    const containerId = `progress-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const containerStyles = [
      `width: 100%`,
      `height: 8px`,
      `background-color: ${backgroundColor}`,
      `border-radius: 4px`,
      `overflow: hidden`,
    ];

    if (flex !== undefined) containerStyles.push(`flex: ${flex}`);
    if (width !== undefined)
      containerStyles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined)
      containerStyles.push(`height: ${formatCssValue(height)}`);

    write(
      `${indent}<div id="${containerId}" style="${formatStyleObject(
        containerStyles
      )}">`
    );
    write(
      `${indent}  <div style="width: ${
        progress * 100
      }%; height: 100%; background-color: ${color}; transition: width 0.3s ease;"></div>`
    );
    write(`${indent}</div>`);
  }

  function renderProgressRingComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const {
      percentage = 0,
      color = "#34C759",
      backgroundColor = "#d1d1d6",
      size = 80,
      strokeWidth = 6,
      iconName,
      iconSize = 32,
      iconColor = "#000000",
      content,
      textColor = "#000000",
      fontSize = 14,
      fontWeight = 500,
    } = props;

    const progressRingId = `progressring-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Calculate SVG circle properties
    const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (normalizedPercentage / 100) * circumference;

    const containerStyles = [
      `position: relative`,
      `width: ${size}px`,
      `height: ${size}px`,
      `display: flex`,
      `align-items: center`,
      `justify-content: center`,
      `flex: 0 0 auto`,
      `flex-shrink: 0`,
    ];

    if (flex !== undefined) containerStyles.push(`flex: ${flex}`);
    if (width !== undefined)
      containerStyles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined)
      containerStyles.push(`height: ${formatCssValue(height)}`);

    write(
      `${indent}<div id="${progressRingId}" style="${formatStyleObject(
        containerStyles
      )}">`
    );

    // SVG circles for the progress ring
    write(
      `${indent}  <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">`
    );
    write(`${indent}    <circle`);
    write(`${indent}      cx="${size / 2}"`);
    write(`${indent}      cy="${size / 2}"`);
    write(`${indent}      r="${radius}"`);
    write(`${indent}      fill="none"`);
    write(`${indent}      stroke="${backgroundColor}"`);
    write(`${indent}      stroke-width="${strokeWidth}"`);
    write(`${indent}    />`);
    write(`${indent}    <circle`);
    write(`${indent}      id="${progressRingId}-progress"`);
    write(`${indent}      cx="${size / 2}"`);
    write(`${indent}      cy="${size / 2}"`);
    write(`${indent}      r="${radius}"`);
    write(`${indent}      fill="none"`);
    write(`${indent}      stroke="${color}"`);
    write(`${indent}      stroke-width="${strokeWidth}"`);
    write(`${indent}      stroke-dasharray="${circumference}"`);
    write(`${indent}      stroke-dashoffset="${strokeDashoffset}"`);
    write(`${indent}      stroke-linecap="round"`);
    write(`${indent}      style="transition: stroke-dashoffset 0.3s ease;"`);
    write(`${indent}    />`);
    write(`${indent}  </svg>`);

    // Center content (icon or text)
    if (iconName || content) {
      write(
        `${indent}  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">`
      );

      if (iconName) {
        const iconClass = mapToIconClass(iconName);
        const iconStyles = [
          `width: ${iconSize}px`,
          `height: ${iconSize}px`,
          `color: ${iconColor}`,
          `display: flex`,
          `align-items: center`,
          `justify-content: center`,
        ];
        write(
          `${indent}    <i class="${iconClass}" style="${formatStyleObject(
            iconStyles
          )}"></i>`
        );
      } else if (content) {
        const textStyles = [
          `color: ${textColor}`,
          `font-size: ${fontSize}px`,
          `font-weight: ${fontWeight}`,
          `white-space: nowrap`,
          `display: flex`,
          `align-items: center`,
          `justify-content: center`,
        ];
        write(
          `${indent}    <span style="${formatStyleObject(
            textStyles
          )}">${content}</span>`
        );
      }

      write(`${indent}  </div>`);
    }

    write(`${indent}</div>`);

    // Add animation and interaction script
    writeScript(`
      (function() {
        const progressRing = document.getElementById('${progressRingId}');
        const progressCircle = document.getElementById('${progressRingId}-progress');
        if (!progressRing || !progressCircle) return;

        // Animate on load
        setTimeout(() => {
          const targetOffset = ${strokeDashoffset};
          progressCircle.style.strokeDashoffset = targetOffset;
        }, 100);

        // Add hover effect
        progressRing.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.05)';
          this.style.transition = 'transform 0.2s ease';
        });

        progressRing.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
        });

        // Function to update progress (can be called externally)
        progressRing.updateProgress = function(newPercentage) {
          const normalizedPercentage = Math.min(Math.max(newPercentage, 0), 100);
          const newOffset = ${circumference} - (normalizedPercentage / 100) * ${circumference};
          progressCircle.style.strokeDashoffset = newOffset;
        };
      })();
    `);
  }

  function renderSparklineComponent(props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const sparklineId = `sparkline-${componentCounter.sparkline++}`;
    const {
      data = [],
      color = "#34C759",
      width: w = 80,
      height: h = 40,
    } = props;

    const styles = [`display: block`, `width: ${w}px`, `height: ${h}px`];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    write(
      `${indent}<canvas id="${sparklineId}" style="${formatStyleObject(
        styles
      )}"></canvas>`
    );

    // Add JavaScript to render the sparkline
    writeScript(`
      (function() {
        const canvas = document.getElementById('${sparklineId}');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = ${w};
        const height = ${h};
        const data = ${JSON.stringify(data)};
        const color = '${color}';

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length < 2) return;

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        data.forEach((value, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((value - min) / range) * height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      })();
    `);
  }

  function renderChartComponent(chartType, props, depth, flex, width, height) {
    const indent = "  ".repeat(depth);
    const chartId = `chart-${componentCounter.chart++}`;

    const styles = [`width: 100%`, `height: 100%`, `min-height: 200px`];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    write(
      `${indent}<div id="${chartId}" style="${formatStyleObject(
        styles
      )}"></div>`
    );

    // Generate ECharts option based on chart type and props
    const chartOption = generateChartOption(chartType, props);

    // Add JavaScript to initialize the chart
    writeScript(`
      (function() {
        const chartDom = document.getElementById('${chartId}');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        const option = ${JSON.stringify(chartOption)};

        myChart.setOption(option);
      })();
    `);
  }

  function renderGenericComponent(
    componentName,
    props,
    content,
    depth,
    flex,
    width,
    height
  ) {
    const indent = "  ".repeat(depth);
    const styles = getGenericStyles(flex, width, height);

    const componentContent = content || componentName;
    write(
      `${indent}<div style="${formatStyleObject(
        styles
      )}">${componentContent}</div>`
    );
  }

  // Helper functions for styling
  function getTextStyles(props, flex, width, height) {
    const {
      fontSize = 14,
      fontWeight = "normal",
      color = "#333333",
      textAlign = "left",
      lineHeight = 1.4,
    } = props;

    const styles = [
      `font-size: ${fontSize}px`,
      `font-weight: ${fontWeight}`,
      `color: ${color}`,
      `text-align: ${textAlign}`,
      `line-height: ${lineHeight}`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    return styles;
  }

  function getButtonStyles(props, flex, width, height) {
    const {
      backgroundColor = "rgba(59, 130, 246, 1)",
      color = "rgba(255, 255, 255, 1)",
      borderRadius = 8,
      fontSize = 14,
      fontWeight = 500,
      padding = 12,
      border = "none",
    } = props;

    const styles = [
      `display: flex`,
      `align-items: center`,
      `justify-content: center`,
      `background-color: ${backgroundColor}`,
      `color: ${color}`,
      `border-radius: ${borderRadius}px`,
      `font-size: ${fontSize}px`,
      `font-weight: ${fontWeight}`,
      `padding: ${padding}px`,
      `border: ${border}`,
      `cursor: pointer`,
      `user-select: none`,
      `outline: none`,
      `transition: all 0.2s ease`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    return styles;
  }

  function getGenericStyles(flex, width, height) {
    const styles = [
      `display: flex`,
      `align-items: center`,
      `justify-content: center`,
    ];

    if (flex !== undefined) styles.push(`flex: ${flex}`);
    if (width !== undefined) styles.push(`width: ${formatCssValue(width)}`);
    if (height !== undefined) styles.push(`height: ${formatCssValue(height)}`);

    return styles;
  }

  function mapToIconClass(name) {
    // Extended mapping to Font Awesome icons for buttons and progress rings
    const iconMap = {
      // SF Symbols
      "sf:paperplane.fill": "fas fa-paper-plane",
      "sf:sun.max.fill": "fas fa-sun",
      "sf:heart.fill": "fas fa-heart",
      "sf:house.fill": "fas fa-home",
      "sf:star.fill": "fas fa-star",
      "sf:person.fill": "fas fa-user",
      "sf:gear": "fas fa-cog",
      "sf:trash.fill": "fas fa-trash",
      "sf:plus.circle.fill": "fas fa-plus-circle",
      "sf:minus.circle.fill": "fas fa-minus-circle",
      "sf:checkmark.circle.fill": "fas fa-check-circle",
      "sf:xmark.circle.fill": "fas fa-times-circle",
      "sf:arrow.clockwise": "fas fa-sync",
      "sf:play.circle.fill": "fas fa-play-circle",
      "sf:pause.circle.fill": "fas fa-pause-circle",
      "sf:stop.circle.fill": "fas fa-stop-circle",

      // Common Lucide icons
      "lu:LuDownload": "fas fa-download",
      "lu:LuUpload": "fas fa-upload",
      "lu:LuSettings": "fas fa-cog",
      "lu:LuUser": "fas fa-user",
      "lu:LuMail": "fas fa-envelope",
      "lu:LuPhone": "fas fa-phone",
      "lu:LuCalendar": "fas fa-calendar",
      "lu:LuClock": "fas fa-clock",
      "lu:LuSearch": "fas fa-search",
      "lu:LuBell": "fas fa-bell",
      "lu:LuHeart": "fas fa-heart",
      "lu:LuStar": "fas fa-star",
      "lu:LuTrash": "fas fa-trash",
      "lu:LuPlus": "fas fa-plus",
      "lu:LuMinus": "fas fa-minus",
      "lu:LuCheck": "fas fa-check",
      "lu:LuX": "fas fa-times",
      "lu:LuArrowRight": "fas fa-arrow-right",
      "lu:LuArrowLeft": "fas fa-arrow-left",
      "lu:LuArrowUp": "fas fa-arrow-up",
      "lu:LuArrowDown": "fas fa-arrow-down",

      // Ant Design icons
      "ai:AiDownload": "fas fa-download",
      "ai:AiUpload": "fas fa-upload",
      "ai:AiSetting": "fas fa-cog",
      "ai:AiUser": "fas fa-user",
      "ai:AiMail": "fas fa-envelope",

      // Common Font Awesome mappings
      "fa:FaDownload": "fas fa-download",
      "fa:FaUpload": "fas fa-upload",
      "fa:FaCog": "fas fa-cog",
      "fa:FaUser": "fas fa-user",
      "fa:FaEnvelope": "fas fa-envelope",
      "fa:FaPhone": "fas fa-phone",
      "fa:FaCalendar": "fas fa-calendar",
      "fa:FaClock": "fas fa-clock",
      "fa:FaSearch": "fas fa-search",
      "fa:FaBell": "fas fa-bell",
      "fa:FaHeart": "fas fa-heart",
      "fa:FaStar": "fas fa-star",
      "fa:FaTrash": "fas fa-trash",
      "fa:FaPlus": "fas fa-plus",
      "fa:FaMinus": "fas fa-minus",
      "fa:FaCheck": "fas fa-check",
      "fa:FaTimes": "fas fa-times",
      "fa:FaArrowRight": "fas fa-arrow-right",
      "fa:FaArrowLeft": "fas fa-arrow-left",
      "fa:FaArrowUp": "fas fa-arrow-up",
      "fa:FaArrowDown": "fas fa-arrow-down",
    };

    return iconMap[name] || "fas fa-question"; // Default icon
  }

  function generateChartOption(chartType, props) {
    // This is a simplified version - you'd need to expand this based on the actual chart components
    const baseOption = {
      backgroundColor: "transparent",
      tooltip: { show: false },
      animation: false,
    };

    switch (chartType) {
      case "LineChart":
        return {
          ...baseOption,
          xAxis: { type: "category", data: props.labels || [] },
          yAxis: { type: "value" },
          series: [
            {
              type: "line",
              data: props.data || [],
              smooth: props.smooth !== false,
              itemStyle: { color: props.color || "#6DD400" },
            },
          ],
        };
      case "BarChart":
        return {
          ...baseOption,
          xAxis: { type: "category", data: props.labels || [] },
          yAxis: { type: "value" },
          series: [
            {
              type: "bar",
              data: props.data || [],
              itemStyle: { color: props.color || "#6DD400" },
            },
          ],
        };
      case "PieChart":
        return {
          ...baseOption,
          series: [
            {
              type: "pie",
              data: props.data || [],
              radius: props.innerRadius ? ["50%", "70%"] : "70%",
              itemStyle: { color: props.color || "#6DD400" },
            },
          ],
        };
      default:
        return baseOption;
    }
  }

  // Start rendering
  renderNode(widgetDSL.widget.root, 0);

  // Generate the complete HTML
  const { backgroundColor, borderRadius, padding, width, height } =
    widgetDSL.widget;

  const widgetStyles = [
    `background-color: ${backgroundColor || "#f2f2f7"}`,
    `border-radius: ${borderRadius !== undefined ? borderRadius : 20}px`,
    `padding: ${padding !== undefined ? padding : 16}px`,
    `overflow: hidden`,
    `display: inline-flex`,
    `flex-direction: column`,
    `box-sizing: border-box`,
  ];

  if (width !== undefined) widgetStyles.push(`width: ${formatCssValue(width)}`);
  if (height !== undefined)
    widgetStyles.push(`height: ${formatCssValue(height)}`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget</title>

    <!-- CDN Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
        }

        .widget-container {
            ${formatStyleObject(widgetStyles)}
        }

        ${styles.join("\n        ")}
    </style>
</head>
<body>
    <div class="widget-container">
${lines.join("\n        ")}
    </div>

    <script>
        ${scripts.join("\n        ")}
    </script>
</body>
</html>`;

  return html;
}
