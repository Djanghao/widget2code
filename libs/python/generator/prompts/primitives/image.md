### Image
Props: `src` (Unsplash URL), `borderRadius` (number)
Node properties: `width` (number), `height` (number)
- **CRITICAL**: MUST use Unsplash URLs: `https://images.unsplash.com/photo-[ID]`
- Choose image matching widget's visual content/theme
- Specify `width`, `height` at node level (NOT in props)
- `width` optional - omit to stretch horizontally
- Example: `{"type": "leaf", "component": "Image", "width": 100, "height": 100, "props": {"src": "https://images.unsplash.com/photo-[ID]"}}`
