Generate a WidgetDSL specification for a RadarChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Indicators**: List all axis labels (the "spokes" of the radar)
- **Data Series**: Number of data series (different colored polygons)
- **Scale**: Maximum value for all axes (usually the same)

## Data Extraction
**Indicators (Axes)**:
- Extract all axis labels in clockwise order
- Note the maximum value for each axis (usually uniform)
- Count of indicators determines data array length

**Data Points**:
- For each series, extract values for each indicator in order
- Values typically range 0-100, but can be any scale
- Maintain exact series order from legend

## Visual Styling
- **Polygon fills**: Colors and opacity for each data series
- **Line styles**: Solid, dashed, or dotted lines for each series
- **Point markers**: Shape, size, color for data points
- **Grid**: Concentric polygons, color, line style
- **Background**: Chart background color
- **Legend**: Position, labels, color indicators

## Return WidgetDSL specification:
```json
{
  "type": "RadarChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [
      {
        "seriesName": "Series 1",
        "values": [80, 90, 75, 85, 70],  // Values for each indicator
        "color": "#3B82F6",
        "fillOpacity": 0.2,
        "lineWidth": 2,
        "marker": {
          "shape": "circle",
          "size": 8,
          "fillColor": "#3B82F6",
          "borderColor": "#FFFFFF",
          "borderWidth": 2
        }
      },
      {
        "seriesName": "Series 2",
        "values": [65, 85, 90, 70, 80],
        "color": "#EF4444",
        "fillOpacity": 0.1,
        "lineWidth": 2,
        "lineStyle": "dashed",
        "marker": {
          "shape": "circle",
          "size": 8,
          "fillColor": "#EF4444",
          "borderColor": "#FFFFFF",
          "borderWidth": 2
        }
      }
    ],
    "indicators": [
      {"name": "Indicator 1", "max": 100},
      {"name": "Indicator 2", "max": 100},
      {"name": "Indicator 3", "max": 100},
      {"name": "Indicator 4", "max": 100},
      {"name": "Indicator 5", "max": 100}
    ],
    "backgroundColor": "#FAF9F7",
    "theme": "light",
    "showLegend": true,
    "radarShape": "polygon",
    "splitNumber": 5,
    "smooth": false,
    "startAngle": 90,
    "areaOpacity": 0.3,
    "showPoints": true,
    "gridColor": "#DDDDDD",
    "textColor": "#555555",
    "labelSize": 11
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **lineWidth**: 2 (medium thickness lines)
- **fillOpacity**: 0.2 (semi-transparent fill)
- **lineStyle**: "solid" (solid lines, not dashed)
- **marker**:
  - **shape**: "circle" (circular points)
  - **size**: 8 (medium point size)
  - **borderWidth**: 2 (white border around points)
- **radarShape**: "polygon" (polygon shape, not circular)
- **splitNumber**: 5 (5 concentric grid polygons)
- **smooth**: false (straight lines between points)
- **startAngle**: 90 (start from right)
- **areaOpacity**: 0.3 (fill transparency)
- **showPoints**: true (show data point markers)
- **showLegend**: true (show legend for multiple series)
- **gridColor**: "#DDDDDD" (light gray grid lines)
- **textColor**: "#555555" (medium gray text)
- **backgroundColor**: "#FFFFFF" (white background)
- **theme**: "light" (light background)
- **labelSize**: 11 (font size for indicator labels)

Extract exact indicator names, data values, and styling for pixel-perfect replication.