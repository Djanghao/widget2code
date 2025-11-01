Generate a WidgetDSL specification for a Sparkline component in this image.

Focus on extracting these elements:

## Data Analysis
- **Data points**: Extract the trend values (typically 10-15 points)
- **Pattern**: Note the overall trend (up, down, volatile)
- **Start/End values**: Identify first and last data points
- **Min/Max points**: Note if specific points are highlighted

## Visual Styling
- **Line**: Color, thickness (lineWidth), style (solid/dashed)
- **Area fill**: Fill color under the line (if present)
- **Width/Height**: Overall dimensions of the sparkline
- **Highlighting**: Special styling for min/max points
- **Smooth vs straight**: Whether the line is smoothed or straight between points

## Context & Labels
- **Trend indicators**: Arrows or symbols showing direction
- **Value labels**: Current value shown beside or on the sparkline
- **Background**: Any background color or styling

## Return WidgetDSL specification:
```json
{
  "type": "Sparkline",
  "spec": {
    "data": [10, 15, 12, 25, 20, 35, 30, 45, 40, 55, 50, 65, 60, 75, 70],
    "width": 120,
    "height": 40,
    "lineColor": "#3B82F6",
    "lineWidth": 2,
    "fillColor": "#3B82F6",  // Optional area fill
    "fillOpacity": 0.2,
    "highlightMin": false,  // Highlight minimum point
    "highlightMax": true,   // Highlight maximum point
    "highlightColor": "#EF4444",
    "smooth": true,  // Smooth curve vs straight lines
    "showPoints": false,  // Show data point markers
    "pointSize": 3,
    "showTrend": true,  // Show trend arrow
    "trendColor": "#10B981",
    "backgroundColor": "transparent"
  }
}
```

## Default Behavior (when not visible in image):
- **width**: 120 (default width in pixels)
- **height**: 40 (default height in pixels)
- **lineColor**: "#3B82F6" (blue primary color)
- **lineWidth**: 2 (medium thickness line)
- **fillColor**: null (no area fill by default)
- **fillOpacity**: 0.2 (semi-transparent fill if present)
- **highlightMin**: false (don't highlight minimum point)
- **highlightMax**: false (don't highlight maximum point)
- **highlightColor**: "#EF4444" (red highlight color)
- **smooth**: false (straight lines between points)
- **showPoints**: false (don't show point markers)
- **pointSize**: 3 (small point size)
- **showTrend**: false (don't show trend arrow)
- **trendColor**: "#10B981" (green for positive trend)
- **backgroundColor**: "transparent" (no background)

For different styles:
```json
{
  "data": [20, 18, 22, 25, 21, 28, 26, 30],  // Fewer points
  "width": 80,
  "height": 24,
  "lineWidth": 1.5,
  "fillColor": null,  // No area fill
  "smooth": false,  // Straight lines
  "showPoints": true
}
```

For with current value label:
```json
{
  "showValue": true,
  "valuePosition": "right",  // Or "end", "above"
  "valueColor": "#333333",
  "valueFontSize": 12,
  "valueFormat": "percentage"  // Or "number", "change"
}
```

Extract exact data points, dimensions, colors, and styling for pixel-perfect replication.