#!/usr/bin/env node

/**
 * @file batch-render.js
 * @description CLI command for batch rendering widgets
 * Thin wrapper that delegates to @widget-factory/renderer
 * @author Houston Zhang
 * @date 2025-10-29
 */

import { batchRender } from '@widget-factory/renderer';
import path from 'path';

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
Usage: widget-factory batch-render <directory> [options]

Arguments:
  directory     Path to directory containing widget subdirectories with DSL files

Options:
  --concurrency N   Number of concurrent renderers (default: 3)
  --force           Force reprocess all widgets, even if already completed

Description:
  Process widgets in-place within their own subdirectories.
  Each widget subdirectory must contain a DSL file at artifacts/4-dsl/widget.json
  Renders will be saved in the same subdirectory.

Examples:
  widget-factory batch-render ./widgets
  widget-factory batch-render ./widgets --concurrency 5
  widget-factory batch-render ./widgets --force
  widget-factory batch-render ./widgets --concurrency 1 --force
`);
    process.exit(1);
  }

  // Parse arguments
  const inputPath = path.resolve(args[0]);
  let concurrency = 3;
  let force = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[i + 1]);
      i++; // Skip next arg
    } else if (args[i] === '--force') {
      force = true;
    } else if (!args[i].startsWith('--')) {
      // Legacy support: bare number is concurrency
      concurrency = parseInt(args[i]) || 3;
    }
  }

  batchRender(inputPath, { concurrency, force })
    .then(({ failedCount }) => process.exit(failedCount > 0 ? 1 : 0))
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}
