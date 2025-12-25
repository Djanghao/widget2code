#!/usr/bin/env node

/**
 * @file render.js
 * @description Render a single widget from its directory (DSL → JSX → PNG)
 * Uses the unified renderSingleWidget function for consistency with batch-render
 */

import { PlaywrightRenderer, renderSingleWidget } from '@widget-factory/renderer';
import path from 'path';

export async function render(widgetDir, options = {}) {
  const frontendPort = process.env.FRONTEND_PORT || '3060';
  const { devServerUrl = `http://localhost:${frontendPort}` } = options;

  try {
    console.log('🚀 Widget Factory - Single Widget Renderer\n');
    console.log(`Widget directory: ${widgetDir}`);
    console.log(`Dev Server: ${devServerUrl}\n`);

    // Initialize renderer
    const renderer = new PlaywrightRenderer({
      devServerUrl,
      timeout: 30000,
      verbose: false
    });

    await renderer.initialize();

    try {
      // Use unified rendering function
      const result = await renderSingleWidget(renderer, widgetDir, options);

      await renderer.close();

      if (result.success) {
        console.log('\n✅ Rendering completed successfully!');
        return { success: true, result };
      } else {
        console.error(`\n❌ Rendering failed: ${result.error}`);
        return { success: false, error: result.error };
      }
    } finally {
      // Ensure renderer is closed even if error occurs
      await renderer.close().catch(() => {});
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Usage: widget-factory render <widget-directory>

Arguments:
  widget-directory    Path to widget directory containing DSL file at artifacts/4-dsl/widget.json

Description:
  Render a single widget by compiling its DSL to JSX and rendering to PNG.
  The widget directory must contain a generated DSL file from the generation pipeline.

  Output will be saved in the same directory:
  - artifacts/5-compilation/widget.jsx
  - artifacts/6-rendering/6.1-raw.png
  - artifacts/6-rendering/6.2-autoresize.png
  - artifacts/6-rendering/6.3-resize.png
  - output.png (final output)

Examples:
  widget-factory render ./results/tmp/image_0001
  widget-factory render ./widgets/my-widget
`);
    process.exit(1);
  }

  const widgetDir = path.resolve(args[0]);

  render(widgetDir)
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}
