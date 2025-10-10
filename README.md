# AI Widget Factory

Compile structured WidgetSpec (JSON) into runnable React components. Includes primitive components, compiler, icons, and demo playground.

Recommended pipeline: WidgetSpec → JSX → rendered result. Generated JSX is used for actual rendering (via compiler renderer).

## Quick Start
```bash
npm install
npm run build:icons
cd playground
npm run dev:full
```
This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:8000

Backend requires Python environment setup (first time only):
```bash
cd playground/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `playground/api/.env` with:
```
ARK_API_KEY=your_volcengine_api_key
```

## Minimal Usage
```js
import { compileWidgetSpecToComponent } from '@widget-factory/compiler';
const Widget = compileWidgetSpecToComponent(spec);
```

## Implementation
- Spec uses `component` + `props` explicitly; `kind` presets are deprecated.
- Layout uses flex containers: container nodes generate clean flex structure.
- Icon pipeline: Read SVG → Generate React components → `iconsMap` & `metadata` (for `<Icon />`).
- Flex properties should be passed as component `flex` prop (e.g., `<Text flex={1} />`), not in `style`; use `style` only for unmodeled styles.

## Packages
- `@widget-factory/primitives`: Base components (WidgetShell, Text, Icon, etc.)
- `@widget-factory/compiler`: Compiler (outputs JSX strings) and runtime renderer (outputs runnable components)
- `@widget-factory/icons`: Auto-generated icon components and `iconsMap`
- `playground`: Demo app with visual editing

See individual package README for details.
