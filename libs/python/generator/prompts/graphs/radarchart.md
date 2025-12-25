Generate a WidgetDSL specification for a RadarChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Indicators**: List all axis labels (the "spokes" of the radar) in clockwise order
- **Data Series**: Single series or multiple series (different colored polygons)
- **Scale**: Maximum value for all axes (usually the same)
- **Theme**: "light" or "dark" based on background

## Data Extraction
**For single series**: Array of numbers [80, 90, 75, 85, 70]
**For multiple series**: 2D array [[series1], [series2], ...]

- Extract exact values for each indicator in clockwise order
- Values typically range 0-100, but can be any scale
- For multiple polygons, maintain series order from legend

**Indicators**:
- Extract all axis labels in clockwise order
- Note the maximum value for each axis (usually uniform)
- Create indicators array with `{name: "Label", max: 100}` format

## Visual Styling
- **Polygon fills**: Colors (single series) or colors array (multi-series), area opacity
- **Line styles**: Line width, smooth curves option
- **Point markers**: Visibility, shape (circle/square/triangle/diamond), size, colors
- **Grid**: Shape (polygon/circle), split lines count, color, line style
- **Axis lines**: Color, style (solid/dashed/dotted)
- **Background**: Chart background color
- **Legend**: Visibility, position (top/bottom/left/right)
- **Label size**: Font size for indicator labels

## Gradient Support (Advanced)
- **Basic gradient**: Enable gradient fill for polygon areas
- **Custom gradient**: Control gradient intensity, start/end colors, or custom stops

## Return WidgetDSL specification:
```json
{
  "type": "RadarChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [80, 90, 75, 85, 70],  // Single series values array
    "labels": ["Speed", "Strength", "Defense", "Accuracy", "Stamina"],  // Alternative to indicators
    "indicators": [
      {"name": "Speed", "max": 100},
      {"name": "Strength", "max": 100},
      {"name": "Defense", "max": 100},
      {"name": "Accuracy", "max": 100},
      {"name": "Stamina", "max": 100}
    ],
    "color": "#6DD400",  // For single series
    "backgroundColor": "transparent",
    "theme": "dark",
    "radarShape": "polygon",
    "splitNumber": 5,
    "smooth": false,
    "startAngle": 90,
    "center": ["50%", "50%"],
    "radius": "65%",
    "areaOpacity": 0.3,
    "lineWidth": 2,
    "showMarkers": true,
    "markerStyle": "circle",
    "markerSize": 4,
    "markerColor": "#6DD400",
    "markerBorderColor": "#FFFFFF",
    "markerBorderWidth": 2,
    "splitLineStyle": "solid",
    "axisLineStyle": "solid",
    "gridColor": "rgba(75, 192, 192, 0.2)",
    "textColor": "#A0A0A0",
    "labelSize": 11,
    "showLegend": false,
    "legendPosition": "bottom"
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **theme**: "dark" (dark theme)
- **backgroundColor**: "transparent" (transparent background)
- **radarShape**: "polygon" (polygon shape, not circular)
- **splitNumber**: 5 (5 concentric grid polygons)
- **smooth**: false (straight lines between points)
- **startAngle**: 90 (start from top)
- **center**: ["50%", "50%"] (centered)
- **radius**: "65%" (default size)
- **areaOpacity**: 0.3 (fill transparency)
- **lineWidth**: 2 (medium thickness lines)
- **showMarkers**: false (no point markers shown)
- **markerStyle**: "circle" (circular markers)
- **markerSize**: 4 (small point size)
- **markerBorderWidth**: 2 (border around markers)
- **splitLineStyle**: "solid" (solid grid lines)
- **axisLineStyle**: "solid" (solid axis lines)
- **gridColor**: "rgba(75, 192, 192, 0.2)" (semi-transparent grid)
- **textColor**: "#A0A0A0" (gray text)
- **labelSize**: 11 (font size for indicator labels)
- **showLegend**: false (no legend unless multiple series)
- **legendPosition**: "bottom" (legend at bottom)
- **showValues**: false (no value labels shown)
- **min**: 0 (minimum value for all indicators)
- **max**: 100 (maximum value for all indicators)

For gradient area fill:
```json
{
  "gradient": true,
  "gradientIntensity": 0.3,  // 0 to 1, opacity at center
  "gradientStartColor": "#6DD400",  // Center of gradient
  "gradientEndColor": "#6DD400"  // Edge of gradient
}
```

For custom gradient stops:
```json
{
  "gradient": true,
  "gradientStops": [
    {"offset": 0, "color": "#6DD400FF"},
    {"offset": 1, "color": "#6DD4004D"}
  ]
}
```

For multiple series:
```json
{
  "data": [
    [80, 90, 75, 85, 70],  // Series 1
    [65, 85, 90, 70, 80]   // Series 2
  ],
  "seriesNames": ["Team A", "Team B"],
  "colors": ["#6DD400", "#FF6B6B"],
  "showLegend": true
}
```

For custom axis name styling:
```json
{
  "axisName": {
    "color": "#FFFFFF",
    "fontSize": 14,
    "fontWeight": "bold"
  }
}
```

Extract exact indicator names, data values, and styling for pixel-perfect replication.