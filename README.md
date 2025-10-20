# LLM Widget Factory

Compile structured WidgetSpec (JSON) into portable JSX files. Includes primitive components, compiler, icons, and a demo playground.

Pipeline: WidgetSpec → JSX file → rendered result.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (first time only)
cd apps
cp config.yaml.example config.yaml
# Edit config.yaml with your settings (ports, etc.)
# IMPORTANT: Never commit config.yaml with sensitive data - it's in .gitignore
cd ..
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
# Start with backend API
npm run dev:full

# Or frontend only
npm run dev
```

**Production mode**:
```bash
# Build for production
npm run build

# Start production server
npm start
```

This starts:
- Frontend at http://localhost:3060 (configurable via `FRONTEND_PORT`)
- Backend at http://localhost:8000 (configurable via `BACKEND_PORT`)

## Configuration

### Configuration File

The project uses `config.yaml` for server settings. **Never commit `config.yaml` with sensitive data** to version control.

**Setup**:
```bash
cd apps
cp config.yaml.example config.yaml
# Edit config.yaml with your preferred settings
```

**Configuration options** (edit `apps/config.yaml`):
```yaml
server:
  backend_port: 8000      # Backend API port
  frontend_port: 3060     # Frontend dev server port
  host: 0.0.0.0          # Server host (0.0.0.0 for remote access, 127.0.0.1 for local only)

cors:
  origins:
    - "*"                 # Allowed CORS origins

security:
  max_requests_per_minute: 10
  max_file_size_mb: 100
```

**Security notes**:
- `config.yaml` is already in `.gitignore` - don't remove it
- Use `config.yaml.example` as a template (this file IS committed)

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

![Playground State Flow](https://raw.githubusercontent.com/Djanghao/llm-widget-factory/refs/heads/houston/feat/preview-driven-autoresize/playground/docs/architecture/stateflow-playground-latest.png)

Key components:
- **State Management**: Tracks preset changes and rendering lifecycle
- **Auto-resize Controller**: Dynamically adjusts widget dimensions based on rendered content
- **Preview System**: Real-time widget rendering with natural size calculation
