Generate a WidgetDSL specification for a StackedBarChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Orientation**: "vertical" (bars go up) or "horizontal" (bars go right)
- **Series Names**: List from legend or infer from colors (bottom-to-top order for vertical bars)
- **Category Labels**: List ALL labels in exact order (include even if bar height is 0)
- **Series Count**: Count distinct colored segments in each bar

## Data Extraction - CRITICAL
**Data must be 2D array**: [[series1 values], [series2 values], ...]

**For each series** (bottom→top or left→right):
1. Measure individual segment height/length (NOT cumulative values)
2. Record value for EVERY label position
3. Use 0 if segment not visible

**Example**: If bar shows bottom blue (0→20), middle red (20→45), top green (45→60):
- Blue segment value: 20 (NOT 45)
- Red segment value: 25 (45-20, NOT 45)
- Green segment value: 15 (60-45, NOT 60)

**Two-Series Example** (like your transactions chart):
- Bottom segment (blue): [40, 75, 35, 60, 85, 25, 70]
- Top segment (light gray): [60, 25, 65, 40, 15, 75, 30] (to reach 100% total)
- This represents: [Series1, Series2] where values may or may not sum to 100%

## Visual Styling
- **Colors**: One color per series, matching series order
- **Background**: Chart background color
- **Theme**: "light" or "dark"
- **Grid lines**: Color, style (solid/dashed), visibility
- **Border radius**: Top corner rounding for stacked bars
- **Totals**: Whether values are displayed on top of bars

## Return WidgetDSL specification:
```json
{
  "type": "StackedBarChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [
      [10, 20, 15, 30],  // Series 1 values (bottom series)
      [8, 12, 10, 25]    // Series 2 values (top series)
    ],
    "labels": ["Category 1", "Category 2", "Category 3", "Category 4"],
    "seriesNames": ["Series 1", "Series 2"],
    "colors": ["#3B82F6", "#EF4444"],
    "backgroundColor": "#FFFFFF",
    "orientation": "vertical",
    "theme": "light",
    "min": 0,
    "max": 60,
    "interval": 10,
    "showXAxisTicks": true,
    "showYAxisTicks": true,
    "tickLineColor": "#E0E0E0",
    "tickLineStyle": "solid",
    "showXAxisLabels": true,
    "showYAxisLabels": true,
    "xAxisLabelPosition": "bottom",
    "yAxisLabelPosition": "left",
    "stackName": "stack",
    "showTotal": false,
    "barBorderRadiusTop": 0
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **orientation**: "vertical" (bars go up)
- **theme**: "light" (light background)
- **min**: 0 (start from zero)
- **showXAxisTicks**: true (show tick marks on X axis)
- **showYAxisTicks**: true (show tick marks on Y axis)
- **showXAxisLabels**: true (show category labels)
- **showYAxisLabels**: true (show value labels)
- **xAxisLabelPosition**: "bottom" (labels below axis)
- **yAxisLabelPosition**: "left" (labels left of axis)
- **stackName**: "stack" (stack group identifier)
- **showTotal**: false (don't show totals on top of bars)
- **barBorderRadiusTop**: 0 (square top corners)
- **tickLineColor**: "#E0E0E0" (light gray grid lines)
- **tickLineStyle**: "solid" (solid lines)
- **backgroundColor**: "#FFFFFF" (white background)

## Final Checks
- data.length === seriesNames.length === colors.length
- Each data[i].length === labels.length
- Segment values are individual (NOT cumulative)
- All axis labels included (even for 0-height bars)

Extract exact values for pixel-perfect replication.