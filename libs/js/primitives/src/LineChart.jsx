import ReactECharts from "echarts-for-react";

export const LineChart = ({
  title = "Chart",
  showTitle = false,
  data = [],
  labels = [],
  color = "#6DD400",
  colors = [],
  seriesNames = [],
  backgroundColor = "transparent",
  smooth = true,
  showArea = true,
  min,
  max,
  interval,
  height = "100%",
  width = "100%",
  minHeight = 120,
  minWidth = 200,
  theme = "dark",
  // Gradient customization
  gradientIntensity = 0.3,
  gradientStartColor,
  gradientEndColor,
  gradientStops,
  // Marker customization
  showMarkers = false,
  markerStyle = "circle",
  markerSize = 6,
  markerColor,
  markerBorderColor,
  markerBorderWidth = 2,
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
  // Trendline customization
  showXTrendline = false, // X-axis trendline (average/reference line)
  xTrendlineValue, // Custom value for X trendline (if not provided, calculates average)
  xTrendlineColor = "#FF6B6B", // Color for X trendline
  xTrendlineStyle = "dashed", // Line style: 'solid', 'dashed', 'dotted'
  xTrendlineWidth = 2, // Line width
  xTrendlineLabel = "Average", // Label for X trendline
  showYTrendline = false, // Y-axis trendline (current time vertical line)
  yTrendlinePosition, // Position for Y trendline (0-1, if not provided, uses last position)
  yTrendlineColor = "#4ECDC4", // Color for Y trendline
  yTrendlineStyle = "dashed", // Line style: 'solid', 'dashed', 'dotted'
  yTrendlineWidth = 2, // Line width
  yTrendlineLabel = "Current", // Label for Y trendline
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

  // Handle both single series (flat array) and multi-series (array of arrays)
  // Safely check if data is multi-series by checking if first element is an array
  const isMultiSeries =
    Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);
  const allDataPoints = isMultiSeries
    ? data.flat()
    : Array.isArray(data)
    ? data
    : [];

  // Calculate min/max if not provided - handle empty data gracefully
  const hasData = allDataPoints.length > 0;
  const calculatedMin =
    min !== undefined ? min : hasData ? Math.min(...allDataPoints) * 0.9 : 0;
  const calculatedMax =
    max !== undefined ? max : hasData ? Math.max(...allDataPoints) * 1.1 : 100;

  // Calculate intervals based on tick parameters
  let calculatedYInterval = interval;
  if (!calculatedYInterval) {
    if (yAxisTickInterval) {
      calculatedYInterval = yAxisTickInterval;
    } else if (yAxisTickCount && yAxisTickCount > 0) {
      calculatedYInterval = (calculatedMax - calculatedMin) / yAxisTickCount;
    } else {
      calculatedYInterval =
        Math.ceil((calculatedMax - calculatedMin) / 5) || 20;
    }
  }

  // Calculate X-axis tick interval for category axes
  let calculatedXInterval = null;
  if (xAxisTickInterval && Array.isArray(labels)) {
    calculatedXInterval = xAxisTickInterval;
  } else if (xAxisTickCount && Array.isArray(labels) && labels.length > 0) {
    calculatedXInterval = Math.max(
      1,
      Math.floor(labels.length / xAxisTickCount)
    );
  }

  // Determine tick line colors
  const defaultTickColor = currentTheme.gridColor;
  const finalTickLineColor = tickLineColor || defaultTickColor;

  // Calculate trendline values
  const calculateXTrendlineValue = () => {
    if (xTrendlineValue !== undefined) {
      return xTrendlineValue;
    }
    if (hasData) {
      const sum = allDataPoints.reduce(
        (acc, val) => acc + (typeof val === "number" ? val : 0),
        0
      );
      return (
        sum / allDataPoints.filter((val) => typeof val === "number").length
      );
    }
    return (calculatedMin + calculatedMax) / 2;
  };

  const calculateYTrendlinePosition = () => {
    if (yTrendlinePosition !== undefined) {
      return Math.max(0, Math.min(1, yTrendlinePosition));
    }
    // Default to the last position (95% of the way through)
    return 0.95;
  };

  const xTrendlineCalculatedValue = calculateXTrendlineValue();
  const yTrendlineCalculatedPosition = calculateYTrendlinePosition();

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
    // Ensure colors is an array and index is valid
    if (Array.isArray(colors) && colors.length > index && colors[index]) {
      return colors[index];
    }
    if (!isMultiSeries) return color || "#6DD400";
    return defaultColors[index % defaultColors.length];
  };

  // Convert marker style to ECharts symbol type
  const getMarkerSymbol = () => {
    const symbolMap = {
      circle: "circle",
      square: "rect",
      triangle: "triangle",
      diamond: "diamond",
    };
    return symbolMap[markerStyle] || "circle";
  };

  // Generate gradient configuration for area fill
  const generateGradientConfig = (baseColor, seriesIndex = 0) => {
    // If custom gradient stops are provided and properly formatted, use them
    if (
      Array.isArray(gradientStops) &&
      gradientStops.length > 0 &&
      typeof gradientStops[0] === "object" &&
      gradientStops[0].hasOwnProperty("offset")
    ) {
      return {
        type: "linear",
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: gradientStops,
      };
    }

    // Determine start and end colors
    const startColor = gradientStartColor || baseColor;
    const endColor = gradientEndColor || baseColor;

    // Ensure intensity is a valid number between 0 and 1
    const validIntensity = Math.max(
      0,
      Math.min(1, isNaN(gradientIntensity) ? 0.3 : gradientIntensity)
    );

    // Helper function to add opacity to a color
    const addOpacity = (color, opacity) => {
      // If already rgba/hsla, return as-is or replace alpha
      if (color.startsWith("rgba")) {
        // Replace the alpha value
        return color.replace(/[\d.]+\)$/, `${opacity})`);
      }
      if (color.startsWith("rgb")) {
        // Convert rgb to rgba
        return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
      }
      // For hex colors, append hex opacity
      const opacityHex = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0");
      return `${color}${opacityHex}`;
    };

    return {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: addOpacity(startColor, validIntensity) },
        { offset: 1, color: addOpacity(endColor, 0) },
      ],
    };
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
      type: "category",
      boundaryGap: false,
      data: Array.isArray(labels) ? labels : [],
      position: xAxisLabelPosition, // 'top' or 'bottom'
      axisLabel: {
        show: showXAxisLabels,
        color: currentTheme.textColor,
        fontSize: 11,
        interval: calculatedXInterval || "auto",
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
      type: "value",
      min: calculatedMin,
      max: calculatedMax,
      interval: calculatedYInterval,
      position: yAxisLabelPosition, // 'left' or 'right'
      axisLabel: {
        show: showYAxisLabels,
        color: currentTheme.textColor,
        fontSize: 11,
        formatter: function (value) {
          // Format large numbers
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
            type: "line",
            smooth: smooth,
            symbol: getMarkerSymbol(),
            symbolSize: showMarkers ? markerSize : 4,
            showSymbol: showMarkers,
            lineStyle: {
              width: 2,
              color: seriesColor,
            },
            itemStyle: {
              color: markerColor || seriesColor,
              borderColor: markerBorderColor || seriesColor,
              borderWidth: showMarkers ? markerBorderWidth : 0,
            },
            areaStyle: showArea
              ? {
                  color: generateGradientConfig(seriesColor, index),
                }
              : undefined,
            data: validSeriesData,
            emphasis: {
              disabled: true, // Disable hover effects
            },
          };
        })
      : [
          {
            name: "Value",
            type: "line",
            smooth: smooth,
            symbol: getMarkerSymbol(),
            symbolSize: showMarkers ? markerSize : 4,
            showSymbol: showMarkers,
            lineStyle: {
              width: 2,
              color: color,
            },
            itemStyle: {
              color: markerColor || color,
              borderColor: markerBorderColor || color,
              borderWidth: showMarkers ? markerBorderWidth : 0,
            },
            areaStyle: showArea
              ? {
                  color: generateGradientConfig(color, 0),
                }
              : undefined,
            data: Array.isArray(data) ? data : [],
            emphasis: {
              disabled: true, // Disable hover effects
            },
          },
        ],
    animation: false, // Disable all animations for static mode
  };

  // Add trendlines as additional series
  const trendlineSeries = [];

  // X-axis trendline (horizontal average line)
  if (showXTrendline) {
    const dataLength = Array.isArray(labels)
      ? labels.length
      : Array.isArray(data)
      ? data.length
      : 0;
    trendlineSeries.push({
      name: xTrendlineLabel,
      type: "line",
      data: Array(dataLength).fill(xTrendlineCalculatedValue),
      lineStyle: {
        color: xTrendlineColor,
        width: xTrendlineWidth,
        type:
          xTrendlineStyle === "dashed"
            ? "dashed"
            : xTrendlineStyle === "dotted"
            ? "dotted"
            : "solid",
      },
      symbol: "none",
      itemStyle: { opacity: 0 },
      areaStyle: { opacity: 0 },
      emphasis: { disabled: true },
      silent: true,
      z: 10, // Render on top
    });
  }

  // Y-axis trendline (vertical current time line) - using markLine
  if (showYTrendline) {
    const baseSeries = echartOption.series[0];
    if (baseSeries) {
      baseSeries.markLine = {
        silent: true,
        symbol: "none",
        label: {
          show: true,
          position: "end",
          formatter: yTrendlineLabel,
          color: yTrendlineColor,
          fontSize: 10,
        },
        lineStyle: {
          color: yTrendlineColor,
          width: yTrendlineWidth,
          type:
            yTrendlineStyle === "dashed"
              ? "dashed"
              : yTrendlineStyle === "dotted"
              ? "dotted"
              : "solid",
        },
        data: [
          {
            xAxis: Math.floor(
              (Array.isArray(labels) ? labels.length : 1) *
                yTrendlineCalculatedPosition
            ),
          },
        ],
      };
    }
  }

  // Add trendline series to the main series array
  echartOption.series = [...echartOption.series, ...trendlineSeries];

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
