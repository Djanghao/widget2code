#!/usr/bin/env node

/**
 * @file compile.js
 * @description Compile WidgetDSL to JSX using @widget-factory/compiler
 */

import { compileWidgetDSLToJSX } from '@widget-factory/compiler';
import fs from 'fs/promises';
import path from 'path';

export async function compile(dslPath, outputPath) {
  try {
    // Optional output path - defaults to same directory, same name with .jsx extension
    if (!outputPath) {
      const parsed = path.parse(dslPath);
      outputPath = path.join(parsed.dir, `${parsed.name}.jsx`);
    }

    const dslData = await fs.readFile(dslPath, 'utf-8');
    const spec = JSON.parse(dslData);

    console.log(`[Compile] Input: ${dslPath}`);
    console.log(`[Compile] Output: ${outputPath}`);

    const jsx = compileWidgetDSLToJSX(spec);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, jsx, 'utf-8');

    console.log(`[Compile] ✓ Success`);
    console.log(`[Compile]   JSX saved to: ${outputPath}`);

    return { success: true, jsx };
  } catch (error) {
    console.error(`[Compile] ✗ Error: ${error.message}`);
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: widget-factory compile <dsl-json-path> [output-jsx-path]');
    process.exit(1);
  }

  const dslPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : undefined;

  compile(dslPath, outputPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
