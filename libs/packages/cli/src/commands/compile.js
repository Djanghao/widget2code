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

  if (args.length < 2) {
    console.error('Usage: widget-factory compile <dsl-json-path> <output-jsx-path>');
    process.exit(1);
  }

  const [dslPath, outputPath] = args.map(p => path.resolve(p));

  compile(dslPath, outputPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
