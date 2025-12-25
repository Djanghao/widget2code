#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CONCURRENCY=3
INPUT_DIR="$PROJECT_ROOT/output/2-mutator/flat"
OUTPUT_DIR="$PROJECT_ROOT/output/3-rendering/widgets"

echo "Stage 3: Rendering"
echo "  Concurrency: $CONCURRENCY"
echo ""

# Validate Stage 2 output exists
if [ ! -d "$INPUT_DIR" ]; then
  echo "ERROR: Stage 3 requires Stage 2 output: $INPUT_DIR"
  echo "       Directory not found. Please run Stage 2 first."
  exit 1
fi

file_count=$(find "$INPUT_DIR" -name "*.json" 2>/dev/null | wc -l)
if [ $file_count -eq 0 ]; then
  echo "ERROR: Stage 3 input directory is empty: $INPUT_DIR"
  echo "       No JSON files found. Stage 2 may have failed."
  exit 1
fi
echo "INFO: Found $file_count widgets to render"

echo ""
echo "[1/2] Preparing batch structure..."
if ! bash "$PROJECT_ROOT/scripts/rendering/prepare-batch-structure.sh" \
  "$INPUT_DIR" \
  "$OUTPUT_DIR"; then
  echo "ERROR: Failed to prepare batch structure"
  exit 1
fi

echo ""
echo "[2/2] Running batch render..."
cd "$PROJECT_ROOT"
if ! node libs/js/cli/src/index.js batch-render "$OUTPUT_DIR" --concurrency $CONCURRENCY; then
  echo "ERROR: Batch rendering failed"
  exit 1
fi

echo ""
echo "Stage 3 complete"
