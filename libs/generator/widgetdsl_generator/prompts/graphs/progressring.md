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
- **Center content**: Either icon OR text displayed in the center (not both)

## Position & Direction
- **Center position**: X,Y coordinates of ring center
- **Start angle**: Where the progress begins (-90 = top, 0 = right, 90 = bottom)
- **Direction**: Clockwise or counter-clockwise progress

## Return WidgetDSL specification:
```json
{
  "type": "ProgressRing",
  "spec": {
    "percentage": 75,  // Current progress percentage (0-100)
    "size": 120,   // Overall diameter of the ring
    "strokeWidth": 12,  // Ring thickness
    "backgroundColor": "#E5E7EB",  // Background track color
    "color": "#3B82F6",   // Progress fill color
    "content": "75%",  // Text in center (use either content OR iconName, not both)
    "textColor": "#333333",  // Text color
    "fontSize": 24,  // Text font size
    "fontWeight": 600,  // Text font weight
    "iconName": null,  // Icon name (use either iconName OR content, not both)
    "iconSize": 32,  // Icon size when using iconName
    "iconColor": "#000000"  // Icon color when using iconName
  }
}
```

## Default Behavior (when not visible in image):
- **percentage**: 0 (no progress)
- **size**: 80 (default ring diameter)
- **strokeWidth**: 6 (default ring thickness)
- **backgroundColor**: "#d1d1d6" (light gray background)
- **color**: "#34C759" (green primary color)
- **content**: null (no text by default)
- **textColor**: "#000000" (black text)
- **fontSize**: 14 (default font size)
- **fontWeight**: 500 (medium weight)
- **iconName**: null (no icon by default)
- **iconSize**: 32 (default icon size)
- **iconColor**: "#000000" (black icon)

For different sizes:
```json
{
  "size": 60,   // Small ring
  "strokeWidth": 4
}
```

For with center icon instead of text:
```json
{
  "content": null,
  "iconName": "checkmark",
  "iconSize": 24,
  "iconColor": "#10B981"
}
```

For with center text:
```json
{
  "iconName": null,
  "content": "75%",
  "textColor": "#333333",
  "fontSize": 20,
  "fontWeight": 600
}
```

Extract exact progress value, dimensions, colors, and styling for pixel-perfect replication.