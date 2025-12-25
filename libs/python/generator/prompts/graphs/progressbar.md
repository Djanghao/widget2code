Generate a WidgetDSL specification for a ProgressBar component in this image.

Focus on extracting these elements:

## Progress Analysis
- **Current value**: Extract the progress value (0-100 percentage)
- **Maximum value**: Note if there's a different max (default: 100)
- **Minimum value**: Note if there's a different min (default: 0)

## Visual Styling
- **Track**: Background color, height, border radius
- **Fill**: Progress color, gradient effects, striped patterns
- **Labels**: Text showing percentage, current value, or custom text
- **Orientation**: "horizontal" (left-to-right) or "vertical" (bottom-to-top)
- **Size**: Height and width dimensions

## Animation & Effects
- **Striped**: Diagonal stripes on the progress fill
- **Animated**: Moving animation on stripes
- **Weight**: Visual thickness ("light", "normal", "bold")
- **Border radius**: Corner rounding

## Return WidgetDSL specification:
```json
{
  "type": "ProgressBar",
  "spec": {
    "value": 75,  // Current progress value
    "max": 100,   // Maximum value
    "min": 0,     // Minimum value
    "label": "75%",  // Optional custom text
    "showValue": true,  // Show percentage/value
    "color": "#3B82F6",  // Progress fill color
    "backgroundColor": "#E5E7EB",  // Track background
    "height": 8,
    "width": "100%",
    "minWidth": 100,
    "minHeight": 20,
    "weight": "normal",
    "borderRadius": 4,
    "animated": false,
    "striped": false,
    "variant": "primary",  // Or "success", "warning", "error"
    "size": "medium",  // Or "small", "large"
    "orientation": "horizontal"
  }
}
```

## Default Behavior (when not visible in image):
- **value**: 0 (no progress)
- **max**: 100 (100% is maximum)
- **min**: 0 (0 is minimum)
- **showValue**: true (show percentage by default)
- **color**: "#3B82F6" (blue primary color)
- **backgroundColor**: "#E5E7EB" (light gray track)
- **orientation**: "horizontal" (left-to-right progress)
- **size**: "medium" (medium height)
- **weight**: "normal" (normal thickness)
- **borderRadius**: 4 (slightly rounded corners)
- **animated**: false (no animation)
- **striped**: false (no diagonal stripes)
- **variant**: "primary" (use primary color theme)
- **width**: "100%" (full width)
- **height**: 8 (default height in pixels)
- **minHeight**: 20 (minimum height)
- **minWidth**: 100 (minimum width)

For vertical progress bar:
```json
{
  "orientation": "vertical",
  "height": 200,
  "width": 8
}
```

For striped progress:
```json
{
  "striped": true,
  "animated": true
}
```

Extract exact progress value, colors, dimensions, and styling for pixel-perfect replication.