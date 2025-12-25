#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EXAMPLES_DIR="$PROJECT_ROOT/apps/playground/src/examples"
SYNTHESIS_OUTPUT="$PROJECT_ROOT/output/1-synthesis/render-ready"
OUTPUT_DIR="$PROJECT_ROOT/output/2-mutator/seeds"

echo "=========================================="
echo "Preparing Mutator Seeds"
echo "=========================================="
echo ""
echo "Combining:"
echo "  1. Synthesis output: $SYNTHESIS_OUTPUT"
echo "  2. 76 examples: $EXAMPLES_DIR"
echo ""
echo "Output: $OUTPUT_DIR"
echo ""

mkdir -p "$OUTPUT_DIR"

TOTAL_COUNT=0
SYNTHESIS_COUNT=0
EXAMPLES_COUNT=0

echo "[1/2] Copying synthesis render-ready output..."
if [ -d "$SYNTHESIS_OUTPUT" ]; then
  shopt -s nullglob
  for file in "$SYNTHESIS_OUTPUT"/*.json; do
    basename=$(basename "$file")
    cp "$file" "$OUTPUT_DIR/synthesis-$basename"
    SYNTHESIS_COUNT=$((SYNTHESIS_COUNT + 1))
  done
  shopt -u nullglob
  echo "  SUCCESS: Copied $SYNTHESIS_COUNT synthesis widgets"
else
  echo "  WARNING: Synthesis output directory not found, skipping..."
fi

echo ""
echo "[2/2] Copying 76 example widgets..."
if [ -d "$EXAMPLES_DIR" ]; then
  shopt -s nullglob
  for file in "$EXAMPLES_DIR"/*.json; do
    basename=$(basename "$file")
    cp "$file" "$OUTPUT_DIR/example-$basename"
    EXAMPLES_COUNT=$((EXAMPLES_COUNT + 1))
  done
  shopt -u nullglob
  echo "  SUCCESS: Copied $EXAMPLES_COUNT example widgets"
else
  echo "  WARNING: Examples directory not found!"
  echo "  Note: Mutator diversity will be limited without example seeds"
fi

TOTAL_COUNT=$((SYNTHESIS_COUNT + EXAMPLES_COUNT))

echo ""
echo "=========================================="
echo "Seed Preparation Complete"
echo "=========================================="
echo "Total seeds: $TOTAL_COUNT"
echo "  - Synthesis: $SYNTHESIS_COUNT"
echo "  - Examples:  $EXAMPLES_COUNT"
echo ""
echo "Output: $OUTPUT_DIR"
echo ""
