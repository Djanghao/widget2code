#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

COUNT=5

echo "Stage 2: Mutator (QUICK TEST)"
echo "  Base count: $COUNT DSLs"
echo "  Vary: themes (5 variants)"
echo "  Total output: $((COUNT * 5)) DSLs"
echo ""

echo "[1/3] Preparing mutator seeds (synthesis output + 76 examples)..."
bash "$PROJECT_ROOT/scripts/etl/prepare-mutator-seeds.sh"

echo ""
echo "[2/3] Running mutator batch generation..."
cd "$PROJECT_ROOT/libs/js/mutator"
node generate-dsl-diversity.js $COUNT --vary themes

echo ""
echo "[3/3] Extracting individual widgets from batch files..."
LATEST_RUN=$(ls -t "$PROJECT_ROOT/output/2-mutator/batch-generated" | head -1)
node "$PROJECT_ROOT/libs/js/renderer/src/extract-batch-widgets.js" \
  "$PROJECT_ROOT/output/2-mutator/batch-generated/$LATEST_RUN" \
  "$PROJECT_ROOT/output/2-mutator/flat"

echo ""
echo "Stage 2 complete"
