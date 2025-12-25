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
- **Segment borders**: Border width and color around segments
- **Sector lines**: Lines between segments (showSectorLines, color, width, style)
- **Segment separation**: Whether segments are pulled apart (exploded)
- **Rounded segments**: Border radius for segment corners
- **Labels**: Position (inside/outside/center), font size, color, values/percentages
- **Legend**: Visibility, position, orientation (horizontal/vertical)
- **Center hole**: Inner radius percentage for donut charts (40-75 typical)
- **Outer size**: Outer radius percentage (smart auto-adjustment based on layout)

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
    "startAngle": 90,
    "clockwise": true,
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "roundedSegments": false,
    "segmentBorderRadius": 10,
    "showSectorLines": true,
    "sectorLineColor": "#333333",
    "sectorLineWidth": 1,
    "sectorLineStyle": "solid",
    "showLegend": false,
    "legendPosition": "right",
    "legendOrientation": "vertical"
  }
}
```

## Default Behavior (when not visible in image):
- **showTitle**: false (no title shown)
- **variant**: "pie" (solid pie chart, not donut)
- **innerRadius**: undefined (auto: 0 for pie, 40% for donut/ring)
- **outerRadius**: undefined (auto-calculated based on legend/labels, typically 30-75%)
- **theme**: "dark" (dark theme)
- **backgroundColor**: "transparent" (transparent background)
- **showLabels**: false (no segment labels)
- **showValues**: false (don't show raw values on segments)
- **showPercentages**: false (don't show percentages on segments)
- **labelPosition**: "outside" (labels outside the pie)
- **startAngle**: 90 (start from top)
- **clockwise**: true (progress clockwise)
- **borderWidth**: 0 (no segment borders)
- **borderColor**: "#ffffff" (white borders if present)
- **roundedSegments**: false (sharp segment edges)
- **segmentBorderRadius**: 10 (corner rounding if roundedSegments enabled)
- **showSectorLines**: false (no lines between segments)
- **sectorLineColor**: undefined (uses theme border color)
- **sectorLineWidth**: 1 (thin lines)
- **sectorLineStyle**: "solid" (solid lines)
- **showLegend**: false (no legend)
- **legendPosition**: "right" (legend on right side)
- **legendOrientation**: "vertical" (vertical legend layout)
- **centerIconName**: undefined (no icon in center)
- **centerIconSize**: 32 (default icon size if used)
- **centerIconColor**: undefined (uses theme text color if not specified)
- **centerContent**: undefined (no custom content)
- **centerText**: "" (empty text)
- **centerValue**: "" (empty value)
- **centerValueStyle**: {} (default: fontSize 24px, bold, theme text color)
- **centerTextStyle**: {} (default: fontSize 12px, normal, theme text color, 0.8 opacity)
- **centerTextGap**: 4 (gap in pixels between centerValue and centerText)
- **useCenterGraphic**: true (uses HTML overlay for center content)
- **min**: undefined (no minimum value clamping)
- **max**: undefined (no maximum value clamping)

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
  "centerIconName": "lu:LuCheckCircle",
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

**Pie with sector divider lines**:
```json
{
  "variant": "pie",
  "showSectorLines": true,
  "sectorLineColor": "#FFFFFF",
  "sectorLineWidth": 2,
  "sectorLineStyle": "solid"
}
```

**Donut with rounded segments**:
```json
{
  "variant": "donut",
  "roundedSegments": true,
  "segmentBorderRadius": 8
}
```

**Pie with legend**:
```json
{
  "showLegend": true,
  "legendPosition": "bottom",
  "legendOrientation": "horizontal"
}
```

Extract exact segment sizes, colors, styling, and center content for pixel-perfect replication.