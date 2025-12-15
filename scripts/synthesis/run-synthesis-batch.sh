#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

LIMIT=10

echo "Stage 1: Synthesis"
echo "  Limit: $LIMIT descriptions per domain"
echo ""

echo "[1/2] Running synthesis batch generation..."
cd "$PROJECT_ROOT/libs/js/synthesis"

if ! node batch/batch-generate-widgets.js --limit=$LIMIT; then
  echo "ERROR: Synthesis batch generation failed"
  exit 1
fi

echo ""
echo "[2/2] Running prepare-render..."
if ! node postprocess/prepare-render.js; then
  echo "ERROR: Prepare-render failed"
  exit 1
fi

# Validate output was created
OUTPUT_DIR="$PROJECT_ROOT/output/1-synthesis/render-ready"
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "ERROR: Synthesis output directory not created: $OUTPUT_DIR"
  exit 1
fi

file_count=$(find "$OUTPUT_DIR" -name "*.json" 2>/dev/null | wc -l)
if [ $file_count -eq 0 ]; then
  echo "WARNING: No JSON files generated in $OUTPUT_DIR"
else
  echo "INFO: Generated $file_count widget files"
fi

echo ""
echo "Stage 1 complete"
