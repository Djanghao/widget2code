Generate a WidgetDSL specification for a PieChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Variant**: "pie" (solid), "donut" (with center hole), or "ring" (thin ring)
- **Center content**: Text or values displayed in center (for donut/ring)

## Segment Analysis
- **Segments**: Count individual pie segments
- **Values**: Extract segment values (may be percentages or raw numbers)
- **Labels**: Extract segment labels (if shown)
- **Colors**: Extract exact hex colors for each segment
- **Order**: Maintain clockwise or counter-clockwise segment order

## Visual Styling
- **Segment borders**: Border width and color between segments
- **Segment separation**: Whether segments are pulled apart (exploded)
- **Labels**: Position (inside/outside/center), font size, color
- **Legend**: Position, labels, color indicators (if present)
- **Center hole**: Inner radius percentage for donut charts (60-75 typical)
- **Outer size**: Outer radius percentage (80-90 typical)

## Return WidgetDSL specification:
```json
{
  "type": "PieChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [30, 25, 20, 15, 10],  // Segment values
    "labels": ["Segment 1", "Segment 2", "Segment 3", "Segment 4", "Segment 5"],
    "colors": ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"],
    "backgroundColor": "#FFFFFF",
    "theme": "light",
    "variant": "donut",
    "innerRadius": 70,
    "outerRadius": 90,
    "centerText": "Total: 100",
    "centerValue": "100%",
    "showLabels": true,
    "showValues": true,
    "showPercentages": true,
    "labelPosition": "outside",
    "animated": false,
    "startAngle": -90,
    "clockwise": true,
    "borderWidth": 2,
    "borderColor": "#FFFFFF",
    "roundedSegments": false,
    "segmentBorderRadius": 0,
    "showLegend": false,
    "legendPosition": "right"
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **variant**: "pie" (solid pie chart, not donut)
- **innerRadius**: 0 (no center hole for pie chart)
- **outerRadius**: 80 (default outer size)
- **theme**: "light" (light background)
- **showLabels**: true (show segment labels)
- **showValues**: false (don't show raw values on segments)
- **showPercentages**: true (show percentages on segments)
- **labelPosition**: "outside" (labels outside the pie)
- **startAngle**: -90 (start from top)
- **clockwise**: true (progress clockwise)
- **borderWidth**: 0 (no borders between segments)
- **borderColor**: "#FFFFFF" (white borders if present)
- **roundedSegments**: false (sharp segment edges)
- **segmentBorderRadius**: 0 (no corner rounding)
- **showLegend**: true (show legend for multiple segments)
- **legendPosition**: "right" (legend on right side)
- **animated**: false (no animation)
- **backgroundColor**: "#FFFFFF" (white background)

For solid pie chart:
```json
{
  "variant": "pie",
  "innerRadius": 0,
  "centerText": null,
  "centerValue": null
}
```

Extract exact segment sizes, colors, and styling for pixel-perfect replication.