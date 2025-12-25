#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

OUTPUT_DIR="$PROJECT_ROOT/output/4-vqa"
WIDGETS_DIR="$PROJECT_ROOT/output/3-rendering/widgets"
SEED=42

echo "Stage 4: VQA Generation (QUICK TEST)"
echo "  Output: $OUTPUT_DIR"
echo ""

echo "Generating VQA dataset with train/val/test split..."
cd "$PROJECT_ROOT"
node libs/js/cli/src/index.js batch-generate-vqa-split "$WIDGETS_DIR" \
  --output-dir "$OUTPUT_DIR" \
  --dataset-root "$WIDGETS_DIR" \
  --seed $SEED

echo ""
echo "Stage 4 complete"
