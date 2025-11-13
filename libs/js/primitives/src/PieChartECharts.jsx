import React from "react";
import ReactECharts from "echarts-for-react";
import { Icon } from "./Icon.jsx";

export const PieChart = ({
  title = "Pie Chart",
  showTitle = false,
  data = [],
  labels = [],
  colors = [],
  backgroundColor = "transparent",
  height = "100%",
  width = "100%",
  minHeight = 200,
  minWidth = 200,
  theme = "dark",
  // Pie chart specific options
  variant = "pie", // 'pie', 'donut', 'ring'
  innerRadius = 0, // For donut charts (0-95)
  outerRadius = 80, // Outer radius (10-100)
  centerText = "", // Text to display in center (for donut charts)
  centerValue = "", // Value to display in center
  showLabels = false,
  showValues = false,
  showPercentages = false,
  labelPosition = "outside", // 'outside', 'inside', 'center'
  // Animation and interaction
  animated = false,
  animationDuration = 1000,
  emphasisScale = 1.1,
  // Start angle control
  startAngle = 90, // 90 = top, 0 = right, 180 = bottom, 270 = left
  clockwise = true, // Direction of segment drawing
  // Border and styling
  borderWidth = 0,
  borderColor = "#ffffff",
  // Rounded segments
  roundedSegments = false,
  segmentBorderRadius = 10,
  // Legend
  showLegend = false,
  legendPosition = "right", // 'top', 'bottom', 'left', 'right'
  legendOrientation = "vertical", // 'horizontal', 'vertical'
  // Tick line customization (for sector boundaries)
  showSectorLines = false,
  sectorLineColor,
  sectorLineWidth = 1,
  sectorLineStyle = "solid",
  // Center styling
  centerTextStyle = {},
  centerValueStyle = {},
  centerTextGap = 0, // Gap between centerValue and centerText (in pixels)
  // Icon support for center content
  centerIconName,
  centerIconSize = 32,
  centerIconColor,
  centerContent,
  // Rendering method for center text/value
  useCenterGraphic = true, // Use ECharts graphic (true) or HTML overlay (false)
  // Min/max for data validation
  min,
  max,
  ...props
}) => {
  // Theme configurations
  const themes = {
    dark: {
      textColor: "#A0A0A0",
      backgroundColor: "transparent",
      borderColor: "#333333",
      tooltipBg: "rgba(30, 33, 40, 0.9)",
    },
    light: {
      textColor: "#666666",
      backgroundColor: "transparent",
      borderColor: "#e0e0e0",
      tooltipBg: "rgba(255, 255, 255, 0.95)",
    },
  };

  const currentTheme = themes[theme] || themes.dark;

  // Process data - handle both array of values and array of objects
  const processedData = Array.isArray(data)
    ? data.map((item, index) => {
        let value =
          typeof item === "object" && item !== null
            ? item.value || 0
            : item || 0;

        // Apply min/max validation if provided
        if (min !== undefined) value = Math.max(min, value);
        if (max !== undefined) value = Math.min(max, value);

        const baseColor =
          typeof item === "object" && item !== null
            ? item.color ||
              colors[index] ||
              defaultColors[index % defaultColors.length]
            : colors[index] || defaultColors[index % defaultColors.length];

        if (typeof item === "object" && item !== null) {
          // Data is already in object format
          return {
            name: item.name || labels[index] || `Item ${index + 1}`,
            value: value,
            itemStyle: {
              color: baseColor,
              borderWidth: borderWidth,
              borderColor: borderColor,
              borderRadius: roundedSegments ? segmentBorderRadius : 0,
            },
            ...item,
          };
        } else {
          // Data is array of values
          return {
            name: labels[index] || `Item ${index + 1}`,
            value: value,
            itemStyle: {
              color: baseColor,
              borderWidth: borderWidth,
              borderColor: borderColor,
              borderRadius: roundedSegments ? segmentBorderRadius : 0,
            },
          };
        }
      })
    : [];

  // Default colors for pie chart segments
  const defaultColors = [
    "#6DD400",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
  ];

  // Set radius based on variant
  let calculatedInnerRadius = 0;
  let calculatedOuterRadius = `${outerRadius}%`;

  if (variant === "donut" || variant === "ring") {
    calculatedInnerRadius = `${innerRadius || 40}%`;
  }

  // Determine sector line color
  const finalSectorLineColor = sectorLineColor || currentTheme.borderColor;

  const echartOption = {
    textStyle: {
      color: currentTheme.textColor,
    },
    backgroundColor: backgroundColor || currentTheme.backgroundColor,
    title:
      showTitle && title
        ? {
            text: title,
            left: "center",
            top: 10,
            textStyle: {
              color: currentTheme.textColor,
              fontSize: 14,
              fontWeight: "normal",
            },
          }
        : undefined,
    tooltip: {
      show: false, // Disable tooltips for static mode
    },
    legend: showLegend
      ? {
          show: true,
          orient: legendOrientation,
          [legendPosition]: 20,
          top:
            legendPosition === "top"
              ? 20
              : legendPosition === "bottom"
              ? "bottom"
              : "middle",
          textStyle: {
            color: currentTheme.textColor,
            fontSize: 11,
          },
          itemWidth: 12,
          itemHeight: 12,
          data: processedData.map((item) => item.name),
        }
      : undefined,
    graphic: useCenterGraphic && (variant === "donut" || variant === "ring") && (centerText || centerValue) ? (() => {
      const valueFontSize = parseInt(centerValueStyle?.fontSize) || 32;
      const textFontSize = parseInt(centerTextStyle?.fontSize) || 11;
      const gap = centerTextGap;

      if (centerValue && centerText) {
        // Both texts present - position with gap
        // Use fixed percentages adjusted by gap
        const valueTop = 44 - (gap * 0.1); // Move up slightly based on gap
        const textTop = 54 + (gap * 0.1); // Move down slightly based on gap

        return [
          {
            type: "text",
            left: "center",
            top: `${valueTop}%`,
            style: {
              text: centerValue,
              textAlign: "center",
              fill: centerValueStyle?.color || currentTheme.textColor,
              fontSize: valueFontSize,
              fontWeight: centerValueStyle?.fontWeight || "bold",
            },
            z: 100,
          },
          {
            type: "text",
            left: "center",
            top: `${textTop}%`,
            style: {
              text: centerText,
              textAlign: "center",
              fill: centerTextStyle?.color || currentTheme.textColor,
              fontSize: textFontSize,
              fontWeight: centerTextStyle?.fontWeight || "normal",
            },
            z: 100,
          },
        ];
      } else if (centerValue) {
        // Only value
        return [{
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: centerValue,
            textAlign: "center",
            fill: centerValueStyle?.color || currentTheme.textColor,
            fontSize: valueFontSize,
            fontWeight: centerValueStyle?.fontWeight || "bold",
          },
          z: 100,
        }];
      } else if (centerText) {
        // Only text
        return [{
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: centerText,
            textAlign: "center",
            fill: centerTextStyle?.color || currentTheme.textColor,
            fontSize: textFontSize,
            fontWeight: centerTextStyle?.fontWeight || "normal",
          },
          z: 100,
        }];
      }
      return [];
    })() : undefined,
    series: [
      {
        name: title,
        type: "pie",
        radius: [calculatedInnerRadius, calculatedOuterRadius],
        center: ["50%", "50%"],
        startAngle: startAngle,
        clockwise: clockwise,
        data: processedData,
        emphasis: {
          disabled: true, // Disable all hover effects for static mode
        },
        label: showLabels
          ? {
              show: true,
              position: labelPosition,
              color: currentTheme.textColor,
              fontSize: 11,
              formatter: function (params) {
                let result = params.name;
                if (showValues && showPercentages) {
                  result += `\n${params.value} (${params.percent}%)`;
                } else if (showValues) {
                  result += `\n${params.value}`;
                } else if (showPercentages) {
                  result += `\n${params.percent}%`;
                }
                return result;
              },
            }
          : {
              show: false,
            },
        labelLine: {
          show: showLabels && labelPosition === "outside",
          lineStyle: {
            color: currentTheme.textColor,
            width: 1,
          },
        },
        itemStyle: {
          borderWidth: showSectorLines ? sectorLineWidth : 0,
          borderColor: showSectorLines ? finalSectorLineColor : "transparent",
          borderType: sectorLineStyle,
          borderRadius: roundedSegments ? segmentBorderRadius : 0,
        },
        animationType: "expansion",
        animationEasing: "elasticOut",
        animationDelay: function () {
          return Math.random() * 200;
        },
      },
    ],
    animation: false, // Disable all animations for static mode
  };

  const shouldShowCenterContent =
    (variant === "donut" || variant === "ring") &&
    (centerIconName || centerContent || (!useCenterGraphic && (centerText || centerValue)));

  const defaultCenterIconColor = centerIconColor || currentTheme.textColor;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: width,
        maxHeight: height,
        minWidth: minWidth,
        minHeight: minHeight,
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        position: "relative",
      }}
    >
      <ReactECharts
        option={echartOption}
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
        opts={{
          renderer: "svg",
        }}
        notMerge={true}
        lazyUpdate={true}
        {...props}
      />

      {shouldShowCenterContent && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            pointerEvents: "none",
          }}
        >
          {centerIconName ? (
            <Icon
              name={centerIconName}
              size={centerIconSize}
              color={defaultCenterIconColor}
            />
          ) : centerContent ? (
            typeof centerContent === 'string' ? (
              <span
                style={{
                  color: currentTheme.textColor,
                  fontSize: "14px",
                  fontWeight: "normal",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  ...centerTextStyle,
                }}
              >
                {centerContent}
              </span>
            ) : (
              centerContent
            )
          ) : null}

          {centerText && !centerIconName && !centerContent && (
            <span
              style={{
                color: currentTheme.textColor,
                fontSize: "14px",
                fontWeight: "normal",
                whiteSpace: "nowrap",
                textAlign: "center",
                ...centerTextStyle,
              }}
            >
              {centerText}
            </span>
          )}

          {centerValue && !centerContent && (
            <span
              style={{
                color: currentTheme.textColor,
                fontSize: centerText || centerIconName ? "18px" : "24px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                textAlign: "center",
                ...centerValueStyle,
              }}
            >
              {centerValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Preset variants for common use cases
export const DonutChart = (props) => (
  <PieChart
    {...props}
    variant="donut"
    innerRadius={40}
    showLegend={false}
    labelPosition="center"
  />
);

export const RingChart = (props) => (
  <PieChart
    {...props}
    variant="ring"
    innerRadius={60}
    showLabels={false}
    showLegend={true}
  />
);
