export const ProgressBar = ({
  value = 0,
  max = 100,
  min = 0,
  label,
  showValue = false,
  color = "#28a745",
  backgroundColor = "#e9ecef",
  height = "20px",
  width = "100%",
  minWidth = 100,
  minHeight = 20,
  weight = "normal", // 'normal', 'bold', 'light' - affects visual thickness/weight
  borderRadius = "10px",
  animated = false, // Default to false for static mode
  striped = false,
  variant = "default", // 'default', 'success', 'warning', 'error'
  size = "medium", // 'small', 'medium', 'large'
  orientation = "horizontal", // 'horizontal', 'vertical'
  showLabel = false,
  labelPosition = "center", // 'center', 'end', 'top'
  ...props
}) => {
  // Normalize value between min and max
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  // Color variants
  const colorVariants = {
    default: color,
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8",
    primary: "#007bff",
  };

  // Size variants
  const sizeVariants = {
    small: {
      height: "12px",
      fontSize: "10px",
      borderRadius: "6px",
    },
    medium: {
      height: "20px",
      fontSize: "12px",
      borderRadius: "10px",
    },
    large: {
      height: "28px",
      fontSize: "14px",
      borderRadius: "14px",
    },
  };

  // Weight modifiers - affects visual thickness and emphasis
  const weightModifiers = {
    light: {
      heightMultiplier: 0.75,
      borderWidthMultiplier: 0.8,
      opacity: 0.85,
    },
    normal: {
      heightMultiplier: 1.0,
      borderWidthMultiplier: 1.0,
      opacity: 1.0,
    },
    bold: {
      heightMultiplier: 1.25,
      borderWidthMultiplier: 1.2,
      opacity: 1.0,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
  };

  const currentSize = sizeVariants[size] || sizeVariants.medium;
  const currentWeight = weightModifiers[weight] || weightModifiers.normal;
  const currentColor = colorVariants[variant] || color;

  // Apply weight modifiers to size
  const adjustedHeight =
    typeof height === "string" && height.includes("px")
      ? `${parseInt(height) * currentWeight.heightMultiplier}px`
      : height;

  const isVertical = orientation === "vertical";

  const containerStyle = {
    position: "relative",
    width: isVertical ? currentSize.height || adjustedHeight : width,
    height: isVertical ? width : "100%",
    maxHeight: isVertical ? width : adjustedHeight,
    backgroundColor,
    borderRadius: currentSize.borderRadius || borderRadius,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: isVertical ? "flex-end" : "flex-start",
    opacity: currentWeight.opacity,
    boxShadow: currentWeight.boxShadow,
    ...props.style,
  };

  const progressStyle = {
    width: isVertical ? "100%" : `${percentage}%`,
    height: isVertical ? `${percentage}%` : "100%",
    backgroundColor: currentColor,
    borderRadius: "inherit",
    transition: animated ? "all 0.3s ease-in-out" : "none",
    background: striped
      ? `linear-gradient(45deg,
      rgba(255,255,255,0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255,255,255,0.15) 50%,
      rgba(255,255,255,0.15) 75%,
      transparent 75%,
      transparent)`
      : currentColor,
    backgroundSize: striped ? "20px 20px" : "auto",
    animation:
      striped && animated ? "progress-bar-stripes 1s linear infinite" : "none",
    position: isVertical ? "absolute" : "relative",
    bottom: isVertical ? 0 : "auto",
    left: isVertical ? 0 : "auto",
  };

  const labelStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent:
      labelPosition === "center"
        ? "center"
        : labelPosition === "end"
        ? "flex-end"
        : "flex-start",
    fontSize: currentSize.fontSize,
    fontWeight: "600",
    color: percentage > 50 ? "#fff" : "#333",
    textShadow: percentage > 50 ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
    padding: "0",
    zIndex: 2,
    whiteSpace: "nowrap",
  };

  const topLabelStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: "500",
    color: "#333",
    marginBottom: "4px",
    textAlign: "left",
  };

  const formatValue = (val) => {
    if (max === 100 && min === 0) {
      return `${Math.round(val)}%`;
    }
    return `${val}`;
  };

  const displayLabel = label || (showValue ? formatValue(normalizedValue) : "");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        minWidth: minWidth,
        minHeight: minHeight,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: isVertical ? "center" : "stretch",
        justifyContent: "flex-start",
      }}
    >
      {labelPosition === "top" && showLabel && displayLabel && (
        <div
          style={{
            ...topLabelStyle,
            flexShrink: 0,
          }}
        >
          {displayLabel}
        </div>
      )}
      <div
        style={{
          ...containerStyle,
          maxWidth: "100%",
          maxHeight: "100%",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div style={progressStyle} />
        {showLabel && labelPosition !== "top" && displayLabel && (
          <div style={labelStyle}>{displayLabel}</div>
        )}
      </div>
      <style>
        {`
          @keyframes progress-bar-stripes {
            from {
              background-position: 20px 0;
            }
            to {
              background-position: 0 0;
            }
          }
        `}
      </style>
    </div>
  );
};
