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
  // Pie specific options
  variant = "pie",
  innerRadius = 0,
  outerRadius = 80,
  centerText = "",
  centerValue = "",
  showLabels = false,
  showValues = false,
  showPercentages = false,
  labelPosition = "outside",
  // ... other props ...
  startAngle = 90,
  clockwise = true,
  borderWidth = 0,
  borderColor = "#ffffff",
  roundedSegments = false,
  segmentBorderRadius = 10,
  showLegend = false,
  legendPosition = "right",
  legendOrientation = "vertical",
  showSectorLines = false,
  sectorLineColor,
  sectorLineWidth = 1,
  sectorLineStyle = "solid",
  centerTextStyle = {},
  centerValueStyle = {},
  centerTextGap = 4, // Default gap between Value and Text
  centerIconName,
  centerIconSize = 32,
  centerIconColor,
  centerContent,
  useCenterGraphic = true, // We will override this with HTML overlay for better control
  min,
  max,
  ...props
}) => {
  // --- 1. SMART LAYOUT LOGIC ---

  // FIX FOR OVERLAP: Dynamic Center
  // If the legend is on the side, we must move the chart away from it.
  const smartCenter = (() => {
    if (showLegend && legendPosition === "right") return ["35%", "50%"];
    if (showLegend && legendPosition === "left") return ["65%", "50%"];
    if (showLegend && legendPosition === "top") return ["50%", "60%"];
    if (showLegend && legendPosition === "bottom") return ["50%", "40%"];
    return ["50%", "50%"];
  })();

  // FIX FOR TRUNCATION: Dynamic Radius
  // If labels are 'outside', shrink to 60% to give text room.
  const smartOuterRadius = (() => {
    if (outerRadius !== 80) return `${outerRadius}%`; // Respect manual override
    if (showLabels && labelPosition === "outside") return "60%";
    if (showLegend) return "70%";
    return `${outerRadius}%`;
  })();

  // --- Theme & Data Processing ---
  const themes = {
    dark: {
      textColor: "#A0A0A0",
      backgroundColor: "transparent",
      borderColor: "#333333",
    },
    light: {
      textColor: "#666666",
      backgroundColor: "transparent",
      borderColor: "#e0e0e0",
    },
  };

  const currentTheme = themes[theme] || themes.dark;
  const finalSectorLineColor = sectorLineColor || currentTheme.borderColor;

  let calculatedInnerRadius = 0;
  if (variant === "donut" || variant === "ring") {
    calculatedInnerRadius = `${innerRadius || 40}%`;
  }

  const processedData = Array.isArray(data)
    ? data.map((item, index) => {
        let value =
          typeof item === "object" && item !== null
            ? item.value || 0
            : item || 0;
        // Apply min/max if needed (omitted for brevity)
        const baseColor = colors[index] || "#6DD400"; // Simplified
        return {
          name:
            typeof item === "object"
              ? item.name
              : labels[index] || `Item ${index}`,
          value: value,
          itemStyle: {
            color: baseColor,
            borderRadius: roundedSegments ? segmentBorderRadius : 0,
            borderColor: borderColor,
            borderWidth: borderWidth,
          },
        };
      })
    : [];

  // --- ECharts Option ---
  const echartOption = {
    backgroundColor: backgroundColor || currentTheme.backgroundColor,

    legend: showLegend
      ? {
          show: true,
          orient: legendOrientation,
          left:
            legendPosition === "left"
              ? 20
              : legendPosition === "right"
              ? undefined
              : "center",
          right: legendPosition === "right" ? 20 : undefined,
          top:
            legendPosition === "top"
              ? 20
              : legendPosition === "bottom"
              ? undefined
              : "middle",
          bottom: legendPosition === "bottom" ? 20 : undefined,
          textStyle: { color: currentTheme.textColor },
          data: processedData.map((item) => item.name),
        }
      : undefined,

    // Disable ECharts internal graphic to avoid conflicts with our HTML overlay
    graphic: undefined,

    series: [
      {
        name: title,
        type: "pie",
        radius: [calculatedInnerRadius, smartOuterRadius],
        center: smartCenter, // Use the smart center

        startAngle: startAngle,
        clockwise: clockwise,
        data: processedData,

        label: showLabels
          ? {
              show: true,
              position: labelPosition,
              color: currentTheme.textColor,
              fontSize: 11,
              alignTo: "labelLine", // Helps preventing overlap
              bleedMargin: 5,
              formatter: function (params) {
                return params.name; // Simplified formatter
              },
            }
          : { show: false },

        labelLine: {
          show: showLabels && labelPosition === "outside",
          length: 15,
          length2: 10,
        },
        itemStyle: {
          borderWidth: showSectorLines ? sectorLineWidth : 0,
          borderColor: showSectorLines ? finalSectorLineColor : "transparent",
          borderType: sectorLineStyle,
          borderRadius: roundedSegments ? segmentBorderRadius : 0,
        },
      },
    ],
    animation: false,
  };

  // Determine if we show the HTML center overlay
  const hasCenterContent =
    (variant === "donut" || variant === "ring") &&
    (centerIconName || centerContent || centerText || centerValue);

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
        position: "relative",
      }}
    >
      <ReactECharts
        option={echartOption}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge={true}
        lazyUpdate={true}
        {...props}
      />

      {/* HTML OVERLAY CENTER */}
      {hasCenterContent && (
        <div
          style={{
            position: "absolute",
            // FOLLOW THE CHART: Use smartCenter to position the overlay
            left: smartCenter[0],
            top: smartCenter[1],
            transform: "translate(-50%, -50%)",

            // STACKING LOGIC: Flex Column
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: `${centerTextGap}px`, // Use the prop for spacing
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
            // If user passes custom JSX content, just render it
            typeof centerContent === "string" ? (
              <span
                style={{
                  color: currentTheme.textColor,
                  fontSize: "14px",
                  ...centerTextStyle,
                }}
              >
                {centerContent}
              </span>
            ) : (
              centerContent
            )
          ) : (
            // "BOTH" LOGIC: Render Value AND Text if they exist
            <>
              {centerValue && (
                <span
                  style={{
                    color: currentTheme.textColor,
                    fontSize: "24px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    lineHeight: "1.2",
                    ...centerValueStyle,
                  }}
                >
                  {centerValue}
                </span>
              )}

              {centerText && (
                <span
                  style={{
                    color: currentTheme.textColor,
                    fontSize: "12px",
                    fontWeight: "normal",
                    whiteSpace: "nowrap",
                    opacity: 0.8, // Make label slightly softer
                    ...centerTextStyle,
                  }}
                >
                  {centerText}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
