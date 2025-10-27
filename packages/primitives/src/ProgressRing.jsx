import React from "react";

export const ProgressRing = ({
  value = 0,
  max = 100,
  min = 0,
  size = 120,
  strokeWidth = 8,
  color = "#28a745",
  backgroundColor = "#e9ecef",
  showValue = false,
  showLabel = false,
  label,
  minWidth = 80,
  minHeight = 80,
  variant, // Keep for backward compatibility but deprecated
  animated = false, // Default to false for static mode
  lineCap = "round", // 'round', 'square', 'butt'
  direction = "clockwise", // 'clockwise', 'counterclockwise'
  startAngle = -90, // Start angle in degrees
  arcAngle = 360, // Total arc span in degrees (360 for full circle, less for gauge)
  endAngle, // Alternative to arcAngle - if provided, arcAngle = endAngle - startAngle
  gradient = false,
  gradientColors = [],
  ...props
}) => {
  // Normalize value between min and max
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  // Color variants for backward compatibility
  const colorVariants = {
    default: "#28a745",
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8",
    primary: "#007bff",
  };

  // Use color prop directly, fallback to variant if color not provided and variant exists
  const currentColor =
    color || (variant && colorVariants[variant]) || "#28a745";

  // Calculate arc angle (use endAngle if provided, otherwise use arcAngle)
  const totalArcAngle =
    endAngle !== undefined ? endAngle - startAngle : arcAngle;
  const isPartialArc = totalArcAngle < 360;

  // Calculate SVG properties
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  if (isPartialArc) {
    // For partial arcs (gauges), use path-based approach
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = ((startAngle + totalArcAngle) * Math.PI) / 180;
    const progressAngleRad =
      startAngleRad + ((percentage / 100) * totalArcAngle * Math.PI) / 180;

    // Background arc path
    const backgroundStartX = center + radius * Math.cos(startAngleRad);
    const backgroundStartY = center + radius * Math.sin(startAngleRad);
    const backgroundEndX = center + radius * Math.cos(endAngleRad);
    const backgroundEndY = center + radius * Math.sin(endAngleRad);
    const backgroundLargeArc = totalArcAngle > 180 ? 1 : 0;

    // Progress arc path
    const progressEndX = center + radius * Math.cos(progressAngleRad);
    const progressEndY = center + radius * Math.sin(progressAngleRad);
    const progressLargeArc = (percentage / 100) * totalArcAngle > 180 ? 1 : 0;

    var backgroundPath, progressPath;

    if (direction === "clockwise") {
      backgroundPath = `M ${backgroundStartX} ${backgroundStartY} A ${radius} ${radius} 0 ${backgroundLargeArc} 1 ${backgroundEndX} ${backgroundEndY}`;
      progressPath =
        percentage > 0
          ? `M ${backgroundStartX} ${backgroundStartY} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${progressEndX} ${progressEndY}`
          : "";
    } else {
      backgroundPath = `M ${backgroundEndX} ${backgroundEndY} A ${radius} ${radius} 0 ${backgroundLargeArc} 0 ${backgroundStartX} ${backgroundStartY}`;
      progressPath =
        percentage > 0
          ? `M ${backgroundEndX} ${backgroundEndY} A ${radius} ${radius} 0 ${progressLargeArc} 0 ${progressEndX} ${progressEndY}`
          : "";
    }
  } else {
    // For full circles, use the original circle-based approach
    const circumference = 2 * Math.PI * radius;
    var strokeDasharray = circumference;
    var strokeDashoffset = circumference - (percentage / 100) * circumference;
  }

  const formatValue = (val) => {
    if (max === 100 && min === 0) {
      return `${Math.round(val)}%`;
    }
    return `${val}`;
  };

  // Create gradient definition if gradient is enabled
  const gradientId = `progress-gradient-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const useGradient = gradient && gradientColors.length >= 2;
  const gradientDef = useGradient ? (
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        {gradientColors.map((color, index) => (
          <stop
            key={index}
            offset={`${(index / (gradientColors.length - 1)) * 100}%`}
            stopColor={color}
          />
        ))}
      </linearGradient>
    </defs>
  ) : null;

  const progressColor = useGradient ? `url(#${gradientId})` : currentColor;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "100%",
        height: "100%",
        maxWidth: size,
        maxHeight: size,
        minWidth: minWidth,
        minHeight: minHeight,
        boxSizing: "border-box",
        ...props.style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: size,
          maxHeight: size,
          transform: isPartialArc ? "none" : `rotate(${startAngle}deg)`,
          transition: animated ? "transform 0.3s ease" : "none",
        }}
      >
        {gradientDef}

        {isPartialArc ? (
          // Partial arc (gauge) rendering using paths
          <>
            {/* Background arc */}
            <path
              d={backgroundPath}
              fill="none"
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
              strokeLinecap={lineCap}
            />

            {/* Progress arc */}
            {progressPath && (
              <path
                d={progressPath}
                fill="none"
                stroke={progressColor}
                strokeWidth={strokeWidth}
                strokeLinecap={lineCap}
                style={{
                  transition: animated ? "all 0.6s ease-in-out" : "none",
                }}
              />
            )}
          </>
        ) : (
          // Full circle rendering using circles
          <>
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
              strokeLinecap={lineCap}
            />

            {/* Progress circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeLinecap={lineCap}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={
                direction === "clockwise" ? strokeDashoffset : -strokeDashoffset
              }
              style={{
                transition: animated
                  ? "stroke-dashoffset 0.6s ease-in-out"
                  : "none",
                transformOrigin: "center",
              }}
            />
          </>
        )}
      </svg>

      {/* Center content */}
      {(showLabel || showValue) && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {showValue && (
            <div
              style={{
                fontSize: `${size * 0.12}px`,
                fontWeight: "600",
                color: currentColor,
                lineHeight: 1.2,
              }}
            >
              {formatValue(normalizedValue)}
            </div>
          )}
          {showLabel && label && (
            <div
              style={{
                fontSize: `${size * 0.08}px`,
                color: "#666",
                marginTop: "2px",
                lineHeight: 1.2,
              }}
            >
              {label}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
