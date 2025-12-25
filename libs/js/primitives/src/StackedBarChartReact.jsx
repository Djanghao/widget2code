import React, { useRef, useState, useEffect } from "react";

export const StackedBarChartReact = ({
  title = "Stacked Bar Chart",
  showTitle = false,
  data = [],
  labels = [],
  color = "#6DD400",
  colors = [],
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
  orientation = "vertical",
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
  xAxisLabelPosition = "bottom",
  yAxisLabelPosition = "left",
  // Bar rounding/border radius
  barBorderRadius = 0,
  barBorderRadiusTop = null,
  barBorderRadiusBottom = null,
  // Stacked bar specific options
  stackName = "stack",
  showTotal = false,
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

  // Determine orientation
  const isHorizontal = orientation === "horizontal";

  // Calculate totals for each category
  const categoryTotals = Array.isArray(labels)
    ? labels.map((_, categoryIndex) => {
        return data.reduce((sum, series) => {
          const value =
            Array.isArray(series) && series[categoryIndex]
              ? series[categoryIndex]
              : 0;
          return sum + value;
        }, 0);
      })
    : [];

  const allValues = [...categoryTotals, ...data.flat()].filter(
    (v) => v != null
  );
  const hasData = allValues.length > 0;

  // Calculate min/max
  const calculatedMin = min !== undefined ? min : 0;
  const calculatedMax =
    max !== undefined ? max : hasData ? Math.max(...categoryTotals) * 1.1 : 100;

  // Calculate intervals
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
    "#007AFF",
    "#34C759",
    "#FF9500",
    "#FF3B30",
    "#5856D6",
    "#FF2D55",
  ];
  const getSeriesColor = (index) => {
    if (Array.isArray(colors) && colors.length > index && colors[index]) {
      return colors[index];
    }
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

  // Helper function to get border radius
  const getBarBorderRadius = (isHorizontal) => {
    if (barBorderRadiusTop !== null || barBorderRadiusBottom !== null) {
      if (isHorizontal) {
        return [
          barBorderRadiusBottom || barBorderRadius,
          barBorderRadiusTop || barBorderRadius,
          barBorderRadiusTop || barBorderRadius,
          barBorderRadiusBottom || barBorderRadius,
        ];
      } else {
        return [
          barBorderRadiusTop || barBorderRadius,
          barBorderRadiusTop || barBorderRadius,
          barBorderRadiusBottom || barBorderRadius,
          barBorderRadiusBottom || barBorderRadius,
        ];
      }
    }

    if (Array.isArray(barBorderRadius)) {
      return barBorderRadius;
    }

    return [barBorderRadius, barBorderRadius, barBorderRadius, barBorderRadius];
  };

  // Use ref to get actual container dimensions
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    let timeoutId = null;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const rectWidth = rect.width > 0 ? rect.width : 800;
        const rectHeight = rect.height > 0 ? rect.height : 400;
        const newWidth = Math.min(rectWidth, 800);
        const newHeight = Math.min(rectHeight, 800);

        setDimensions((prev) => {
          if (
            Math.abs(prev.width - newWidth) < 1 &&
            Math.abs(prev.height - newHeight) < 1
          ) {
            return prev;
          }
          return { width: newWidth, height: newHeight };
        });
      }
    };

    const debouncedUpdate = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(updateDimensions, 50);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resizeObserver.disconnect();
    };
  }, []);

  const svgWidth = dimensions.width;
  const svgHeight = dimensions.height;

  // Chart dimensions
  const titleHeight = showTitle && title ? 40 : 0;
  const labelFontSize = 11;
  const valueFontSize = 10;
  const maxYLabelWidth = showYAxisLabels ? 60 : 10;
  const maxXLabelHeight = showXAxisLabels ? 30 : 10;
  const yAxisOffset = yAxisLabelPosition === "right" ? 10 : maxYLabelWidth;
  const xAxisOffset = xAxisLabelPosition === "top" ? 30 : maxXLabelHeight;

  const numCategories = Array.isArray(labels) ? labels.length : 0;
  const numSeries = Array.isArray(data) ? data.length : 0;

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
          maxWidth: "100%",
          maxHeight: "100%",
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

          {/* Stacked Bars */}
          {isHorizontal ? (
            // Horizontal stacked bars
            <>
              {labels.map((label, categoryIndex) => {
                const barHeight =
                  (svgHeight - titleHeight - maxXLabelHeight - xAxisOffset) /
                  numCategories;
                const categoryY = categoryIndex * barHeight + xAxisOffset;
                const barActualHeight = barHeight * 0.8;
                const barY = categoryY + barHeight * 0.1;

                let currentX = 0;

                return data.map((series, seriesIndex) => {
                  const value =
                    Array.isArray(series) && series[categoryIndex]
                      ? series[categoryIndex]
                      : 0;
                  const barWidth =
                    ((value - calculatedMin) /
                      (calculatedMax - calculatedMin)) *
                    (svgWidth - yAxisOffset - 20);

                  const barColor = getSeriesColor(seriesIndex);
                  const segmentX = currentX;
                  currentX += barWidth;

                  const borderRadius = getBarBorderRadius(isHorizontal);

                  return (
                    <g key={`bar-${categoryIndex}-${seriesIndex}`}>
                      <rect
                        x={segmentX}
                        y={barY}
                        width={Math.max(0, barWidth)}
                        height={barActualHeight}
                        fill={barColor}
                        rx={Math.min(...borderRadius)}
                        ry={Math.min(...borderRadius)}
                      />
                    </g>
                  );
                });
              })}
            </>
          ) : (
            // Vertical stacked bars
            <>
              {labels.map((label, categoryIndex) => {
                const barWidth = (svgWidth - yAxisOffset - 20) / numCategories;
                const categoryX = categoryIndex * barWidth;
                const barActualWidth = barWidth * 0.8;
                const barX = categoryX + barWidth * 0.1;

                const total = categoryTotals[categoryIndex];
                let currentY = svgHeight - titleHeight - maxXLabelHeight;

                return data.map((series, seriesIndex) => {
                  const value =
                    Array.isArray(series) && series[categoryIndex]
                      ? series[categoryIndex]
                      : 0;
                  const barHeight =
                    ((value - calculatedMin) /
                      (calculatedMax - calculatedMin)) *
                    (svgHeight - titleHeight - maxXLabelHeight - xAxisOffset);

                  const barColor = getSeriesColor(seriesIndex);
                  const segmentY = currentY - barHeight;
                  currentY -= barHeight;

                  const borderRadius = getBarBorderRadius(isHorizontal);

                  return (
                    <g key={`bar-${categoryIndex}-${seriesIndex}`}>
                      <rect
                        x={barX}
                        y={segmentY}
                        width={barActualWidth}
                        height={Math.max(0, barHeight)}
                        fill={barColor}
                        rx={Math.min(...borderRadius)}
                        ry={Math.min(...borderRadius)}
                      />
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
        width: width,
        height: height,
        maxWidth: "100%",
        maxHeight: "100%",
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
      {renderChart()}
    </div>
  );
};
