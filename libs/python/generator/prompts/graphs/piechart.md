Generate a WidgetDSL specification for a PieChart component in this image.

Focus on extracting these elements:

## Chart Identification
- **Title**: Extract title text (set showTitle: false if none)
- **Variant**: "pie" (solid), "donut" (with center hole), or "ring" (thin ring)
- **Center content**: For donut/ring variants, identify center elements:
  - **Icons**: Status indicators (checkmark, alert, info, etc.)
  - **Text labels**: Descriptive text or categories
  - **Values**: Numbers, percentages, or metrics
  - **Combined**: Icon + value, text + value, or icon + text + value

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

## Center Content Props (for donut/ring only):
**IMPORTANT**: You can combine these props flexibly. Choose ONE of these patterns:

1. **Icon only** (status indicator, large icon):
   - `centerIconName`: Icon name (e.g., "lu:LuCheckCircle", "lu:LuAlertTriangle")
   - `centerIconSize`: Icon size (24-48 typical)
   - `centerIconColor`: Icon color (hex) - optional, uses theme color if omitted

2. **Icon + Value** (icon with metric below):
   - `centerIconName`: Icon name
   - `centerIconSize`: Icon size
   - `centerIconColor`: Icon color (optional)
   - `centerValue`: Numeric value or percentage

3. **Icon + Text + Value** (icon with label and metric):
   - `centerIconName`: Icon name
   - `centerIconSize`: Icon size
   - `centerIconColor`: Icon color (optional)
   - `centerText`: Descriptive label (NOT used when icon present)
   - `centerValue`: Numeric value or percentage

4. **Text + Value** (label with metric) - **MOST COMMON**:
   - `centerValue`: Numeric value or percentage (displays ABOVE)
   - `centerText`: Descriptive label (displays BELOW)
   - `centerValueStyle`: Custom styling for value (fontSize, fontWeight, color)
   - `centerTextStyle`: Custom styling for text (fontSize, fontWeight, color)
   - (No icon)

5. **Text only** (custom content):
   - `centerContent`: Any text content
   - (No icon, overrides centerText and centerValue)

6. **Value only** (large metric):
   - `centerValue`: The value to display (will be large and bold)
   - (No icon or text)

**Rendering Order**: When both text and value are present, centerValue renders ABOVE centerText:
- Icon (if `centerIconName` is set) OR custom content (if `centerContent` is set)
- Value (if `centerValue` is set) - renders at top
- Text label (if `centerText` is set and no icon/custom content) - renders at bottom

**Center Content Styling (Advanced)**:
- `centerValueStyle`: Object with `fontSize` (e.g., "26px"), `fontWeight` (e.g., "400"), `color` (hex)
- `centerTextStyle`: Object with `fontSize` (e.g., "11px"), `fontWeight` (e.g., "400"), `color` (hex)
- `centerTextGap`: Number (default: 0) - Gap in pixels between centerValue and centerText (e.g., 4 for 4px spacing)
- `useCenterGraphic`: Boolean (default: true) - uses native ECharts rendering for better positioning. Set to false for legacy HTML overlay rendering

## Icon Selection Guide:
Choose appropriate icons based on semantic meaning:
- Completion/Success: "check-circle", "check", "circle-check"
- Progress/Partial: "clock", "loader", "progress"
- Warning/Alert: "alert-triangle", "alert-circle"
- Error/Failed: "x-circle", "alert-octagon"
- Info/Stats: "info", "pie-chart", "bar-chart"
- Target/Goal: "target", "crosshair"
- Up/Growth: "trending-up", "arrow-up-circle"
- Down/Decline: "trending-down", "arrow-down-circle"
- User/People: "user", "users"
- Money/Finance: "dollar-sign", "credit-card"

## Return WidgetDSL specification:
```json
{
  "type": "PieChart",
  "spec": {
    "title": "Chart Title",
    "showTitle": true,
    "data": [30, 25, 20, 15, 10],
    "labels": ["Segment 1", "Segment 2", "Segment 3", "Segment 4", "Segment 5"],
    "colors": ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"],
    "backgroundColor": "#FFFFFF",
    "theme": "light",
    "variant": "donut",
    "innerRadius": 70,
    "outerRadius": 90,
    "centerIconName": "check-circle",
    "centerIconSize": 32,
    "centerIconColor": "#10B981",
    "centerValue": "85%",
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
- **centerIconName**: null (no icon in center)
- **centerIconSize**: 32 (default icon size if used)
- **centerIconColor**: null (uses theme text color if not specified)
- **centerContent**: null (no custom content)
- **centerText**: null (no label text)
- **centerValue**: null (no value display)
- **centerValueStyle**: {} (default: fontSize 24px, bold, theme text color)
- **centerTextStyle**: {} (default: fontSize 12px, normal, theme text color, 0.8 opacity)
- **centerTextGap**: 4 (gap in pixels between centerValue and centerText)
- **useCenterGraphic**: true (uses native rendering for center content)

## Common Patterns:

**Solid pie chart** (no center content):
```json
{
  "variant": "pie",
  "innerRadius": 0,
  "centerIconName": null,
  "centerContent": null,
  "centerText": null,
  "centerValue": null
}
```

**Donut with completion status**:
```json
{
  "variant": "donut",
  "innerRadius": 65,
  "centerIconName": "check-circle",
  "centerIconSize": 36,
  "centerIconColor": "#10B981",
  "centerValue": "100%"
}
```

**Donut with metric display** (value above text):
```json
{
  "variant": "donut",
  "innerRadius": 60,
  "centerValue": "1,234",
  "centerText": "Total",
  "centerValueStyle": {
    "fontSize": "24px",
    "fontWeight": "bold"
  },
  "centerTextStyle": {
    "fontSize": "12px",
    "fontWeight": "normal"
  },
  "centerTextGap": 4
}
```

**Ring with large value**:
```json
{
  "variant": "ring",
  "innerRadius": 70,
  "centerValue": "85%"
}
```

Extract exact segment sizes, colors, styling, and center content for pixel-perfect replication.