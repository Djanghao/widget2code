Generate a WidgetDSL specification for a LineChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Data Series**: Single series or multiple series (multiple lines)
- **Category Labels**: List ALL x-axis labels in exact order
- **Theme**: "light" or "dark" based on background

## Data Extraction
**For single series**: Array of numbers [10, 20, 15, 30, 25]
**For multiple series**: 2D array [[series1], [series2], ...]

- Extract exact y-values for each data point
- Note any missing or null points
- For multiple lines, maintain series order from legend
- Match each series with corresponding x-axis labels

## Axis Configuration - IMPORTANT
**The component automatically calculates axis ranges:**

- **min**: Defaults to 0 for positive values, uses smart rounding for negative values
- **max**: Automatically calculated using smart rounding
  - Applies magnitude-aware rounding (e.g., 65 → 80, 847 → 1000, 23 → 30)
  - Adds 10% padding for better visualization
  - Override by setting explicit `max` value if exact range needed

**Only specify axis values when:**
- Image shows explicit max value (e.g., "0-100" scale)
- Exact intervals are visible (e.g., grid lines every 10 units)
- Otherwise, omit `max` and `interval` to use automatic calculation

## Visual Styling
- **Line properties**: Color (single series) or colors array (multi-series), smooth curves
- **Area fill**: Whether area under line is filled (showArea)
- **Markers**: Point markers visibility, style (circle/square/triangle/diamond), size, colors
- **Grid lines**: Tick line visibility, color, style (solid/dashed/dotted)
- **Axis labels**: Visibility and positioning of x/y axis labels
- **Background**: Chart background color
- **Boundary gap**: Whether to add gap at chart edges

## Trendlines (if visible)
- **X-Axis trendline** (horizontal average line): Color, value, style, label
- **Y-Axis trendline** (vertical current time line): Color, position, style, label

## Return WidgetDSL specification:
```json
{
  "type": "LineChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [10, 20, 15, 30, 25],  // Single series values array
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],  // X-axis categories
    "color": "#6DD400",  // For single series
    "backgroundColor": "transparent",
    "theme": "dark",
    "smooth": true,
    "showArea": true,
    "boundaryGap": true,
    "min": 0,
    "max": 40,
    "interval": 10,
    "showMarkers": true,
    "markerStyle": "circle",
    "markerSize": 6,
    "markerColor": "#6DD400",
    "markerBorderColor": "#FFFFFF",
    "markerBorderWidth": 2,
    "showXAxisTicks": true,
    "showYAxisTicks": true,
    "tickLineColor": "#E0E0E0",
    "tickLineStyle": "dashed",
    "tickLineWidth": 1,
    "showXAxisLabels": true,
    "showYAxisLabels": true,
    "xAxisLabelPosition": "bottom",
    "yAxisLabelPosition": "left"
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **theme**: "dark" (dark theme)
- **backgroundColor**: "transparent" (transparent background)
- **smooth**: true (smooth curves)
- **showArea**: true (area fill enabled)
- **boundaryGap**: true (gap at chart edges)
- **min**: AUTO-CALCULATED (omit unless visible in image)
- **max**: AUTO-CALCULATED (omit unless visible in image)
- **interval**: AUTO-CALCULATED (omit unless grid spacing visible)
- **showMarkers**: false (no point markers shown)
- **markerStyle**: "circle" (circular markers)
- **markerSize**: 6 (small point size)
- **markerBorderWidth**: 2 (border around markers)
- **showXAxisTicks**: false (no grid lines on X axis)
- **showYAxisTicks**: false (no grid lines on Y axis)
- **tickLineColor**: "#E0E0E0" (light gray grid lines)
- **tickLineStyle**: "dashed" (dashed lines)
- **tickLineWidth**: 1 (thin lines)
- **showXAxisLabels**: false (no x-axis labels shown)
- **showYAxisLabels**: false (no y-axis labels shown)
- **xAxisLabelPosition**: "bottom" (labels below axis)
- **yAxisLabelPosition**: "left" (labels left of axis)

For gradient area fill:
```json
{
  "gradientIntensity": 0.3,  // 0 to 1, opacity at top
  "gradientStartColor": "#6DD400",  // Top of gradient
  "gradientEndColor": "#6DD400"  // Bottom of gradient (fades to transparent)
}
```

For custom gradient stops:
```json
{
  "gradientStops": [
    {"offset": 0, "color": "rgba(109, 212, 0, 0.8)"},
    {"offset": 0.5, "color": "rgba(109, 212, 0, 0.4)"},
    {"offset": 1, "color": "rgba(109, 212, 0, 0)"}
  ]
}
```

For multiple series:
```json
{
  "data": [
    [10, 20, 15, 30, 25],  // Series 1
    [15, 25, 20, 35, 30]   // Series 2
  ],
  "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
  "seriesNames": ["Revenue", "Expenses"],
  "colors": ["#6DD400", "#FF6B6B"]
}
```

For trendlines (only if visible in image):
```json
{
  "showXTrendline": true,  // Horizontal average line
  "xTrendlineValue": 25,  // Explicit value, or omit for auto-average
  "xTrendlineColor": "#FF6B6B",
  "xTrendlineStyle": "dashed",  // solid/dashed/dotted
  "xTrendlineWidth": 2,
  "xTrendlineLabel": "Average",
  "showYTrendline": true,  // Vertical current time line
  "yTrendlinePosition": 0.95,  // 0-1 position along X-axis
  "yTrendlineColor": "#4ECDC4",
  "yTrendlineStyle": "dashed",
  "yTrendlineWidth": 2,
  "yTrendlineLabel": "Current"
}
```

Extract exact values and styling for pixel-perfect replication.
