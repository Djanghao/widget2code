import React, { useRef, useState, useEffect } from "react";

export const LineChartReact = ({
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
  xAxisLabelPosition = "bottom",
  yAxisLabelPosition = "left",
  // Line customization
  strokeWidth = 2,
  showPoints = false,
  fillArea = false,
  fillOpacity = 0.2,
  ...props
}) => {
  // Theme configurations
  const themes = {
    dark: {
      textColor: "#A0A0A0",
      backgroundColor: "transparent",
      gridColor: "rgba(75, 192, 192, 0.2)",
    },
    light: {
      textColor: "#666666",
      backgroundColor: "transparent",
      gridColor: "rgba(0, 0, 0, 0.1)",
    },
  };

  const currentTheme = themes[theme] || themes.dark;

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

  // Calculate intervals
  let calculatedInterval = interval;
  if (!calculatedInterval) {
    const tickInterval = yAxisTickInterval;
    const tickCount = yAxisTickCount;

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
  const categoryTickInterval = xAxisTickInterval;
  const categoryTickCount = xAxisTickCount;

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

  // Helper function to format large numbers
  const formatValue = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + "K";
    }
    return value;
  };

  // Use ref to get actual container dimensions
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Cap dimensions at 800px for reasonable rendering while maintaining sharpness
        setDimensions({
          width: Math.min(rect.width || 800, 800),
          height: Math.min(rect.height || 400, 800),
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const svgWidth = dimensions.width;
  const svgHeight = dimensions.height;

  // Chart dimensions
  const titleHeight = showTitle && title ? 40 : 0;
  const labelFontSize = 11;
  const maxYLabelWidth = showYAxisLabels ? 60 : 10;
  const maxXLabelHeight = showXAxisLabels ? 30 : 10;
  const yAxisOffset = yAxisLabelPosition === "right" ? 10 : maxYLabelWidth;
  const xAxisOffset = xAxisLabelPosition === "top" ? 30 : maxXLabelHeight;

  const chartWidth = svgWidth - yAxisOffset - 20;
  const chartHeight = svgHeight - titleHeight - maxXLabelHeight - xAxisOffset;

  // Prepare series data
  const seriesData = isMultiSeries
    ? data.map((seriesData, index) => ({
        name:
          (Array.isArray(seriesNames) && seriesNames[index]) ||
          `Series ${index + 1}`,
        data: Array.isArray(seriesData) ? seriesData : [],
        color: getSeriesColor(index),
      }))
    : [
        {
          name: "Value",
          data: Array.isArray(data) ? data : [],
          color: color || "#6DD400",
        },
      ];

  const numCategories = Array.isArray(labels) ? labels.length : 0;

  // Generate line path with optional smoothing
  const generatePath = (dataPoints, smooth = false) => {
    if (!dataPoints || dataPoints.length === 0) return "";

    const points = dataPoints.map((value, index) => {
      const x = (index / Math.max(numCategories - 1, 1)) * chartWidth;
      const y =
        chartHeight -
        ((value - calculatedMin) / (calculatedMax - calculatedMin)) *
          chartHeight;
      return { x, y, value };
    });

    if (!smooth) {
      // Straight lines
      return points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
        .join(" ");
    } else {
      // Smooth bezier curves
      if (points.length < 2) return "";

      let path = `M ${points[0].x},${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const controlX = (current.x + next.x) / 2;

        path += ` Q ${controlX},${current.y} ${controlX},${
          (current.y + next.y) / 2
        }`;
        path += ` Q ${controlX},${next.y} ${next.x},${next.y}`;
      }

      return path;
    }
  };

  // Generate area path (for fill)
  const generateAreaPath = (dataPoints, smooth = false) => {
    const linePath = generatePath(dataPoints, smooth);
    if (!linePath) return "";

    const lastX =
      ((dataPoints.length - 1) / Math.max(numCategories - 1, 1)) * chartWidth;
    return `${linePath} L ${lastX},${chartHeight} L 0,${chartHeight} Z`;
  };

  const renderChart = () => {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
        style={{
          backgroundColor: backgroundColor || currentTheme.backgroundColor,
          display: "block",
        }}
        {...props}
      >
        {/* Title */}
        {showTitle && title && (
          <text
            x={svgWidth / 2}
            y="20"
            textAnchor="middle"
            fill={currentTheme.textColor}
            fontSize="14"
            fontWeight="normal"
          >
            {title}
          </text>
        )}

        {/* Chart Group */}
        <g
          transform={`translate(${yAxisOffset}, ${titleHeight + xAxisOffset})`}
        >
          {/* Y-axis grid lines */}
          {showYAxisTicks &&
            Array.from(
              {
                length:
                  Math.floor(
                    (calculatedMax - calculatedMin) / calculatedInterval
                  ) + 1,
              },
              (_, i) => {
                const value = calculatedMin + i * calculatedInterval;
                const y =
                  chartHeight -
                  ((value - calculatedMin) / (calculatedMax - calculatedMin)) *
                    chartHeight;
                return (
                  <line
                    key={`y-tick-${i}`}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke={finalTickLineColor}
                    strokeWidth={tickLineWidth}
                    strokeDasharray={
                      tickLineStyle === "dashed" ? "5,5" : "none"
                    }
                  />
                );
              }
            )}

          {/* X-axis grid lines */}
          {showXAxisTicks &&
            labels.map((label, i) => {
              if (
                calculatedCategoryInterval !== null &&
                i % calculatedCategoryInterval !== 0
              ) {
                return null;
              }
              const x = (i / Math.max(numCategories - 1, 1)) * chartWidth;
              return (
                <line
                  key={`x-tick-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartHeight}
                  stroke={finalTickLineColor}
                  strokeWidth={tickLineWidth}
                  strokeDasharray={tickLineStyle === "dashed" ? "5,5" : "none"}
                />
              );
            })}

          {/* X-axis labels */}
          {showXAxisLabels &&
            labels.map((label, i) => {
              if (
                calculatedCategoryInterval !== null &&
                i % calculatedCategoryInterval !== 0
              ) {
                return null;
              }
              const x = (i / Math.max(numCategories - 1, 1)) * chartWidth;
              return (
                <text
                  key={`x-label-${i}`}
                  x={x}
                  y={xAxisLabelPosition === "top" ? -10 : chartHeight + 20}
                  textAnchor="middle"
                  fill={currentTheme.textColor}
                  fontSize={labelFontSize}
                >
                  {label}
                </text>
              );
            })}

          {/* Y-axis labels */}
          {showYAxisLabels &&
            Array.from(
              {
                length:
                  Math.floor(
                    (calculatedMax - calculatedMin) / calculatedInterval
                  ) + 1,
              },
              (_, i) => {
                const value = calculatedMin + i * calculatedInterval;
                const y =
                  chartHeight -
                  ((value - calculatedMin) / (calculatedMax - calculatedMin)) *
                    chartHeight;
                return (
                  <text
                    key={`y-label-${i}`}
                    x={yAxisLabelPosition === "right" ? chartWidth + 10 : -10}
                    y={y}
                    textAnchor={
                      yAxisLabelPosition === "right" ? "start" : "end"
                    }
                    dominantBaseline="middle"
                    fill={currentTheme.textColor}
                    fontSize={labelFontSize}
                  >
                    {formatValue(value)}
                  </text>
                );
              }
            )}

          {/* Line series */}
          {seriesData.map((series, seriesIndex) => {
            const seriesColor = series.color;
            const linePath = generatePath(series.data, smooth);
            const areaPath = generateAreaPath(series.data, smooth);

            return (
              <g key={`series-${seriesIndex}`}>
                {/* Area fill */}
                {(fillArea || showArea) && (
                  <path
                    d={areaPath}
                    fill={seriesColor}
                    opacity={fillOpacity || gradientIntensity}
                  />
                )}

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={seriesColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {(showPoints || showMarkers) &&
                  series.data.map((value, index) => {
                    const x =
                      (index / Math.max(numCategories - 1, 1)) * chartWidth;
                    const y =
                      chartHeight -
                      ((value - calculatedMin) /
                        (calculatedMax - calculatedMin)) *
                        chartHeight;

                    return (
                      <circle
                        key={`point-${seriesIndex}-${index}`}
                        cx={x}
                        cy={y}
                        r={markerSize || 4}
                        fill={markerColor || seriesColor}
                        stroke={markerBorderColor || "#fff"}
                        strokeWidth={markerBorderWidth}
                      />
                    );
                  })}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
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
      {renderChart()}
    </div>
  );
};
