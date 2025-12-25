import React, { useRef, useState, useEffect } from "react";

export const PieChartReact = ({
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
  variant = "pie",
  innerRadius = 0,
  outerRadius = 80,
  centerText = "",
  centerValue = "",
  showLabels = false,
  showValues = false,
  showPercentages = false,
  labelPosition = "outside",
  // Animation and interaction
  animated = false,
  startAngle = 90,
  clockwise = true,
  // Border and styling
  borderWidth = 0,
  borderColor = "#ffffff",
  // Rounded segments
  roundedSegments = false,
  segmentBorderRadius = 10,
  strokeWidth = 3,
  ...props
}) => {
  // Theme configurations
  const themes = {
    dark: {
      textColor: "#A0A0A0",
      backgroundColor: "transparent",
    },
    light: {
      textColor: "#666666",
      backgroundColor: "transparent",
    },
  };

  const currentTheme = themes[theme] || themes.dark;

  // Default colors
  const defaultColors = [
    "#007AFF",
    "#34C759",
    "#FF9500",
    "#FF3B30",
    "#5856D6",
    "#FF2D55",
    "#64D2FF",
    "#5AC8FA",
  ];

  const getColor = (index) => {
    if (Array.isArray(colors) && colors.length > index && colors[index]) {
      return colors[index];
    }
    return defaultColors[index % defaultColors.length];
  };

  // Use ref to get actual container dimensions
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    let timeoutId = null;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const rectWidth = rect.width > 0 ? rect.width : 400;
        const rectHeight = rect.height > 0 ? rect.height : 400;
        const size = Math.min(rectWidth, rectHeight, 800);

        setDimensions((prev) => {
          if (
            Math.abs(prev.width - size) < 1 &&
            Math.abs(prev.height - size) < 1
          ) {
            return prev;
          }
          return { width: size, height: size };
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

  // Calculate total
  const total = Array.isArray(data)
    ? data.reduce((sum, val) => sum + (val || 0), 0)
    : 0;

  // Chart dimensions
  const titleHeight = showTitle && title ? 40 : 0;
  const centerX = svgWidth / 2;
  const centerY = (svgHeight + titleHeight) / 2;

  // Scale radius based on available space
  const maxRadius = Math.min(svgWidth, svgHeight - titleHeight) / 2 - 20;
  const outerR = (outerRadius / 100) * maxRadius;
  const innerR =
    variant === "donut" || variant === "ring"
      ? (innerRadius / 100) * maxRadius
      : 0;

  // Helper to convert degrees to radians
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  // Helper to calculate arc path
  const describeArc = (
    startAngleDeg,
    endAngleDeg,
    outerRadius,
    innerRadius = 0
  ) => {
    // Adjust for our coordinate system (90° = top)
    const adjustedStart = startAngleDeg - 90;
    const adjustedEnd = endAngleDeg - 90;

    const start = toRadians(adjustedStart);
    const end = toRadians(adjustedEnd);

    const x1 = centerX + outerRadius * Math.cos(start);
    const y1 = centerY + outerRadius * Math.sin(start);
    const x2 = centerX + outerRadius * Math.cos(end);
    const y2 = centerY + outerRadius * Math.sin(end);

    const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

    if (innerRadius === 0) {
      // Pie slice
      return `M ${centerX},${centerY} L ${x1},${y1} A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${x2},${y2} Z`;
    } else {
      // Donut slice
      const x3 = centerX + innerRadius * Math.cos(end);
      const y3 = centerY + innerRadius * Math.sin(end);
      const x4 = centerX + innerRadius * Math.cos(start);
      const y4 = centerY + innerRadius * Math.sin(start);

      return `M ${x1},${y1} A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x4},${y4} Z`;
    }
  };

  const renderChart = () => {
    let currentAngle = startAngle;
    const angleDirection = clockwise ? 1 : -1;

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
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

        {/* Pie segments */}
        {data.map((value, index) => {
          if (!value || value <= 0) return null;

          const percentage = (value / total) * 100;
          const angle = (percentage / 100) * 360 * angleDirection;
          const endAngle = currentAngle + angle;

          const path = describeArc(currentAngle, endAngle, outerR, innerR);
          const segmentColor = getColor(index);

          // Calculate label position
          const midAngle = (currentAngle + endAngle) / 2 - 90;
          const labelRadius = outerR + 20;
          const labelX = centerX + labelRadius * Math.cos(toRadians(midAngle));
          const labelY = centerY + labelRadius * Math.sin(toRadians(midAngle));

          const segment = (
            <g key={`segment-${index}`}>
              <path
                d={path}
                fill={segmentColor}
                stroke={borderColor}
                strokeWidth={borderWidth || strokeWidth}
              />

              {/* Labels */}
              {showLabels && labels[index] && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={currentTheme.textColor}
                  fontSize="11"
                >
                  {labels[index]}
                  {showPercentages && ` (${percentage.toFixed(0)}%)`}
                </text>
              )}
            </g>
          );

          currentAngle = endAngle;
          return segment;
        })}

        {/* Center text for donut charts */}
        {(variant === "donut" || variant === "ring") &&
          (centerText || centerValue) && (
            <g>
              {centerValue && (
                <text
                  x={centerX}
                  y={centerY - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={currentTheme.textColor}
                  fontSize="24"
                  fontWeight="700"
                >
                  {centerValue}
                </text>
              )}
              {centerText && (
                <text
                  x={centerX}
                  y={centerY + (centerValue ? 15 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={currentTheme.textColor}
                  fontSize="12"
                >
                  {centerText}
                </text>
              )}
            </g>
          )}
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
