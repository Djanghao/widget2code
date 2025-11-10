#!/usr/bin/env node

/**
 * @file render.js
 * @description Render JSX to PNG using @widget-factory/renderer
 */

import { PlaywrightRenderer } from '@widget-factory/renderer';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function render(jsxPath, outputPath, options = {}) {
  const frontendPort = process.env.FRONTEND_PORT || '3060';
  const { devServerUrl = `http://localhost:${frontendPort}` } = options;

  try {
    // Optional output path - defaults to same directory, same name with .png extension
    if (!outputPath) {
      const parsed = path.parse(jsxPath);
      outputPath = path.join(parsed.dir, `${parsed.name}.png`);
    }

    const jsxCode = await fs.readFile(jsxPath, 'utf-8');

    console.log(`[Render] Input: ${jsxPath}`);
    console.log(`[Render] Output: ${outputPath}`);
    console.log(`[Render] Dev Server: ${devServerUrl}`);

    const renderer = new PlaywrightRenderer({
      devServerUrl,
      timeout: 30000,
      verbose: false
    });

    await renderer.initialize();

    const context = await renderer.browser.newContext({
      viewport: renderer.options.viewportSize
    });
    const page = await context.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error('[Browser Error]', text);
      } else if (text.includes('[Headless]')) {
        console.log('[Browser]', text);
      }
    });

    const headlessUrl = `${devServerUrl}/headless.html`;
    await page.goto(headlessUrl, {
      waitUntil: 'networkidle',
      timeout: renderer.options.timeout
    });

    await page.waitForFunction(() => window.__headlessReady === true, {
      timeout: renderer.options.timeout
    });

    // Render RAW version (no autoresize)
    console.log('[Render] Rendering RAW (natural layout)...');
    const rawResult = await page.evaluate(async ({ jsxCode }) => {
      try {
        return await window.renderWidgetFromJSX(jsxCode, {
          enableAutoResize: false,
          captureOptions: {}
        });
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { jsxCode });

    if (!rawResult.success) {
      await context.close();
      await renderer.close();
      throw new Error(`RAW render failed: ${rawResult.error}`);
    }

    const rawBase64 = rawResult.imageData.split(',')[1];
    const rawImageBuffer = Buffer.from(rawBase64, 'base64');

    const parsed = path.parse(outputPath);
    const rawPath = path.join(parsed.dir, `${parsed.name}_raw${parsed.ext}`);
    await PlaywrightRenderer.saveImage(rawImageBuffer, rawPath);
    console.log(`[Render] ✓ RAW: ${rawResult.metadata.width}×${rawResult.metadata.height} -> ${rawPath}`);

    // Render AUTORESIZE version
    console.log('[Render] Rendering AUTORESIZE...');
    const result = await page.evaluate(async ({ jsxCode }) => {
      try {
        return await window.renderWidgetFromJSX(jsxCode, {
          enableAutoResize: true,
          captureOptions: {}
        });
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { jsxCode });

    await context.close();
    await renderer.close();

    if (!result.success) {
      throw new Error(`AUTORESIZE render failed: ${result.error}`);
    }

    const base64Data = result.imageData.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Save autoresize version
    const autoresizePath = path.join(parsed.dir, `${parsed.name}_autoresize${parsed.ext}`);
    await PlaywrightRenderer.saveImage(imageBuffer, autoresizePath);
    console.log(`[Render] ✓ AUTORESIZE: ${result.metadata.width}×${result.metadata.height} -> ${autoresizePath}`);

    // Save default output (same as autoresize for backwards compatibility)
    await PlaywrightRenderer.saveImage(imageBuffer, outputPath);

    console.log(`[Render] ✓ Success`);
    if (result.finalSize) {
      console.log(`[Render]   Size: ${result.finalSize.width}×${result.finalSize.height}`);
    } else if (result.metadata) {
      console.log(`[Render]   Size: ${result.metadata.width}×${result.metadata.height}`);
    }
    console.log(`[Render]   Default PNG: ${outputPath}`);

    return { success: true, imageBuffer, result };
  } catch (error) {
    console.error(`[Render] ✗ Error: ${error.message}`);
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: widget-factory render <jsx-file-path> [output-png-path] [dev-server-url]');
    process.exit(1);
  }

  const jsxPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : undefined;
  const devServerUrl = args[2] || 'http://localhost:3060';

  render(jsxPath, outputPath, { devServerUrl })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
