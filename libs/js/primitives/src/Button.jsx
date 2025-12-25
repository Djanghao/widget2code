import React from "react";
import { Icon } from "./Icon.jsx";

export function Button({
  icon,
  content,
  backgroundColor = "rgba(59, 130, 246, 1)",
  color = "rgba(255, 255, 255, 1)",
  borderColor = "transparent",
  borderRadius = 8,
  fontSize = 14,
  fontWeight = 500,
  padding,
  paddingX,
  paddingY,
  width,
  height,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor,
    color,
    borderRadius: `${borderRadius}px`,
    fontSize: `${fontSize}px`,
    fontWeight,
    padding: `${padding}px`,
    border: `4px solid ${borderColor}`,
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    ...style,
    // Padding logic: if paddingX/paddingY provided, use them, else fallback to padding
    ...(paddingX !== undefined || paddingY !== undefined
      ? {
          paddingLeft:
            paddingX !== undefined
              ? `${paddingX}px`
              : padding !== undefined
              ? `${padding}px`
              : undefined,
          paddingRight:
            paddingX !== undefined
              ? `${paddingX}px`
              : padding !== undefined
              ? `${padding}px`
              : undefined,
          paddingTop:
            paddingY !== undefined
              ? `${paddingY}px`
              : padding !== undefined
              ? `${padding}px`
              : undefined,
          paddingBottom:
            paddingY !== undefined
              ? `${paddingY}px`
              : padding !== undefined
              ? `${padding}px`
              : undefined,
        }
      : padding !== undefined
      ? { padding: `${padding}px` }
      : {}),
    ...(width !== undefined
      ? { width: typeof width === "number" ? `${width}px` : width }
      : {}),
    ...(height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height }
      : {}),
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(flexBasis !== undefined ? { flexBasis } : {}),
  };

  return (
    <div {...rest} style={buttonStyle}>
      {icon ? (
        <Icon name={icon} size={fontSize * 1.2} color={color} />
      ) : (
        content
      )}
    </div>
  );
}
