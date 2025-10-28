import React from "react";
import ReactECharts from "echarts-for-react";

export const BarChart = ({
  title = "Bar Chart",
  showTitle = false,
  data = [],
  labels = [],
  color = "#6DD400", // Default color for all bars (single-series)
  colors = [], // Array of colors for: 1) multi-series (one per series), or 2) per-bar highlighting (one per bar)
  seriesNames = [],
  backgroundColor = "transparent",
  min,
  max,
  interval,
  height = "100%",
  width = "100%",
  minHeight = 120,
  minWidth = 200,
  theme = "dark",
  orientation = "vertical", // 'vertical' or 'horizontal'
  showValues = false,
  // Tick line customization
  showXAxisTicks = false,
  showYAxisTicks = false,
  xAxisTickCount,
  yAxisTickCount,
  xAxisTickInterval,
  yAxisTickInterval,
  tickLineColor,
  tickLineStyle = "dashed",
  tickLineWidth = 1,
  // Tick label customization
  showXAxisLabels = false,
  showYAxisLabels = false,
  // Axis label positioning
  xAxisLabelPosition = "bottom", // 'top' or 'bottom'
  yAxisLabelPosition = "left", // 'left' or 'right'
  // Bar rounding/border radius
  barBorderRadius = 0, // Border radius for all bars (number or array)
  barBorderRadiusTop = null, // Top border radius override
  barBorderRadiusBottom = null, // Bottom border radius override
  ...props
}) => {
  // Theme configurations
  const themes = {
    dark: {
      textColor: "#A0A0A0",
      backgroundColor: "transparent",
      gridColor: "rgba(75, 192, 192, 0.2)",
      tooltipBg: "rgba(30, 33, 40, 0.9)",
    },
    light: {
      textColor: "#666666",
      backgroundColor: "transparent",
      gridColor: "rgba(0, 0, 0, 0.1)",
      tooltipBg: "rgba(255, 255, 255, 0.95)",
    },
  };

  const currentTheme = themes[theme] || themes.dark;

  // Determine orientation early to use in calculations
  const isHorizontal = orientation === "horizontal";

  // Handle both single series (flat array) and multi-series (array of arrays)
  const isMultiSeries =
    Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);
  const allDataPoints = isMultiSeries
    ? data.flat()
    : Array.isArray(data)
    ? data
    : [];

  // Calculate min/max if not provided
  const hasData = allDataPoints.length > 0;
  const calculatedMin =
    min !== undefined ? min : hasData ? Math.min(...allDataPoints) * 0.9 : 0;
  const calculatedMax =
    max !== undefined ? max : hasData ? Math.max(...allDataPoints) * 1.1 : 100;

  // Calculate intervals based on tick parameters
  let calculatedInterval = interval;
  if (!calculatedInterval) {
    const tickInterval = isHorizontal ? xAxisTickInterval : yAxisTickInterval;
    const tickCount = isHorizontal ? xAxisTickCount : yAxisTickCount;

    if (tickInterval) {
      calculatedInterval = tickInterval;
    } else if (tickCount && tickCount > 0) {
      calculatedInterval = (calculatedMax - calculatedMin) / tickCount;
    } else {
      calculatedInterval = Math.ceil((calculatedMax - calculatedMin) / 5) || 20;
    }
  }

  // Calculate category axis tick interval
  let calculatedCategoryInterval = null;
  const categoryTickInterval = isHorizontal
    ? yAxisTickInterval
    : xAxisTickInterval;
  const categoryTickCount = isHorizontal ? yAxisTickCount : xAxisTickCount;

  if (categoryTickInterval && Array.isArray(labels)) {
    calculatedCategoryInterval = categoryTickInterval;
  } else if (categoryTickCount && Array.isArray(labels) && labels.length > 0) {
    calculatedCategoryInterval = Math.max(
      1,
      Math.floor(labels.length / categoryTickCount)
    );
  }

  // Determine tick line colors
  const defaultTickColor = currentTheme.gridColor;
  const finalTickLineColor = tickLineColor || defaultTickColor;

  // Default colors for multiple series
  const defaultColors = [
    "#6DD400",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
  ];
  const getSeriesColor = (index) => {
    if (Array.isArray(colors) && colors.length > index && colors[index]) {
      return colors[index];
    }
    if (!isMultiSeries) return color || "#6DD400";
    return defaultColors[index % defaultColors.length];
  };

  // Helper function to get border radius for bars
  const getBarBorderRadius = (isHorizontal) => {
    // If specific top/bottom overrides are provided, use them
    if (barBorderRadiusTop !== null || barBorderRadiusBottom !== null) {
      if (isHorizontal) {
        // For horizontal bars: top/bottom become right/left
        return [
          barBorderRadiusBottom || barBorderRadius, // top-left -> left
          barBorderRadiusTop || barBorderRadius, // top-right -> right
          barBorderRadiusTop || barBorderRadius, // bottom-right -> right
          barBorderRadiusBottom || barBorderRadius, // bottom-left -> left
        ];
      } else {
        // For vertical bars: normal top/bottom
        return [
          barBorderRadiusTop || barBorderRadius, // top-left
          barBorderRadiusTop || barBorderRadius, // top-right
          barBorderRadiusBottom || barBorderRadius, // bottom-right
          barBorderRadiusBottom || barBorderRadius, // bottom-left
        ];
      }
    }

    // If barBorderRadius is an array, use it directly
    if (Array.isArray(barBorderRadius)) {
      return barBorderRadius;
    }

    // If it's a single number, apply to all corners
    return barBorderRadius;
  };

  const echartOption = {
    textStyle: {
      color: currentTheme.textColor,
    },
    backgroundColor: backgroundColor || currentTheme.backgroundColor,
    title: showTitle
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
    grid: {
      left: 0,
      right: 0,
      top: showTitle && title ? 30 : 0,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
      type: isHorizontal ? "value" : "category",
      data: isHorizontal ? undefined : Array.isArray(labels) ? labels : [],
      min: isHorizontal ? calculatedMin : undefined,
      max: isHorizontal ? calculatedMax : undefined,
      interval: isHorizontal
        ? calculatedInterval
        : calculatedCategoryInterval || "auto",
      position: xAxisLabelPosition, // 'top' or 'bottom'
      axisLabel: {
        show: showXAxisLabels,
        color: currentTheme.textColor,
        fontSize: 11,
        interval: isHorizontal ? "auto" : calculatedCategoryInterval || "auto",
        formatter: isHorizontal
          ? function (value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + "K";
              }
              return value;
            }
          : undefined,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: showXAxisTicks,
        lineStyle: {
          color: finalTickLineColor,
          type: tickLineStyle,
          width: tickLineWidth,
        },
      },
    },
    yAxis: {
      type: isHorizontal ? "category" : "value",
      data: isHorizontal ? (Array.isArray(labels) ? labels : []) : undefined,
      min: isHorizontal ? undefined : calculatedMin,
      max: isHorizontal ? undefined : calculatedMax,
      interval: isHorizontal
        ? calculatedCategoryInterval || "auto"
        : calculatedInterval,
      position: yAxisLabelPosition, // 'left' or 'right'
      axisLabel: {
        show: showYAxisLabels,
        color: currentTheme.textColor,
        fontSize: 11,
        interval: isHorizontal ? calculatedCategoryInterval || "auto" : "auto",
        formatter: isHorizontal
          ? undefined
          : function (value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + "K";
              }
              return value;
            },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: showYAxisTicks,
        lineStyle: {
          color: finalTickLineColor,
          type: tickLineStyle,
          width: tickLineWidth,
        },
      },
    },
    series: isMultiSeries
      ? (Array.isArray(data) ? data : []).map((seriesData, index) => {
          const seriesColor = getSeriesColor(index);
          const seriesName =
            (Array.isArray(seriesNames) && seriesNames[index]) ||
            `Series ${index + 1}`;
          const validSeriesData = Array.isArray(seriesData) ? seriesData : [];

          return {
            name: seriesName,
            type: "bar",
            data: validSeriesData,
            itemStyle: {
              color: seriesColor,
              borderRadius: getBarBorderRadius(isHorizontal),
            },
            label: showValues
              ? {
                  show: true,
                  position: isHorizontal ? "right" : "top",
                  color: currentTheme.textColor,
                  fontSize: 10,
                }
              : undefined,
            emphasis: {
              disabled: true, // Disable hover effects
            },
          };
        })
      : [
          {
            name: "Value",
            type: "bar",
            data: Array.isArray(data)
              ? data.map((value, index) => {
                  // Support per-bar colors for highlighting specific bars (e.g., current day)
                  if (Array.isArray(colors) && colors.length > 0) {
                    return {
                      value: value,
                      itemStyle: {
                        color: colors[index] || color || "#6DD400",
                      },
                    };
                  }
                  return value;
                })
              : [],
            itemStyle: {
              // This is used as fallback when colors array is not provided
              color: color || "#6DD400",
              borderRadius: getBarBorderRadius(isHorizontal),
            },
            label: showValues
              ? {
                  show: true,
                  position: isHorizontal ? "right" : "top",
                  color: currentTheme.textColor,
                  fontSize: 10,
                }
              : undefined,
            emphasis: {
              disabled: true, // Disable hover effects
            },
          },
        ],
    animation: false, // Disable all animations for static mode
  };

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
          renderer: "canvas",
          width: "auto",
          height: "auto",
        }}
        notMerge={true}
        lazyUpdate={true}
        {...props}
      />
    </div>
  );
};
