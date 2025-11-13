Generate a WidgetDSL specification for a Sparkline component in this image.

Focus on extracting these elements:

## Data Analysis
- **Data points**: Extract the trend values (typically 10-100 points)
- **Pattern**: Note the overall trend (up, down, volatile)
- **Start/End values**: Identify first and last data points

## Visual Styling
- **Line color**: Extract the color of the line
- **Area fill**: Whether the area under the line is filled
- **Gradient intensity**: Opacity of the filled area (0-1, where higher is more opaque)
- **Smooth**: Whether the line is smoothed (curved) or straight between points
- **Baseline**: Optional horizontal reference line value (dashed line)
- **Width/Height**: Overall dimensions of the sparkline

## Return WidgetDSL specification:
```json
{
  "type": "Sparkline",
  "spec": {
    "data": [10, 15, 12, 25, 20, 35, 30, 45, 40, 55, 50, 65, 60, 75, 70],
    "width": 80,
    "height": 40,
    "color": "#34C759",
    "showArea": true,
    "gradientIntensity": 0.4,
    "smooth": false,
    "baseline": 50
  }
}
```

## Parameters:
- **data**: Array of numeric values representing the trend line
- **width**: Width in pixels (typical: 80-120)
- **height**: Height in pixels (typical: 30-40)
- **color**: Hex color of the line (e.g., "#34C759" for green, "#FF453A" for red)
- **showArea**: Boolean - whether to fill the area under the line
- **gradientIntensity**: Number 0-1 - opacity of the filled area gradient (0 = transparent, 1 = fully opaque)
- **smooth**: Boolean - whether to use smooth curves (true) or straight lines (false)
- **baseline**: Optional number - y-value for horizontal reference line (shown as dashed line)

## Default Behavior (when not visible in image):
- **width**: 80
- **height**: 40
- **color**: "#34C759" (green)
- **showArea**: false (no area fill)
- **gradientIntensity**: 0.4 (40% opacity when showArea is true)
- **smooth**: false (straight lines between points)
- **baseline**: null (no baseline reference line)

## Examples:

Simple line chart without area fill:
```json
{
  "data": [20, 22, 21, 25, 24, 28, 30],
  "width": 80,
  "height": 40,
  "color": "#34C759",
  "showArea": false,
  "smooth": false
}
```

Area chart with baseline:
```json
{
  "data": [100, 95, 90, 85, 80, 75, 70, 75, 80, 85],
  "width": 80,
  "height": 40,
  "color": "#FF453A",
  "showArea": true,
  "gradientIntensity": 0.4,
  "smooth": false,
  "baseline": 50
}
```

Smooth curve with custom gradient:
```json
{
  "data": [10, 20, 15, 30, 25, 40, 35],
  "width": 100,
  "height": 40,
  "color": "#007AFF",
  "showArea": true,
  "gradientIntensity": 0.6,
  "smooth": true
}
```

Extract exact data points, dimensions, colors, and styling for pixel-perfect replication.
