Generate a WidgetDSL specification for a LineChart component in this image.

Focus on extracting these elements:

## Data Points
- Extract exact data points with x,y values
- Note any missing or null points
- Observe data trends and patterns
- Identify multiple data series if present

## Axes Configuration
- **X-Axis**: Label text, min/max values, tick intervals
- **Y-Axis**: Label text, min/max values, tick intervals
- **Grid lines**: Color, style (solid/dashed), visibility
- **Tick marks**: Position, color, size
- **Axis labels**: Font size, color, positioning

## Visual Styling
- **Line properties**: Color, thickness (lineWidth), style (solid/dashed)
- **Point markers**: Shape (circle/square/triangle), size, color, border
- **Area fill**: Color, opacity (if line chart has area fill)
- **Background**: Chart background color
- **Legend**: Position, labels, color indicators (if present)

## Return WidgetDSL specification:
```json
{
  "type": "LineChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [
      {
        "seriesName": "Series 1",
        "values": [10, 20, 15, 25, 30],
        "color": "#3B82F6",
        "lineWidth": 2,
        "pointStyle": {
          "shape": "circle",
          "size": 6,
          "fillColor": "#3B82F6",
          "borderColor": "#FFFFFF",
          "borderWidth": 2
        }
      }
    ],
    "xAxis": {
      "label": "X Axis Label",
      "min": 0,
      "max": 100,
      "interval": 20,
      "showTicks": true,
      "tickColor": "#666666",
      "labelColor": "#333333",
      "labelFontSize": 12
    },
    "yAxis": {
      "label": "Y Axis Label",
      "min": 0,
      "max": 50,
      "interval": 10,
      "showTicks": true,
      "tickColor": "#666666",
      "labelColor": "#333333",
      "labelFontSize": 12
    },
    "grid": {
      "show": true,
      "color": "#E0E0E0",
      "lineStyle": "solid",
      "lineWidth": 1
    },
    "backgroundColor": "#FFFFFF",
    "legend": {
      "show": true,
      "position": "top",
      "fontSize": 12,
      "textColor": "#333333"
    }
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **lineWidth**: 2 (medium thickness lines)
- **pointStyle**:
  - **shape**: "circle" (circular points)
  - **size**: 6 (small point size)
  - **borderWidth**: 2 (white border around points)
- **xAxis & yAxis**:
  - **min**: 0 (start from zero)
  - **showTicks**: true (show tick marks)
  - **tickColor**: "#666666" (medium gray)
  - **labelColor**: "#333333" (dark gray)
  - **labelFontSize**: 12 (default font size)
- **grid**:
  - **show**: true (show grid lines)
  - **color**: "#E0E0E0" (light gray)
  - **lineStyle**: "solid" (solid lines)
  - **lineWidth**: 1 (thin lines)
- **legend**:
  - **show**: false (don't show legend unless multiple series)
  - **position**: "top" (legend at top)
  - **fontSize**: 12 (default font size)
  - **textColor**: "#333333" (dark gray)
- **backgroundColor**: "#FFFFFF" (white background)

Extract all visual details accurately for pixel-perfect replication.