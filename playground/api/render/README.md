# Batch Widget Rendering API

Backend API for batch rendering widgetspec to JSX and PNG using headless browser.

## Features

- ✅ **100% Playground Logic Reuse**: Rendering results identical to playground
- ✅ **AutoResize Support**: Automatically adjusts widget to optimal size
- ✅ **Multi-threaded**: Configurable worker pool (1-10 concurrent renders)
- ✅ **Batch Processing**: Render multiple widgets in one request
- ✅ **Complete Output**: Generates PNG (2x), JSX, and final spec

## Architecture

### Frontend (Headless Rendering)
- `../render.html` - Headless rendering page
- `../src/BatchRenderer.jsx` - Core rendering component
  - Reuses compiler, AutoResize logic, html2canvas
  - Monitors widget stability and auto-resizes

### Backend (api/render/)
- `renderer.py` - Playwright service with browser pool
- `batch_render.py` - API endpoints
  - `POST /api/render-single` - Single widget
  - `POST /api/render-batch` - Batch rendering
- `test_batch_render.py` - Test script
- `__init__.py` - Module exports

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
playwright install chromium
```

### 2. Start Services

```bash
# Terminal 1: Frontend (from project root)
npm run dev

# Terminal 2: Backend (from this directory)
python server.py
```

## Usage

### API Examples

#### Single Widget Rendering

```bash
curl -X POST http://localhost:8000/api/render-single \
  -H "Content-Type: application/json" \
  -d '{
    "spec": {
      "widget": {
        "backgroundColor": "#4A90E2",
        "borderRadius": 20,
        "padding": 16,
        "aspectRatio": 1.0,
        "root": {
          "type": "container",
          "direction": "col",
          "children": []
        }
      }
    },
    "output_name": "my_widget",
    "save_output": true
  }'
```

#### Batch Rendering

```bash
curl -X POST http://localhost:8000/api/render-batch \
  -H "Content-Type: application/json" \
  -d '{
    "specs": [
      {"widget": {...}},
      {"widget": {...}},
      {"widget": {...}}
    ],
    "max_workers": 4,
    "save_output": true
  }'
```

### Test Script

```bash
# From api/ directory
python render/test_batch_render.py          # Single widget
python render/test_batch_render.py batch    # Batch (3 widgets)
```

### Python Code Example

```python
import asyncio
from services.renderer import get_renderer, shutdown_renderer

async def render_example():
    spec = {
        "widget": {
            "backgroundColor": "#4A90E2",
            "aspectRatio": 1.0,
            "root": {
                "type": "container",
                "children": []
            }
        }
    }

    renderer = await get_renderer(max_workers=4)

    result = await renderer.render_widget(spec)

    print(f"Size: {result['width']}x{result['height']}")

    import base64
    with open('output.png', 'wb') as f:
        f.write(base64.b64decode(result['png']))

    with open('output.jsx', 'w') as f:
        f.write(result['jsx'])

    await shutdown_renderer()

asyncio.run(render_example())
```

## Rendering Pipeline

```
WidgetSpec
    ↓
1. compileWidgetSpecToJSX (Compile to JSX)
    ↓
2. Write to playground/src/generated/Widget.jsx
    ↓
3. Headless browser loads render.html
    ↓
4. Widget naturally expands to size
    ↓
5. Monitor size stability (ResizeObserver + 3 stable frames)
    ↓
6. AutoResize (if aspectRatio specified)
    ↓
    6.1. Binary search for minimum fitting size
    ↓
    6.2. Update spec width/height
    ↓
7. html2canvas screenshot
    ↓
8. Return result {png, jsx, spec, width, height}
```

## Output Files

After rendering, files are generated in `output/` directory:

- `{name}.png` - PNG screenshot (2x scale)
- `{name}.jsx` - Compiled JSX code
- `{name}.json` - Final spec with width/height

## API Parameters

### RenderRequest (Single Rendering)

```json
{
  "spec": {
    "widget": {...}
  },
  "output_name": "my_widget",
  "save_output": true,
  "timeout": 30000
}
```

### BatchRenderRequest (Batch Rendering)

```json
{
  "specs": [
    {"widget": {...}},
    {"widget": {...}}
  ],
  "output_dir": "./output",
  "save_output": true,
  "max_workers": 4,
  "timeout": 30000
}
```

## Configuration

### Environment Variables

```bash
FRONTEND_PORT=5173
BACKEND_PORT=8000
```

### Worker Count Recommendations

- **1-2 workers**: Low-end machines
- **4 workers**: Recommended (balanced performance)
- **8-10 workers**: High-end servers

## Performance

- Single widget render time: ~2-5 seconds (including AutoResize)
- Batch rendering (4 workers): ~3-6 seconds for 10 widgets
- Memory usage: ~200-300MB per worker

## Troubleshooting

### Render Timeout

Increase timeout parameter:
```json
{"timeout": 60000}
```

### Out of Memory

Reduce max_workers:
```json
{"max_workers": 2}
```

### Playwright Installation Issues

```bash
playwright install chromium
```

## Tech Stack

- **Frontend**: React + Vite + html2canvas
- **Backend**: FastAPI + Playwright
- **Rendering**: Headless Chromium
- **Compiler**: @widget-factory/compiler

## Important Notes

1. **Headless browser required**: Widget rendering depends on DOM layout engine, cannot be implemented in pure Node.js
2. **Both services must run**: Backend accesses frontend's render.html via Playwright
3. **AutoResize takes time**: Uses binary search, may require multiple renders to find optimal size
4. **Large PNG files**: Uses 2x scale for clarity, files may be hundreds of KB

## Future Improvements

- [ ] Render queue and progress tracking
- [ ] Custom scale parameter support
- [ ] Support for WebP and other image formats
- [ ] Render caching mechanism
- [ ] Distributed rendering support
