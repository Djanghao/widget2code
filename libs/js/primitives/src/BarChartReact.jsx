import React, { useRef, useState, useEffect } from "react";

export const BarChartReact = ({
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

  // Helper function to format large numbers
  const formatValue = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + "K";
    }
    return value;
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
    return [barBorderRadius, barBorderRadius, barBorderRadius, barBorderRadius];
  };

  // Calculate chart dimensions
  const titleHeight = showTitle && title ? 40 : 0;
  const labelFontSize = 11;
  const valueFontSize = 10;

  // Estimate label widths/heights for padding
  const maxYLabelWidth = showYAxisLabels ? 60 : 10;
  const maxXLabelHeight = showXAxisLabels ? 30 : 10;
  const yAxisOffset = yAxisLabelPosition === "right" ? 10 : maxYLabelWidth;
  const xAxisOffset = xAxisLabelPosition === "top" ? 30 : maxXLabelHeight;

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

  const numSeries = seriesData.length;
  const numCategories = Array.isArray(labels) ? labels.length : 0;

  // Use ref to get actual container dimensions for crisp rendering
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    let timeoutId = null;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Cap dimensions at 800px for reasonable rendering while maintaining sharpness
        const newWidth = Math.min(rect.width || 800, 800);
        const newHeight = Math.min(rect.height || 400, 800);

        // Only update if dimensions actually changed (prevent infinite loops)
        setDimensions((prev) => {
          if (
            Math.abs(prev.width - newWidth) < 1 &&
            Math.abs(prev.height - newHeight) < 1
          ) {
            return prev; // No update needed
          }
          return { width: newWidth, height: newHeight };
        });
      }
    };

    // Debounced update function to prevent rapid re-renders
    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 10);
    };

    updateDimensions();

    // Update on resize
    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  const svgWidth = dimensions.width;
  const svgHeight = dimensions.height;

  // Render function
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
        <g transform={`translate(${yAxisOffset}, ${titleHeight})`}>
          {/* Grid Lines */}
          {isHorizontal ? (
            <>
              {/* Horizontal chart - vertical grid lines (X axis) */}
              {showXAxisTicks &&
                Array.from(
                  {
                    length:
                      Math.floor(
                        (calculatedMax - calculatedMin) / calculatedInterval
                      ) + 1,
                  },
                  (_, i) => {
                    const value = calculatedMin + i * calculatedInterval;
                    const x =
                      ((value - calculatedMin) /
                        (calculatedMax - calculatedMin)) *
                      (svgWidth - yAxisOffset - 20);
                    return (
                      <line
                        key={`x-tick-${i}`}
                        x1={x}
                        y1={xAxisLabelPosition === "top" ? xAxisOffset : 0}
                        x2={x}
                        y2={svgHeight - titleHeight - maxXLabelHeight}
                        stroke={finalTickLineColor}
                        strokeWidth={tickLineWidth}
                        strokeDasharray={
                          tickLineStyle === "dashed" ? "5,5" : "none"
                        }
                      />
                    );
                  }
                )}
              {/* Y axis labels (categories) */}
              {showYAxisLabels &&
                labels.map((label, i) => {
                  if (
                    calculatedCategoryInterval !== null &&
                    i % calculatedCategoryInterval !== 0
                  ) {
                    return null;
                  }
                  const barHeight =
                    (svgHeight - titleHeight - maxXLabelHeight - xAxisOffset) /
                    numCategories;
                  const y = i * barHeight + barHeight / 2 + xAxisOffset;
                  return (
                    <text
                      key={`y-label-${i}`}
                      x={
                        yAxisLabelPosition === "right"
                          ? svgWidth - yAxisOffset + 5
                          : -5
                      }
                      y={y}
                      textAnchor={
                        yAxisLabelPosition === "right" ? "start" : "end"
                      }
                      dominantBaseline="middle"
                      fill={currentTheme.textColor}
                      fontSize={labelFontSize}
                    >
                      {label}
                    </text>
                  );
                })}
              {/* X axis labels (values) */}
              {showXAxisLabels &&
                Array.from(
                  {
                    length:
                      Math.floor(
                        (calculatedMax - calculatedMin) / calculatedInterval
                      ) + 1,
                  },
                  (_, i) => {
                    const value = calculatedMin + i * calculatedInterval;
                    const x =
                      ((value - calculatedMin) /
                        (calculatedMax - calculatedMin)) *
                      (svgWidth - yAxisOffset - 20);
                    return (
                      <text
                        key={`x-label-${i}`}
                        x={x}
                        y={
                          xAxisLabelPosition === "top"
                            ? 15
                            : svgHeight - titleHeight - 5
                        }
                        textAnchor="middle"
                        fill={currentTheme.textColor}
                        fontSize={labelFontSize}
                      >
                        {formatValue(value)}
                      </text>
                    );
                  }
                )}
            </>
          ) : (
            <>
              {/* Vertical chart - horizontal grid lines (Y axis) */}
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
                      svgHeight -
                      titleHeight -
                      maxXLabelHeight -
                      ((value - calculatedMin) /
                        (calculatedMax - calculatedMin)) *
                        (svgHeight -
                          titleHeight -
                          maxXLabelHeight -
                          xAxisOffset);
                    return (
                      <line
                        key={`y-tick-${i}`}
                        x1={0}
                        y1={y}
                        x2={svgWidth - yAxisOffset - 20}
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
              {/* X axis labels (categories) */}
              {showXAxisLabels &&
                labels.map((label, i) => {
                  if (
                    calculatedCategoryInterval !== null &&
                    i % calculatedCategoryInterval !== 0
                  ) {
                    return null;
                  }
                  const barWidth =
                    (svgWidth - yAxisOffset - 20) / numCategories;
                  const x = i * barWidth + barWidth / 2;
                  return (
                    <text
                      key={`x-label-${i}`}
                      x={x}
                      y={
                        xAxisLabelPosition === "top"
                          ? 15
                          : svgHeight - titleHeight - 5
                      }
                      textAnchor="middle"
                      fill={currentTheme.textColor}
                      fontSize={labelFontSize}
                    >
                      {label}
                    </text>
                  );
                })}
              {/* Y axis labels (values) */}
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
                      svgHeight -
                      titleHeight -
                      maxXLabelHeight -
                      ((value - calculatedMin) /
                        (calculatedMax - calculatedMin)) *
                        (svgHeight -
                          titleHeight -
                          maxXLabelHeight -
                          xAxisOffset);
                    return (
                      <text
                        key={`y-label-${i}`}
                        x={
                          yAxisLabelPosition === "right"
                            ? svgWidth - yAxisOffset + 5
                            : -5
                        }
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
            </>
          )}

          {/* Bars */}
          {isHorizontal ? (
            // Horizontal bars
            <>
              {labels.map((label, categoryIndex) => {
                const barHeight =
                  (svgHeight - titleHeight - maxXLabelHeight - xAxisOffset) /
                  numCategories;
                const categoryY = categoryIndex * barHeight + xAxisOffset;
                const barGroupHeight = barHeight * 0.8; // Leave some gap
                const individualBarHeight = barGroupHeight / numSeries;

                return seriesData.map((series, seriesIndex) => {
                  const value = series.data[categoryIndex] || 0;
                  const barWidth =
                    ((value - calculatedMin) /
                      (calculatedMax - calculatedMin)) *
                    (svgWidth - yAxisOffset - 20);
                  const barY =
                    categoryY +
                    barHeight * 0.1 +
                    seriesIndex * individualBarHeight;

                  // Get bar color
                  let barColor = series.color;
                  if (
                    !isMultiSeries &&
                    Array.isArray(colors) &&
                    colors.length > 0
                  ) {
                    barColor = colors[categoryIndex] || color || "#6DD400";
                  }

                  // Get border radius
                  const borderRadius = getBarBorderRadius(isHorizontal);

                  return (
                    <g key={`bar-${categoryIndex}-${seriesIndex}`}>
                      {/* Bar with rounded corners */}
                      <rect
                        x={0}
                        y={barY}
                        width={Math.max(0, barWidth)}
                        height={individualBarHeight}
                        fill={barColor}
                        rx={Math.min(...borderRadius)}
                        ry={Math.min(...borderRadius)}
                      />
                      {/* Value label */}
                      {showValues && (
                        <text
                          x={barWidth + 5}
                          y={barY + individualBarHeight / 2}
                          fill={currentTheme.textColor}
                          fontSize={valueFontSize}
                          dominantBaseline="middle"
                        >
                          {value}
                        </text>
                      )}
                    </g>
                  );
                });
              })}
            </>
          ) : (
            // Vertical bars
            <>
              {labels.map((label, categoryIndex) => {
                const barWidth = (svgWidth - yAxisOffset - 20) / numCategories;
                const categoryX = categoryIndex * barWidth;
                const barGroupWidth = barWidth * 0.8; // Leave some gap
                const individualBarWidth = barGroupWidth / numSeries;

                return seriesData.map((series, seriesIndex) => {
                  const value = series.data[categoryIndex] || 0;
                  const barHeight =
                    ((value - calculatedMin) /
                      (calculatedMax - calculatedMin)) *
                    (svgHeight - titleHeight - maxXLabelHeight - xAxisOffset);
                  const barX =
                    categoryX +
                    barWidth * 0.1 +
                    seriesIndex * individualBarWidth;
                  const barY =
                    svgHeight - titleHeight - maxXLabelHeight - barHeight;

                  // Get bar color
                  let barColor = series.color;
                  if (
                    !isMultiSeries &&
                    Array.isArray(colors) &&
                    colors.length > 0
                  ) {
                    barColor = colors[categoryIndex] || color || "#6DD400";
                  }

                  // Get border radius
                  const borderRadius = getBarBorderRadius(isHorizontal);

                  return (
                    <g key={`bar-${categoryIndex}-${seriesIndex}`}>
                      {/* Bar with rounded corners */}
                      <rect
                        x={barX}
                        y={barY}
                        width={individualBarWidth}
                        height={Math.max(0, barHeight)}
                        fill={barColor}
                        rx={Math.min(...borderRadius)}
                        ry={Math.min(...borderRadius)}
                      />
                      {/* Value label */}
                      {showValues && (
                        <text
                          x={barX + individualBarWidth / 2}
                          y={barY - 5}
                          fill={currentTheme.textColor}
                          fontSize={valueFontSize}
                          textAnchor="middle"
                        >
                          {value}
                        </text>
                      )}
                    </g>
                  );
                });
              })}
            </>
          )}
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
