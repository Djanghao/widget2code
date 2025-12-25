### Button
Props: `icon` (icon name), `backgroundColor` (hex), `color` (hex), `borderRadius` (number), `fontSize` (number), `fontWeight` (number), `padding` (number), `content` (text)
Node properties: `width` (number), `height` (number)
- **RARE in widgets** - only use when clear button with background/padding exists
- Contains either icon OR text (not both)
- Circular: set `borderRadius` to half size (e.g., `width: 40, height: 40, borderRadius: 20`)
- Example: `{"type": "leaf", "component": "Button", "props": {"icon": "sf:SfPlus", "backgroundColor": "#007AFF", "color": "#fff", "borderRadius": 12, "padding": 12}}`
