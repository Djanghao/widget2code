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

echo "[1/2] Preparing batch structure..."
bash "$PROJECT_ROOT/scripts/rendering/prepare-batch-structure.sh" \
  "$INPUT_DIR" \
  "$OUTPUT_DIR"

echo ""
echo "[2/2] Running batch render..."
cd "$PROJECT_ROOT"
node libs/js/cli/src/index.js batch-render "$OUTPUT_DIR" --concurrency $CONCURRENCY

echo ""
echo "Stage 3 complete"
