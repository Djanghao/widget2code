import React, { useRef, useEffect } from "react";
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
  innerRadius,
  outerRadius,
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

  const itemCount = Array.isArray(data) ? data.length : 0;
  const isHorizontalLegend =
    legendPosition === "top" || legendPosition === "bottom";
  const isVerticalLegend =
    legendPosition === "left" || legendPosition === "right";

  // Calculate max allowed radius based on layout constraints
  const getMaxRadius = () => {
    if (showLabels && labelPosition === "outside") return 30;
    if (showLegend) {
      if (isVerticalLegend && itemCount > 6) return 45;
      if (isVerticalLegend && itemCount > 4) return 50;
      if (isHorizontalLegend && itemCount > 4) return 50;
      return 55;
    }
    return 75;
  };

  // Dynamic Radius - shrink when legend or outside labels are shown
  // User-provided outerRadius is capped to prevent overlap with legend
  const smartOuterRadius = (() => {
    const maxRadius = getMaxRadius();
    if (outerRadius !== undefined) {
      const cappedRadius = Math.min(outerRadius, maxRadius);
      return `${cappedRadius}%`;
    }
    return `${maxRadius}%`;
  })();

  // Dynamic Center - move chart away from legend position
  // More items = more shift needed
  const smartCenter = (() => {
    if (showLegend && legendPosition === "right") {
      if (itemCount > 6) return ["30%", "50%"];
      if (itemCount > 4) return ["32%", "50%"];
      return ["35%", "50%"];
    }
    if (showLegend && legendPosition === "left") {
      if (itemCount > 6) return ["70%", "50%"];
      if (itemCount > 4) return ["68%", "50%"];
      return ["65%", "50%"];
    }
    if (showLegend && legendPosition === "top") {
      if (itemCount > 6) return ["50%", "65%"];
      if (itemCount > 4) return ["50%", "62%"];
      return ["50%", "60%"];
    }
    if (showLegend && legendPosition === "bottom") {
      if (itemCount > 6) return ["50%", "35%"];
      if (itemCount > 4) return ["50%", "30%"];
      return ["50%", "40%"];
    }
    if (showTitle) return ["50%", "55%"];
    return ["50%", "50%"];
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
              ? "left"
              : legendPosition === "right"
              ? "right"
              : "center",
          top:
            legendPosition === "top"
              ? "top"
              : legendPosition === "bottom"
              ? undefined
              : "middle",
          bottom: legendPosition === "bottom" ? "bottom" : undefined,
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
        emphasis: {
          disabled: true,
        },
      },
    ],
    tooltip: {
      show: false,
    },
    animation: false,
  };

  // Determine if we show the HTML center overlay
  const hasCenterContent =
    (variant === "donut" || variant === "ring") &&
    (centerIconName || centerContent || centerText || centerValue);

  const defaultCenterIconColor = centerIconColor || currentTheme.textColor;

  const chartRef = useRef(null);

  useEffect(() => {
    const instance = chartRef.current?.getEchartsInstance?.();
    if (!instance) return;

    const nudgeResize = () => {
      instance.resize();
    };

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(nudgeResize);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

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
        ref={chartRef}
        option={echartOption}
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
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
