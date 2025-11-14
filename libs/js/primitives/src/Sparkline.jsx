import React from "react";
import { LineChart } from "./LineChartECharts.jsx";

export function Sparkline({
  width = 80,
  height = 40,
  color = "#34C759",
  data = [],
  showArea = false,
  smooth = false,
  baseline = null,
  gradientIntensity = 0.4,
  min,
  max,
  lineWidth = 2,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  // Build props for LineChart
  const lineChartProps = {
    color,
    data,
    showArea,
    smooth,
    gradientIntensity,
    min,
    max,
    lineWidth,
    // Fixed configuration for sparkline behavior
    width: "100%",
    height: "100%",
    minWidth: width,
    minHeight: height,
    theme: "dark",
    showMarkers: false,
    showXAxisLabels: false,
    showYAxisLabels: false,
    showXAxisTicks: false,
    showYAxisTicks: false,
    backgroundColor: "transparent",
  };

  // Add baseline as X-axis trendline if provided
  if (baseline !== null && baseline !== undefined) {
    lineChartProps.showXTrendline = true;
    lineChartProps.xTrendlineValue = baseline;
    lineChartProps.xTrendlineColor = color;
    lineChartProps.xTrendlineStyle = "dashed";
    lineChartProps.xTrendlineWidth = 1;
    lineChartProps.xTrendlineLabel = "";
  }

  // Build container style
  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    display: "block",
    flexShrink: 0,
    ...style,
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(flexBasis !== undefined ? { flexBasis } : {}),
  };

  return (
    <div style={containerStyle} {...rest}>
      <LineChart {...lineChartProps} />
    </div>
  );
}
