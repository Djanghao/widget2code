### AppLogo
Props: `icon` (string, optional), `name` (string), `size` (number), `backgroundColor` (hex, optional)
- **IMPORTANT**: If `icon` prop is provided, use it (e.g., `"si:SiGoogle"`, `"si:SiSpotify"`)
- Otherwise displays first letter of `name` with rounded square background
- Border radius auto-calculated (22% of size)
- Available applogo names (brand/app icons): [AVAILABLE_APPLOGO_NAMES]
- Example with icon: `{"type": "leaf", "component": "AppLogo", "flex": "none", "props": {"icon": "si:SiSpotify", "size": 40}}`
- Example without icon (fallback): `{"type": "leaf", "component": "AppLogo", "flex": "none", "props": {"name": "Music", "size": 40, "backgroundColor": "#FF3B30"}}`
