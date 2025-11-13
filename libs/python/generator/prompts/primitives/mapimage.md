### MapImage
Props: `src` (preset ID)
Node properties: `width` (number), `height` (number)
- **CRITICAL**: Must use one of these preset IDs: `"light-google-map"`, `"dark-google-map"`, `"satellite-google-map"`
- Specify `width`, `height` at node level
- Example: `{"type": "leaf", "component": "MapImage", "height": 120, "props": {"src": "light-google-map"}}`
