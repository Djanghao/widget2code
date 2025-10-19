# LLM Widget Factory

Compile structured WidgetSpec (JSON) into portable JSX files. Includes primitive components, compiler, icons, and a demo playground.

Pipeline: WidgetSpec → JSX file → rendered result.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (first time only)
cd apps/playground
cp .env.example .env
# Edit .env to set your API key and ports
```

**Backend setup** (first time only, required for full mode):
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

**Run**:
```bash
# Start with backend API
npm run dev:full

# Or frontend only
npm run dev
```

This starts:
- Frontend at http://localhost:5173 (configurable via `FRONTEND_PORT`)
- Backend at http://localhost:8000 (configurable via `BACKEND_PORT`)

### Regenerating Icons (Optional)
Only needed when updating SF Symbols source files or modifying icon generation scripts:
```bash
npm run prepare:dynamic
npm run build:icons
```

## Minimal Usage
```js
import { compileWidgetSpecToJSX } from '@widget-factory/compiler';

const jsx = compileWidgetSpecToJSX(spec);
```

## Implementation
- Spec uses `component` + `props` explicitly; `kind` presets are deprecated.
- Layout uses flex containers: container nodes generate clean flex structure.
- Icons: SF Symbols SVGs → (optional) prepare dynamic colors → generate React components → `iconsMap` & `metadata` (for `<Icon />`). All icons support dynamic coloring via CSS variable `--icon-color`.
  - `<Icon />` sets `--icon-color` from the `color` prop; default is `rgba(255, 255, 255, 0.85)`.
- Flex properties should be passed as component `flex` prop (e.g., `<Text flex={1} />`), not in `style`; use `style` only for unmodeled styles.

## Project Structure

### Packages
Reusable npm packages that can be independently installed:

- **[`@widget-factory/spec`](./packages/spec/)** - WidgetSpec protocol definition, validation, and utilities
- **[`@widget-factory/compiler`](./packages/compiler/)** - Compiles WidgetSpec to JSX files
- **[`@widget-factory/renderer`](./packages/renderer/)** - Runtime JSX renderer using Babel standalone
- **[`@widget-factory/exporter`](./packages/exporter/)** - Widget export utilities (PNG, etc.)
- **[`@widget-factory/primitives`](./packages/primitives/)** - Base UI components (WidgetShell, Text, Icon, etc.)
- **[`@widget-factory/icons`](./packages/icons/README.md)** - Auto-generated icon components and iconsMap

### Tools
- **[`@widget-factory/cli`](./tools/cli/)** - CLI tool for batch widget rendering (headless mode)

### Apps
- **[`playground`](./apps/playground/README.md)** - Interactive web playground with visual editing
- **`api`** - Python FastAPI backend for AI-powered widget generation

See individual package/app README for details.

## Playground Architecture

The playground implements a preview-driven auto-resize system with state flow management.

See [`apps/playground/architecture.md`](./apps/playground/architecture.md) for detailed documentation.

Key components:
- **State Management**: Tracks preset changes and rendering lifecycle
- **Auto-resize Controller**: Dynamically adjusts widget dimensions based on rendered content
- **Preview System**: Real-time widget rendering with natural size calculation
