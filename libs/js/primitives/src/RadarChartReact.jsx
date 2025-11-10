import React, { useRef, useState, useEffect } from "react";

export const RadarChartReact = ({
  title = "Radar Chart",
  showTitle = false,
  data = [],
  labels = [],
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
  radarShape = "polygon",
  splitNumber = 5,
  smooth = false,
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
  // Min/max
  min = 0,
  max = 100,
  // Marker customization
  showMarkers = false,
  markerSize = 4,
  fillOpacity = 0.3,
  height = "100%",
  width = "100%",
  minHeight = 200,
  minWidth = 200,
  showLabels = true,
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
  const finalTextColor = textColor || currentTheme.textColor;
  const finalGridColor = gridColor || currentTheme.gridColor;

  // Handle both single series (flat array) and multi-series (array of arrays)
  const isMultiSeries =
    Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);

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

  // Chart dimensions
  const titleHeight = showTitle && title ? 40 : 0;
  const centerX = svgWidth / 2;
  const centerY = (svgHeight + titleHeight) / 2;

  // Parse radius
  const maxRadius = Math.min(svgWidth, svgHeight - titleHeight) / 2 - 60;
  const radarRadius =
    typeof radius === "string" && radius.includes("%")
      ? (parseInt(radius) / 100) * maxRadius
      : maxRadius * 0.75;

  const numIndicators = labels.length || data.length || 5;
  const angleStep = (2 * Math.PI) / numIndicators;
  const startAngleRad = ((startAngle - 90) * Math.PI) / 180;

  // Generate polygon points for grid
  const getPolygonPoints = (radiusScale) => {
    const points = [];
    for (let i = 0; i < numIndicators; i++) {
      const angle = startAngleRad + i * angleStep;
      const x = centerX + radarRadius * radiusScale * Math.cos(angle);
      const y = centerY + radarRadius * radiusScale * Math.sin(angle);
      points.push({ x, y });
    }
    return points;
  };

  // Generate data polygon path
  const generateDataPath = (dataValues) => {
    if (!dataValues || dataValues.length === 0) return "";

    const points = dataValues.map((value, i) => {
      const angle = startAngleRad + i * angleStep;
      const normalizedValue = Math.min(
        Math.max((value - min) / (max - min), 0),
        1
      );
      const x = centerX + radarRadius * normalizedValue * Math.cos(angle);
      const y = centerY + radarRadius * normalizedValue * Math.sin(angle);
      return { x, y };
    });

    return (
      points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") +
      " Z"
    );
  };

  const renderChart = () => {
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
            fill={finalTextColor}
            fontSize="14"
            fontWeight="normal"
          >
            {title}
          </text>
        )}

        {/* Grid layers */}
        {Array.from({ length: splitNumber }, (_, i) => {
          const radiusScale = (i + 1) / splitNumber;
          const points = getPolygonPoints(radiusScale);
          const pathD =
            points
              .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x},${p.y}`)
              .join(" ") + " Z";

          return (
            <path
              key={`grid-${i}`}
              d={pathD}
              fill="none"
              stroke={finalGridColor}
              strokeWidth="1"
              strokeDasharray={splitLineStyle === "dashed" ? "3,3" : "none"}
            />
          );
        })}

        {/* Axis lines from center to each indicator */}
        {Array.from({ length: numIndicators }, (_, i) => {
          const angle = startAngleRad + i * angleStep;
          const x = centerX + radarRadius * Math.cos(angle);
          const y = centerY + radarRadius * Math.sin(angle);

          return (
            <line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={finalGridColor}
              strokeWidth="1"
              strokeDasharray={axisLineStyle === "dashed" ? "3,3" : "none"}
            />
          );
        })}

        {/* Indicator labels */}
        {showLabels &&
          labels.map((label, i) => {
            const angle = startAngleRad + i * angleStep;
            const labelRadius = radarRadius + 20;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);

            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={finalTextColor}
                fontSize="11"
              >
                {label}
              </text>
            );
          })}

        {/* Data series */}
        {seriesData.map((series, seriesIndex) => {
          const seriesColor = series.color;
          const dataPath = generateDataPath(series.data);

          return (
            <g key={`series-${seriesIndex}`}>
              {/* Filled area */}
              <path
                d={dataPath}
                fill={seriesColor}
                opacity={fillOpacity || areaOpacity}
              />

              {/* Border line */}
              <path
                d={dataPath}
                fill="none"
                stroke={seriesColor}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {(showPoints || showMarkers) &&
                series.data.map((value, i) => {
                  const angle = startAngleRad + i * angleStep;
                  const normalizedValue = Math.min(
                    Math.max((value - min) / (max - min), 0),
                    1
                  );
                  const x =
                    centerX + radarRadius * normalizedValue * Math.cos(angle);
                  const y =
                    centerY + radarRadius * normalizedValue * Math.sin(angle);

                  return (
                    <circle
                      key={`point-${seriesIndex}-${i}`}
                      cx={x}
                      cy={y}
                      r={markerSize || pointSize}
                      fill={seriesColor}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  );
                })}
            </g>
          );
        })}
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
