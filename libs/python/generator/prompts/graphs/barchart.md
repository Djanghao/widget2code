Generate a WidgetDSL specification for a BarChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Orientation**: "vertical" (bars go up) or "horizontal" (bars go right)
- **Data Series**: Single series or multiple series (grouped bars)
- **Category Labels**: List ALL labels in exact order

## Data Extraction
**For single series**: Array of numbers [10, 20, 15, 30]
**For multiple series**: 2D array [[series1], [series2], ...]

- Extract exact bar heights/lengths as values
- Note any bars with zero values
- For grouped bars, maintain series order from legend

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
- **Colors**: For single series, one color; for multiple series, array of colors
- **Background**: Chart background color
- **Theme**: "light" or "dark"
- **Grid lines**: Color, style (solid/dashed), visibility
- **Bar styling**: Width, border radius, spacing between bars
- **Value labels**: Whether values are displayed on/above bars

## Axis Label Customization (Advanced)
- **Label colors**: `xAxisLabelColor`, `yAxisLabelColor` - Custom colors for axis labels
- **Label sizes**: `xAxisLabelFontSize`, `yAxisLabelFontSize` - Font size in pixels (default: 11)
- **Label rotation**: `xAxisLabelRotate`, `yAxisLabelRotate` - Rotation angle in degrees (0 = horizontal)
- **Label suffixes**: `xAxisLabelSuffix`, `yAxisLabelSuffix` - Add suffix to axis values (e.g., "m" for minutes, "%" for percentages)
- **Custom formatters**: For special number formatting (use sparingly)

## Return WidgetDSL specification:
```json
{
  "type": "BarChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [10, 20, 15, 30],  // Single series values array
    "labels": ["Category 1", "Category 2", "Category 3", "Category 4"],
    "seriesNames": ["Series 1"],  // For single series
    "colors": ["#3B82F6"],  // For gradient bars, specify the start color
    "backgroundColor": "#FFFFFF",
    "orientation": "vertical",
    "theme": "light",
    "min": 0,
    "max": 40,
    "interval": 10,
    "showXAxisTicks": true,
    "showYAxisTicks": true,
    "tickLineColor": "#E0E0E0",
    "tickLineStyle": "solid",
    "showXAxisLabels": true,
    "showYAxisLabels": true,
    "xAxisLabelPosition": "bottom",
    "yAxisLabelPosition": "left",
    "showValues": false,
    "barBorderRadius": 0,
    "barWidth": 40
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **orientation**: "vertical" (bars go up)
- **theme**: "light" (light background)
- **min**: AUTO-CALCULATED (omit unless visible in image)
- **max**: AUTO-CALCULATED (omit unless visible in image)
- **interval**: AUTO-CALCULATED (omit unless grid spacing visible)
- **showXAxisTicks**: true (show tick marks on X axis)
- **showYAxisTicks**: true (show tick marks on Y axis)
- **showXAxisLabels**: true (show category labels)
- **showYAxisLabels**: true (show value labels)
- **xAxisLabelPosition**: "bottom" (labels below axis)
- **yAxisLabelPosition**: "left" (labels left of axis)
- **showValues**: false (don't show values on bars)
- **barBorderRadius**: 0 (square corners)
- **barWidth**: "auto" (auto-calculate width)
- **tickLineColor**: "#E0E0E0" (light gray grid lines)
- **tickLineStyle**: "solid" (solid lines)
- **backgroundColor**: "#FFFFFF" (white background)

For gradient bars:
```json
{
  "colors": ["#007BFF"],  // Start color of gradient
  "gradientEndColor": "#6BB9FF",  // End color of gradient
  "gradientDirection": "vertical"
}
```

For multiple series:
```json
{
  "data": [
    [10, 20, 15, 30],  // Series 1
    [8, 12, 10, 25]    // Series 2
  ],
  "seriesNames": ["Series 1", "Series 2"],
  "colors": ["#3B82F6", "#EF4444"]
}
```

For multiple series:
```json
{
  "data": [
    [10, 20, 15, 30],  // Series 1
    [8, 12, 10, 25]    // Series 2
  ],
  "seriesNames": ["Series 1", "Series 2"],
  "colors": ["#3B82F6", "#EF4444"]
}
```

Extract exact values and styling for pixel-perfect replication.