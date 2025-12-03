#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

COUNT=${1:-100}

echo "Stage 2: Mutator"
echo "  Count: $COUNT base DSLs"
echo "  Mode: controlled (theme transformations only)"
echo "  Themes: all (5 theme variants)"
echo "  Total output: ~$((COUNT * 5)) DSLs"
echo ""

echo "[1/3] Preparing mutator seeds (synthesis output + 76 examples)..."
bash "$PROJECT_ROOT/scripts/etl/prepare-mutator-seeds.sh"

echo ""
echo "[2/3] Running mutator batch generation..."
cd "$PROJECT_ROOT/libs/js/mutator"
node generate-dsl-diversity.js --count=$COUNT --mode=controlled --all-themes

echo ""
echo "[3/3] Extracting individual widgets from batch files..."
LATEST_RUN=$(ls -t "$PROJECT_ROOT/output/2-mutator/batch-generated" | head -1)
node "$PROJECT_ROOT/libs/js/renderer/src/extract-batch-widgets.js" \
  "$PROJECT_ROOT/output/2-mutator/batch-generated/$LATEST_RUN" \
  "$PROJECT_ROOT/output/2-mutator/flat"

echo ""
echo "Stage 2 complete"
