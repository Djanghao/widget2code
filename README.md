# Widget Factory

Transform phone widget screenshots into React widgets using LLM and AI-native WidgetDSL.

**Pipeline**: Image → WidgetDSL (JSON) → JSX → PNG

## Quick Start

### One-Command Setup
```bash
./scripts/setup/install.sh
```
Installs all dependencies (Node.js packages + Python environment).

### Configuration
```bash
cp .env.example .env
# Add your DASHSCOPE_API_KEY
```

### Generate Widgets from Images

**Single image**:
```bash
./scripts/generation/generate-widget.sh input.png output.json
```

**Batch processing**:
```bash
./scripts/generation/generate-batch.sh ./images ./output 5
```
Processes multiple images with 5 concurrent workers.

### Compile DSL to JSX
```bash
./scripts/rendering/compile-widget.sh widget.json widget.jsx
```

### Development Playground
```bash
# Start frontend server (port 3060)
./scripts/dev/start-dev.sh

# Or start both frontend + API
npm run dev:full
```

### Full Pipeline (Image → PNG)
```bash
# Terminal 1: Start server
./scripts/dev/start-dev.sh

# Terminal 2: Run pipeline
./scripts/pipeline/run-full.sh design.png ./output
```

## Project Structure

```
llm-widget-factory/
├── apps/
│   ├── api/              # Python FastAPI backend for AI generation
│   └── playground/       # React web playground for visual editing
├── libs/
│   ├── js/               # JavaScript/TypeScript packages
│   │   ├── cli/          # Command-line tools
│   │   ├── compiler/     # DSL → JSX compiler
│   │   ├── dsl/          # WidgetDSL spec & validation
│   │   ├── exporter/     # PNG export utilities
│   │   ├── icons/        # 6950+ icon components & source files
│   │   ├── primitives/   # Base UI components
│   │   ├── renderer/     # Runtime JSX renderer
│   │   ├── validator/    # DSL validation
│   │   ├── resizer/      # Auto-resize utilities
│   │   └── dynamic/      # Dynamic imports
│   └── python/           # Python package
│       └── generator/    # AI-powered widget generation
└── scripts/              # Shell scripts for workflows
    ├── generation/       # Widget generation scripts
    ├── rendering/        # Compilation & rendering
    ├── pipeline/         # End-to-end workflows
    ├── dev/              # Development servers
    └── setup/            # Installation
```

## Core Workflows

### 1. AI Generation (No Server)
Transform design mockups into WidgetDSL using Vision-Language Models.

```bash
# Single image
./scripts/generation/generate-widget.sh mockup.png widget.json

# Batch processing (10 concurrent)
./scripts/generation/generate-batch.sh ./mockups ./output 10
```

**Output per image**:
- `widget.json` - Generated WidgetDSL
- `images/` - Debug visualizations (grounding, crops, retrieval)
- `prompts/` - Generation prompts at each stage
- `debug.json` - Detailed generation metadata

**Features**:
- Icon detection & retrieval (6950+ icons)
- Graph/chart recognition
- Layout analysis
- Parallel processing with configurable concurrency

### 2. Compilation (No Server)
Compile WidgetDSL to portable React JSX files.

```bash
./scripts/rendering/compile-widget.sh widget.json widget.jsx
```

**Programmatic Usage**:
```js
import { compileWidgetDSLToJSX } from '@widget-factory/compiler';

const jsx = compileWidgetDSLToJSX(widgetSpec);
```

### 3. Rendering (Requires Server)
Render JSX to PNG using Playwright headless browser.

```bash
# Start dev server first
./scripts/dev/start-dev.sh

# Then render
./scripts/rendering/render-widget.sh widget.jsx output.png
```

**Output**:
- `output.png` - Auto-resized widget
- `output_raw.png` - Natural layout size
- `output_autoresize.png` - Same as default

### 4. Full Pipeline
Complete workflow from image to PNG.

```bash
# Single image
./scripts/pipeline/run-full.sh design.png ./result

# Batch processing
./scripts/pipeline/run-batch-full.sh ./designs ./results 5
```

## NPM Packages

Published packages under `@widget-factory/*`:

- **[@widget-factory/dsl](./libs/js/packages/dsl/)** - WidgetDSL specification & validation
- **[@widget-factory/compiler](./libs/js/packages/compiler/)** - DSL → JSX compiler
- **[@widget-factory/renderer](./libs/js/packages/renderer/)** - Runtime JSX renderer
- **[@widget-factory/exporter](./libs/js/packages/exporter/)** - PNG export utilities
- **[@widget-factory/primitives](./libs/js/packages/primitives/)** - UI components (Text, Icon, Button, etc.)
- **[@widget-factory/icons](./libs/js/packages/icons/)** - 6950+ icon components
- **[@widget-factory/cli](./libs/js/packages/cli/)** - Command-line tools

## Python Package

**[generator](./libs/python/)** - AI-powered widget generation from images

