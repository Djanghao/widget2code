#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

OUTPUT_DIR="$PROJECT_ROOT/output/4-vqa"
WIDGETS_DIR="$PROJECT_ROOT/output/3-rendering/widgets"
SEED=42

echo "Stage 4: VQA Generation"
echo "  Output: $OUTPUT_DIR"
echo ""

# Validate Stage 3 output exists
if [ ! -d "$WIDGETS_DIR" ]; then
  echo "ERROR: Stage 4 requires Stage 3 output: $WIDGETS_DIR"
  echo "       Directory not found. Please run Stage 3 first."
  exit 1
fi

# Check for rendered widgets
widget_count=$(find "$WIDGETS_DIR" -name "output.png" 2>/dev/null | wc -l)
if [ $widget_count -eq 0 ]; then
  echo "ERROR: No rendered widgets found in $WIDGETS_DIR"
  echo "       Stage 3 may have failed. Check for output.png files."
  exit 1
fi
echo "INFO: Found $widget_count rendered widgets"

echo ""
echo "Generating VQA dataset with train/val/test split..."
cd "$PROJECT_ROOT"
if ! node libs/js/cli/src/index.js batch-generate-vqa-split "$WIDGETS_DIR" \
  --output-dir "$OUTPUT_DIR" \
  --dataset-root "$WIDGETS_DIR" \
  --seed $SEED; then
  echo "ERROR: VQA generation failed"
  exit 1
fi

echo ""
echo "Stage 4 complete"
