import React from "react";
import ReactECharts from "echarts-for-react";

export const RadarChart = ({
  title = "Radar Chart",
  showTitle = false,
  data = [],
  labels = [],
  labelSize = 11,
  indicators = [],
  color = "#6DD400",
  colors = [],
  seriesNames = [],
  backgroundColor = "transparent",
  theme = "dark",
  showValues = false,
  showLegend = false,
  legendPosition = "bottom",
  // Radar specific options
  radarShape = "polygon", // 'polygon' or 'circle'
  splitNumber = 5,
  smooth = false, // Enable smooth curves for rounded corners
  axisName = {},
  center = ["50%", "50%"],
  radius = "75%",
  startAngle = 90,
  // Visual customization
  areaOpacity = 0.3,
  lineWidth = 2,
  pointSize = 4,
  showPoints = false,
  splitLineStyle = "solid",
  axisLineStyle = "solid",
  gridColor,
  textColor,
  // Enhanced gradient support
  gradient = false,
  gradientIntensity = 0.3,
  gradientStartColor,
  gradientEndColor,
  gradientStops,
  // Min/max for indicator validation
  min,
  max,
  // Marker customization
  showMarkers = false,
  markerStyle = "circle",
  markerSize = 4,
  markerColor,
  markerBorderColor,
  markerBorderWidth = 2,
  // Sizing
  width = "100%",
  height = "100%",
  minWidth = 200,
  minHeight = 200,
  ...props
}) => {
  // Theme configurations
  const themes = {
    dark: {
      textColor: "#A0A0A0",
      backgroundColor: "transparent",
      gridColor: "rgba(75, 192, 192, 0.2)",
      axisLineColor: "rgba(160, 160, 160, 0.5)",
    },
    light: {
      textColor: "#666666",
      backgroundColor: "transparent",
      gridColor: "rgba(0, 0, 0, 0.1)",
      axisLineColor: "rgba(102, 102, 102, 0.5)",
    },
  };

  const currentTheme = themes[theme] || themes.dark;
  const finalTextColor = textColor || currentTheme.textColor;
  const finalGridColor = gridColor || currentTheme.gridColor;

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
    if (data.length === 1) return color || "#6DD400";
    return defaultColors[index % defaultColors.length];
  };

  // Generate radar indicators with min/max validation
  const radarIndicators =
    indicators.length > 0
      ? indicators.map((indicator) => ({
          ...indicator,
          min: min !== undefined ? min : indicator.min || 0,
          max: max !== undefined ? max : indicator.max || 100,
        }))
      : labels.length > 0
      ? labels.map((label) => ({
          name: label,
          min: min !== undefined ? min : 0,
          max: max !== undefined ? max : 100,
        }))
      : data.length > 0 && Array.isArray(data[0])
      ? data[0].map((_, index) => ({
          name: `Indicator ${index + 1}`,
          min: min !== undefined ? min : 0,
          max: max !== undefined ? max : 100,
        }))
      : [];

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

  // Generate gradient configuration for radar area
  const generateGradientConfig = (baseColor, seriesIndex = 0) => {
    if (!gradient) return baseColor;

    // If custom gradient stops are provided and properly formatted, use them
    if (
      Array.isArray(gradientStops) &&
      gradientStops.length > 0 &&
      typeof gradientStops[0] === "object" &&
      gradientStops[0].hasOwnProperty("offset")
    ) {
      return {
        type: "radial",
        x: 0.5,
        y: 0.5,
        r: 0.8,
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

    // Convert intensity to hex opacity values
    const intensityHex = Math.round(validIntensity * 255)
      .toString(16)
      .padStart(2, "0");

    return {
      type: "radial",
      x: 0.4,
      y: 0.4,
      r: 0.8,
      colorStops: [
        { offset: 0, color: `${startColor}FF` },
        { offset: 1, color: `${endColor}${intensityHex}` },
      ],
    };
  };

  // Helper 1: Calculate max width before wrapping based on font size
  // e.g., if font is 10px, allow 70px width (approx 7 letters) before wrapping
  const smartLabelWidth = labelSize * 7;

  // Helper 2: Dynamic Radius Logic
  // If we have "clutter" (legend/title), shrink radius to 65% default
  const smartRadius = showTitle || showLegend ? "65%" : radius;

  // Helper 3: Dynamic Center Logic
  // Moves chart up/down based on where the legend is
  const smartCenter = (() => {
    // If user passed a custom center (not 50%), trust them
    if (center[1] !== "50%") return center;

    if (showTitle || (showLegend && legendPosition === "top")) {
      return [center[0], "60%"]; // Push down away from top title
    }
    if (showLegend && legendPosition === "bottom") {
      return [center[0], "4%"]; // Push up away from bottom legend
    }
    return center;
  })();

  // Handle both single series and multi-series data
  const isMultiSeries =
    Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);

  const formatSeriesData = () => {
    if (!isMultiSeries) {
      // Single series - data is a flat array
      return [
        {
          name: seriesNames[0] || "Value",
          value: Array.isArray(data) ? data : [],
          itemStyle: {
            color: markerColor || getSeriesColor(0),
            borderColor: markerBorderColor || getSeriesColor(0),
            borderWidth: showMarkers ? markerBorderWidth : 0,
          },
          lineStyle: {
            color: getSeriesColor(0),
            width: lineWidth,
          },
          areaStyle: {
            color: generateGradientConfig(getSeriesColor(0), 0),
            opacity: areaOpacity,
          },
        },
      ];
    } else {
      // Multi-series - data is array of arrays
      return data.map((seriesData, index) => ({
        name: seriesNames[index] || `Series ${index + 1}`,
        value: Array.isArray(seriesData) ? seriesData : [],
        itemStyle: {
          color: markerColor || getSeriesColor(index),
          borderColor: markerBorderColor || getSeriesColor(index),
          borderWidth: showMarkers ? markerBorderWidth : 0,
        },
        lineStyle: {
          color: getSeriesColor(index),
          width: lineWidth,
        },
        areaStyle: {
          color: generateGradientConfig(getSeriesColor(index), index),
          opacity: areaOpacity,
        },
      }));
    }
  };

  const echartOption = {
    textStyle: {
      color: finalTextColor,
    },
    backgroundColor: backgroundColor || currentTheme.backgroundColor,
    title: showTitle
      ? {
          text: title,
          left: "center",
          top: 10,
          textStyle: {
            color: finalTextColor,
            fontSize: 14,
            fontWeight: "normal",
          },
        }
      : undefined,
    legend: showLegend
      ? {
          show: true,
          orient:
            legendPosition === "left" || legendPosition === "right"
              ? "vertical"
              : "horizontal",
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
              ? "bottom"
              : "auto",
          bottom: legendPosition === "bottom" ? 10 : "auto",
          textStyle: {
            color: finalTextColor,
            fontSize: 12,
          },
          data: isMultiSeries
            ? data.map(
                (_, index) => seriesNames[index] || `Series ${index + 1}`
              )
            : [seriesNames[0] || "Value"],
        }
      : { show: false },
    tooltip: {
      show: false, // Disable tooltips for static mode
    },
    radar: {
      indicator: radarIndicators,
      shape: radarShape,
      splitNumber: splitNumber,
      startAngle: startAngle,

      // USE THE NEW HELPERS HERE
      center: smartCenter,
      radius: smartRadius,

      name: {
        textStyle: {
          color: finalTextColor,

          // 1. Apply the new font size
          fontSize: labelSize,

          // 2. Trigger the overflow logic
          width: smartLabelWidth,
          overflow: "break",
          lineHeight: labelSize + 4, // Adds breathing room between wrapped lines
        },

        // 3. Dynamic Gap: bring text closer if font is small
        nameGap: labelSize < 12 ? 5 : 10,

        // ... keep your existing key reducer
        ...Object.keys(axisName).reduce((acc, key) => {
          if (key !== "formatter") {
            acc[key] = axisName[key];
          }
          return acc;
        }, {}),
      },
      splitLine: {
        lineStyle: {
          color: finalGridColor,
          type: splitLineStyle,
        },
      },
      splitArea: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: currentTheme.axisLineColor,
          type: axisLineStyle,
        },
      },
    },
    series: [
      {
        type: "radar",
        smooth: smooth,
        symbol: showMarkers ? getMarkerSymbol() : "none",
        symbolSize: markerSize || pointSize,
        areaStyle: {
          opacity: areaOpacity,
        },
        lineStyle: {
          width: lineWidth,
        },
        label: {
          show: showValues,
          color: finalTextColor,
          fontSize: 10,
        },
        data: formatSeriesData(),
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
          renderer: "svg",
        }}
        notMerge={true}
        lazyUpdate={true}
        {...props}
      />
    </div>
  );
};