**Installation**:
```bash
cd libs/python
pip install -e .
```

**CLI**:
```bash
generate-widget input.png output.json
generate-widget-batch ./images ./output --concurrency 5
```

**Features**:
- Vision-Language Model integration (Qwen-VL)
- Icon grounding & retrieval (BLIP2 + SigLIP)
- Graph detection
- Batch processing with progress tracking
- Debug visualizations

## Configuration

### Environment Variables

Configure via `.env` file:

```bash
# API Keys
DASHSCOPE_API_KEY=your-key-here

# Server Ports
BACKEND_PORT=8010
FRONTEND_PORT=3060
HOST=0.0.0.0

# AI Model Settings
DEFAULT_MODEL=qwen3-vl-flash
TIMEOUT=800

# Icon Retrieval
RETRIEVAL_TOPK=50
RETRIEVAL_TOPM=10
RETRIEVAL_ALPHA=0.8

# Performance
ENABLE_MODEL_CACHE=true
USE_CUDA_FOR_RETRIEVAL=true

# Security
MAX_FILE_SIZE_MB=100
MAX_REQUESTS_PER_MINUTE=1000

# Debug
SAVE_DEBUG_VISUALIZATIONS=true
SAVE_PROMPTS=true
```

### Model Caching

Enable for high-concurrency batch processing:
```bash
ENABLE_MODEL_CACHE=true
USE_CUDA_FOR_RETRIEVAL=true
```

Models (BLIP2, SigLIP) load once at startup and are shared across all requests with thread-safe access. Supports 200+ concurrent requests.

## Development

### Start Dev Server
```bash
# Frontend only (port 3060)
npm run dev

# Frontend + API
npm run dev:full
```

### Build for Production
```bash
npm run build
npm start  # Serves at http://localhost:4173
```

### Regenerate Icons
Only needed when updating SF Symbols source:
```bash
npm run build:icons
```
Generates 6950+ React components with lazy loading.

## Testing

All scripts have been tested and verified:

```bash
# Run test suite
./scripts/generation/generate-batch.sh assets/images-10 results/test 1

# Test compilation
./scripts/rendering/compile-widget.sh results/test/*/output/widget.json test.jsx

# Test full pipeline (requires server)
./scripts/pipeline/run-full.sh assets/images-10/image_0001.png results/pipeline-test
```

See [Test Report](results/script-tests/TEST_REPORT.md) for details.

## Implementation Details

### WidgetDSL Format
Hierarchical JSON structure with containers and leaf components:

```json
{
  "widget": {
    "backgroundColor": "#ffffff",
    "borderRadius": 16,
    "padding": 12,
    "root": {
      "type": "container",
      "direction": "col",
      "gap": 8,
      "children": [
        {
          "type": "leaf",
          "component": "Text",
          "props": { "fontSize": 16, "color": "#000000" },
          "content": "Hello World"
        }
      ]
    }
  }
}
```

### Icon System
6950+ SF Symbols with lazy loading:
```jsx
<Icon name="sf:circle.fill" size={24} color="#000000" />
<Icon name="lucide:Sun" />
```

Icons load on-demand via dynamic imports. Resources preload before rendering for accurate layout measurement.

### Layout System
Flex-based containers with explicit component properties:
- Use `flex` prop for flex properties
- Use `style` for other CSS
- Automatic aspect ratio preservation
- Natural size measurement before resize

### Rendering Pipeline
1. Extract resources from WidgetDSL
2. Preload icons and images in parallel
3. Compile to JSX after resources loaded
4. Measure natural size accurately
5. Auto-resize to target dimensions
6. Export to PNG

## Scripts Reference

See [scripts/README.md](./scripts/README.md) for complete documentation.

**Quick Reference**:
```bash
# Generation
./scripts/generation/generate-widget.sh <image> <output.json>
./scripts/generation/generate-batch.sh <input-dir> <output-dir> [concurrency]

# Rendering
./scripts/rendering/compile-widget.sh <dsl.json> <output.jsx>
./scripts/rendering/render-widget.sh <widget.jsx> <output.png>

# Pipeline
./scripts/pipeline/run-full.sh <image> <output-dir>
./scripts/pipeline/run-batch-full.sh <input-dir> <output-dir> [concurrency]

# Development
./scripts/dev/start-dev.sh      # Frontend server
./scripts/dev/start-api.sh      # API server
./scripts/dev/start-full.sh     # Both servers

# Setup
./scripts/setup/install.sh      # Install all dependencies
```

## Architecture

### Monorepo Organization

- `apps/` - Deployable applications (api, playground)
- `libs/js/` - JavaScript/TypeScript packages
- `libs/python/` - Python packages
- `scripts/` - Automation shell scripts

### Package Dependencies

```
@widget-factory/primitives
  ↓
@widget-factory/dsl → @widget-factory/compiler → @widget-factory/renderer
  ↓                      ↓
@widget-factory/icons  @widget-factory/exporter
```

## License

MIT
