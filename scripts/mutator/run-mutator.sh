#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

COUNT=100

echo "Stage 2: Mutator"
echo "  Count: $COUNT base DSLs"
echo "  Mode: controlled (theme transformations only)"
echo "  Themes: all (5 theme variants)"
echo "  Total output: ~$((COUNT * 5)) DSLs"
echo ""

# Validate Stage 1 output exists
SYNTHESIS_OUTPUT="$PROJECT_ROOT/output/1-synthesis/render-ready"
if [ ! -d "$SYNTHESIS_OUTPUT" ]; then
  echo "ERROR: Stage 2 requires Stage 1 output: $SYNTHESIS_OUTPUT"
  echo "       Directory not found. Please run Stage 1 first."
  exit 1
fi

echo "[1/3] Preparing mutator seeds (synthesis output + 76 examples)..."
if ! bash "$PROJECT_ROOT/scripts/etl/prepare-mutator-seeds.sh"; then
  echo "ERROR: Failed to prepare mutator seeds"
  exit 1
fi

echo ""
echo "[2/3] Running mutator batch generation..."
cd "$PROJECT_ROOT/libs/js/mutator"
if ! node generate-dsl-diversity.js --count=$COUNT --mode=controlled --all-themes; then
  echo "ERROR: Mutator batch generation failed"
  exit 1
fi

echo ""
echo "[3/3] Extracting individual widgets from batch files..."

# Find latest run with proper validation
BATCH_DIR="$PROJECT_ROOT/output/2-mutator/batch-generated"
LATEST_RUN=$(ls -t "$BATCH_DIR" 2>/dev/null | head -1)

if [ -z "$LATEST_RUN" ]; then
  echo "ERROR: No mutator runs found in $BATCH_DIR"
  exit 1
fi

RUN_DIR="$BATCH_DIR/$LATEST_RUN"
if [ ! -d "$RUN_DIR" ]; then
  echo "ERROR: Latest run directory not found: $RUN_DIR"
  exit 1
fi

# Verify run completed successfully
if [ ! -f "$RUN_DIR/generation-report.json" ]; then
  echo "WARNING: Latest run may be incomplete (no generation-report.json found)"
  echo "         Proceeding anyway, but extraction may fail..."
fi

echo "INFO: Using latest mutator run: $LATEST_RUN"

if ! node "$PROJECT_ROOT/libs/js/renderer/src/extract-batch-widgets.js" \
  "$RUN_DIR" \
  "$PROJECT_ROOT/output/2-mutator/flat"; then
  echo "ERROR: Widget extraction failed"
  exit 1
fi

# Validate extraction output
FLAT_DIR="$PROJECT_ROOT/output/2-mutator/flat"
file_count=$(find "$FLAT_DIR" -name "*.json" 2>/dev/null | wc -l)
if [ $file_count -eq 0 ]; then
  echo "ERROR: No widgets extracted to $FLAT_DIR"
  exit 1
fi
echo "INFO: Extracted $file_count widget files"

echo ""
echo "Stage 2 complete"
