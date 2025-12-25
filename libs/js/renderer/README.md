# @widget-factory/renderer

Headless widget renderer using Playwright for server-side rendering and testing.

## Installation

This is an internal package. Import it using the workspace protocol:

```json
{
  "dependencies": {
    "@widget-factory/renderer": "*"
  }
}
```

## Basic Usage

### Simple API (Recommended)

```javascript
import {
  initializeRenderer,
  renderWidget,
  saveImage,
  closeRenderer
} from '@widget-factory/renderer';

// Initialize once
await initializeRenderer({
  devServerUrl: 'http://localhost:5173'
});

// Render widgets
const result = await renderWidget(widgetSpec);

if (result.success) {
  // Save the image
  await saveImage(result.imageBuffer, 'output/widget.png');
}

// Cleanup when done
await closeRenderer();
```

## API Reference

### Initialization

#### `initializeRenderer(options)`

Initialize the renderer with the given options.

**Parameters:**
- `options` (Object, optional):
  - `headless` (boolean): Run in headless mode (default: `true`)
  - `devServerUrl` (string): URL of the development server (default: `'http://localhost:5173'`)
  - `timeout` (number): Timeout in milliseconds (default: `30000`)
  - `viewportSize` (Object): Viewport size (default: `{ width: 1920, height: 1080 }`)
  - `verbose` (boolean): Enable verbose logging (default: `false`)

**Returns:** `Promise<void>`

### Rendering

#### `renderWidget(spec, options)`

Render a widget from a DSL specification.

**Parameters:**
- `spec` (Object): Widget DSL specification
- `options` (Object, optional):
  - `enableAutoResize` (boolean): Enable auto-resize (default: `true`)
  - `captureOptions` (Object): Capture options
  - `presetId` (string): Preset identifier (default: `'custom'`)

**Returns:** `Promise<Object>` - Result object with:
- `success` (boolean): Whether rendering succeeded
- `validation` (Object): Validation result
- `metadata` (Object): Widget metadata
- `naturalSize` (Object): Natural size of the widget
- `finalSize` (Object): Final size after resize
- `spec` (Object): The widget specification
- `jsx` (string): Generated JSX code
- `imageBuffer` (Buffer): PNG image buffer
- `presetId` (string): Preset identifier

#### `renderWidgetFromJSX(jsxCode, options)`

Render a widget from JSX code.

**Parameters:**
- `jsxCode` (string): JSX code string
- `options` (Object): Same as `renderWidget`

**Returns:** `Promise<Object>` - Same as `renderWidget`

### Utilities

#### `saveImage(imageBuffer, outputPath)`

Save an image buffer to a file.

**Parameters:**
- `imageBuffer` (Buffer): Image buffer to save
- `outputPath` (string): Output file path

**Returns:** `Promise<void>`

#### `generateFilename(presetId, metadata)`

Generate a filename for a rendered widget.

**Parameters:**
- `presetId` (string): Preset identifier
- `metadata` (Object): Widget metadata (must include `width`, `height`, `aspectRatio`)

**Returns:** `string` - Generated filename

#### `renderAndSave(spec, outputPath, options)`

Convenience function to render a widget and save to file in one call.

**Parameters:**
- `spec` (Object): Widget DSL specification
- `outputPath` (string): Output file path
- `options` (Object): Rendering options

**Returns:** `Promise<Object>` - Rendering result

### Batch Operations

#### `batchRender(specs, options)`

Render multiple widgets in sequence.

**Parameters:**
- `specs` (Array<Object>): Array of widget DSL specifications
- `options` (Object): Rendering options (applied to all widgets)

**Returns:** `Promise<Array<Object>>` - Array of rendering results

### Cleanup

#### `closeRenderer()`

Close the renderer and cleanup resources.

**Returns:** `Promise<void>`

## Example: Batch Rendering

```javascript
import {
  initializeRenderer,
  batchRender,
  saveImage,
  closeRenderer
} from '@widget-factory/renderer';

const widgetSpecs = [
  { widget: { /* ... */ } },
  { widget: { /* ... */ } },
  { widget: { /* ... */ } }
];

await initializeRenderer();

const results = await batchRender(widgetSpecs);

for (let i = 0; i < results.length; i++) {
  if (results[i].success) {
    await saveImage(results[i].imageBuffer, `output/widget-${i}.png`);
  }
}

await closeRenderer();
```

## Example: Using with DSL Mutator

```javascript
import { DSLMutator } from '@widget-factory/mutator';
import {
  initializeRenderer,
  renderWidget,
  saveImage,
  closeRenderer
} from '@widget-factory/renderer';

// Generate DSLs
const mutator = new DSLMutator();
await mutator.initialize();
await mutator.generate(100);

// Render some of them
await initializeRenderer();

// Render the first generated DSL
const firstDSL = /* get from generator results */;
const result = await renderWidget(firstDSL);

if (result.success) {
  await saveImage(result.imageBuffer, 'output/generated-widget.png');
}

await closeRenderer();
```

## Advanced Usage

### Direct Class Access (for Concurrent Rendering)

For advanced use cases requiring multiple concurrent renderer instances (e.g., batch processing with worker pools), you can use the `PlaywrightRenderer` class directly:

```javascript
import { PlaywrightRenderer } from '@widget-factory/renderer';

// Create multiple renderer instances
const renderers = [];
for (let i = 0; i < 3; i++) {
  const renderer = new PlaywrightRenderer({
    devServerUrl: 'http://localhost:5173'
  });
  await renderer.initialize();
  renderers.push(renderer);
}

// Use renderers concurrently
const specs = [/* ... */];
const queue = [...specs];

const processWidget = async (renderer) => {
  while (queue.length > 0) {
    const spec = queue.shift();
    if (spec) {
      const result = await renderer.renderWidget(spec);
      // Handle result...
    }
  }
};

// Process with all renderers in parallel
await Promise.all(renderers.map(r => processWidget(r)));

// Cleanup
await Promise.all(renderers.map(r => r.close()));
```

See `libs/js/cli/src/commands/batch-render.js` for a complete example of concurrent rendering.

## Notes

- The renderer requires a running development server (typically Vite) at the specified `devServerUrl`.
- The renderer uses Playwright's Chromium browser by default.
- Each render creates a new browser context for isolation.
- Always call `closeRenderer()` when done to cleanup resources and prevent memory leaks.
- For production use, consider adding error handling and retry logic.
