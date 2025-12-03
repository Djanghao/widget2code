#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

OUTPUT_DIR=${1:-"$PROJECT_ROOT/output/4-vqa"}

echo "Stage 4: VQA Generation"
echo "  Output: $OUTPUT_DIR"
echo ""

echo "Generating VQA dataset..."
cd "$PROJECT_ROOT"
widget-factory batch-generate-vqa \
  "$PROJECT_ROOT/output/3-rendering/widgets" \
  --output-dir "$OUTPUT_DIR"

echo ""
echo "Stage 4 complete"
