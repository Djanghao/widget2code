# LLM Widget Factory

Compile structured WidgetSpec (JSON) into portable JSX files. Includes primitive components, compiler, icons, and a demo playground.

Pipeline: WidgetSpec → JSX file → rendered result.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (first time only)
cd playground
cp .env.example .env
# Edit .env to set your API key and ports
```

**Backend setup** (first time only, required for full mode):
```bash
cd playground/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
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

## Packages
- `@widget-factory/primitives`: Base components (WidgetShell, Text, Icon, etc.)
- `@widget-factory/compiler`: Outputs complete JSX files from a WidgetSpec
- [`@widget-factory/icons`](./packages/icons/README.md): Auto-generated icon components and `iconsMap`
- [`playground`](./playground/README.md): Demo app with visual editing (Vite dev plugin writes generated JSX to `src/generated/Widget.jsx`)

See individual package README for details.
