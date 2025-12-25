export { WidgetShell } from "./WidgetShell.jsx";
export { ComponentErrorBoundary } from "./ComponentErrorBoundary.jsx";
export { Text } from "./Text.jsx";
export { Icon } from "./Icon.jsx";
export { Button } from "./Button.jsx";
export { Placeholder } from "./Placeholder.jsx";
export { Sparkline } from "./Sparkline.jsx";
export { AppLogo } from "./AppLogo.jsx";
export { MapImage } from "./MapImage.jsx";
export { Image } from "./Image.jsx";
export { Checkbox } from "./Checkbox.jsx";
export { Indicator } from "./Indicator.jsx";
export { Divider } from "./Divider.jsx";
export { Slider } from "./Slider.jsx";
export { Switch } from "./Switch.jsx";

// Using ECharts with SVG renderer for crisp high-resolution exports
export { LineChart } from "./LineChartECharts.jsx";
export { BarChart } from "./BarChartECharts.jsx";
export { StackedBarChart } from "./StackedBarChartECharts.jsx";
export { RadarChart } from "./RadarChartECharts.jsx";
export { PieChart } from "./PieChartECharts.jsx";
// Alternative: Pure React SVG chart components (no AutoResize issues but less features)
// export { LineChartReact as LineChart } from "./LineChartReact.jsx";
// export { BarChartReact as BarChart } from "./BarChartReact.jsx";
// export { StackedBarChartReact as StackedBarChart } from "./StackedBarChartReact.jsx";
// export { RadarChartReact as RadarChart } from "./RadarChartReact.jsx";
// export { PieChartReact as PieChart } from "./PieChartReact.jsx";
export { ProgressBar } from "./ProgressBar.jsx";
export { ProgressRing } from "./ProgressRing.jsx";

export const AVAILABLE_COMPONENTS = [
  "Text",
  "Icon",
  "Button",
  "Image",
  "Sparkline",
  "AppLogo",
  "MapImage",
  "Checkbox",
  "Indicator",
  "Divider",
  "Slider",
  "Switch",
  "LineChart",
  "BarChart",
  "StackedBarChart",
  "RadarChart",
  "PieChart",
  "ProgressBar",
  "ProgressRing",
];
