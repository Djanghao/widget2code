# LLM Widget Factory

Compile structured WidgetDSL (JSON) into portable JSX files. Includes primitive components, compiler, icons, and a demo playground.

Pipeline: WidgetDSL → JSX file → rendered result.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (first time only)
cp .env.example .env
# Edit .env with your API keys and settings
```

**Backend setup** (first time only, required for full mode):
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

**Development mode**:
```bash
# Frontend + backend API
npm run dev:full

# Frontend only (faster, no LLM generation)
npm run dev
```
Opens at http://localhost:3060

**Production mode**:
```bash
# Build and preview production bundle
npm run build
npm start
```
Runs optimized build with backend at http://localhost:4173

## Configuration

### Environment Variables

The project uses a `.env` file for configuration. **Never commit `.env` with API keys** to version control.

**Setup**:
```bash
cp .env.example .env
# Edit .env with your API keys and settings
```

**Configuration options** (edit `.env`):
```bash
# API Keys
DASHSCOPE_API_KEY=your-dashscope-api-key-here

# Server
BACKEND_PORT=8010
FRONTEND_PORT=3060
HOST=0.0.0.0

# Generation Settings
DEFAULT_MODEL=qwen3-vl-flash
RETRIEVAL_TOPK=50
RETRIEVAL_TOPM=10
RETRIEVAL_ALPHA=0.8
TIMEOUT=300

# Security
MAX_FILE_SIZE_MB=100
MAX_REQUESTS_PER_MINUTE=10
```

**Security notes**:
- `.env` is already in `.gitignore` - don't remove it
- Use `.env.example` as a template (this file IS committed)

### Regenerating Icons (Optional)
Only needed when updating SF Symbols source files:
```bash
npm run build:icons
```
Generates 6950+ React components with dynamic imports for lazy loading.

## Minimal Usage
```js
import { compileWidgetDSLToJSX } from '@widget-factory/compiler';

const jsx = compileWidgetDSLToJSX(spec);
```

## Headless Rendering

Batch render widgets to PNG with validation:

```bash
npm run render <input> <output> [concurrency]

# Examples
npm run render ./my-widget.json ./output
npm run render ./widgets-folder ./output 5
```

Output includes: PNG image, JSX code, spec JSON, and metadata.

## Implementation

**Layout**: Flex-based containers with explicit `component` + `props`

**Icons**: 6950+ SF Symbols with lazy loading
- Icons load on-demand via dynamic imports
- Resources preload before rendering (icons + images)
- Ensures accurate natural layout measurement
- `<Icon name="sf:circle.fill" />` or `<Icon name="lucide:Sun" />`

**Rendering Pipeline**:
1. Extract resources from WidgetDSL
2. Preload icons and images in parallel
3. Compile to JSX after resources loaded
4. Measure natural size accurately
5. Auto-resize to target aspect ratio
6. Export to PNG

**Styling**: Use `flex` prop for flex properties, `style` for others

## Project Structure

### Packages
Reusable npm packages that can be independently installed:

- **[`@widget-factory/dsl`](./packages/spec/)** - WidgetDSL protocol definition, validation, and utilities
- **[`@widget-factory/compiler`](./packages/compiler/)** - Compiles WidgetDSL to JSX files
- **[`@widget-factory/renderer`](./packages/renderer/)** - Runtime JSX renderer using Babel standalone
- **[`@widget-factory/exporter`](./packages/exporter/)** - Widget export utilities (PNG, etc.)
- **[`@widget-factory/primitives`](./packages/primitives/)** - Base UI components (WidgetShell, Text, Icon, etc.)
- **[`@widget-factory/icons`](./packages/icons/README.md)** - Auto-generated icon components and iconsMap

### Apps
- **[`playground`](./apps/playground/README.md)** - Interactive web playground with visual editing
- **`api`** - Python FastAPI backend for AI-powered widget generation

See individual package/app README for details.

## Playground Architecture

The playground implements a preview-driven auto-resize system with state flow management.

![Playground State Flow](https://raw.githubusercontent.com/Djanghao/llm-widget-factory/refs/heads/houston/feat/preview-driven-autoresize/playground/docs/architecture/stateflow-playground-latest.png)

Key components:
- **State Management**: Tracks preset changes and rendering lifecycle
- **Auto-resize Controller**: Dynamically adjusts widget dimensions based on rendered content
- **Preview System**: Real-time widget rendering with natural size calculation
