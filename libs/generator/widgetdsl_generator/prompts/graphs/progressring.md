Generate a WidgetDSL specification for a ProgressRing component in this image.

Focus on extracting these elements:

## Progress Analysis
- **Current value**: Extract the progress value (0-100 percentage)
- **Maximum value**: Note if there's a different max (default: 100)
- **Minimum value**: Note if there's a different min (default: 0)

## Visual Styling
- **Ring thickness**: Width of the progress ring
- **Outer radius**: Overall size of the ring
- **Inner radius**: Size of the center hole (calculated from thickness)
- **Track**: Background ring color and style
- **Fill**: Progress color, gradient effects
- **Center content**: Text or icons displayed in the center

## Position & Direction
- **Center position**: X,Y coordinates of ring center
- **Start angle**: Where the progress begins (-90 = top, 0 = right, 90 = bottom)
- **Direction**: Clockwise or counter-clockwise progress

## Return WidgetDSL specification:
```json
{
  "type": "ProgressRing",
  "spec": {
    "progress": 75,  // Current progress percentage (0-100)
    "radius": 60,   // Outer radius of the ring
    "thickness": 12,  // Ring thickness
    "trackColor": "#E5E7EB",  // Background track color
    "fillColor": "#3B82F6",   // Progress fill color
    "centerPosition": {
      "x": 100,
      "y": 100
    },
    "centerText": "75%",  // Text in center
    "labelStyle": {
      "fontSize": 24,
      "fontWeight": "bold",
      "color": "#333333"
    },
    "startAngle": -90,  // Start from top
    "direction": "clockwise",  // Or "counter-clockwise"
    "animated": false,
    "gradient": null  // Optional gradient effects
  }
}
```

## Default Behavior (when not visible in image):
- **progress**: 0 (no progress)
- **radius**: 60 (default ring size)
- **thickness**: 8 (default ring thickness)
- **trackColor**: "#E5E7EB" (light gray background)
- **fillColor**: "#3B82F6" (blue primary color)
- **centerPosition**: { "x": 50, "y": 50 } (center of 100x100 container)
- **centerText**: null (no text by default)
- **labelStyle**:
  - **fontSize**: 16 (default font size)
  - **fontWeight**: "normal" (normal weight)
  - **color**: "#333333" (dark gray text)
- **startAngle**: -90 (start from top)
- **direction**: "clockwise" (progress clockwise)
- **animated**: false (no animation)
- **gradient**: null (no gradient by default)

For different sizes:
```json
{
  "radius": 40,   // Small ring
  "thickness": 8
}
```

For with center icon instead of text:
```json
{
  "centerText": null,
  "centerIcon": {
    "name": "check",
    "size": 24,
    "color": "#10B981"
  }
}
```

For gradient fill:
```json
{
  "gradient": {
    "type": "linear",
    "colors": ["#3B82F6", "#10B981"],
    "direction": "clockwise"
  }
}
```

Extract exact progress value, dimensions, colors, and styling for pixel-perfect replication.