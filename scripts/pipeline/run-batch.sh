#!/bin/bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ $# -lt 4 ]; then
  echo "Usage: $0 <images-dir> <output-dir> <gen-concurrency> <render-concurrency> [--force]"
  echo "Example: $0 ./images ./results 8 4 --force"
  exit 1
fi

INPUT_DIR=$1
OUTPUT_DIR=$2
GEN_CONCURRENCY=$3
RENDER_CONCURRENCY=$4
FORCE_FLAG=${5:-}

# Validate input directory exists
if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Input directory not found: $INPUT_DIR"
  exit 1
fi

# Ensure output base directory exists
mkdir -p "$OUTPUT_DIR"

echo "=================================================="
echo "Running batch pipeline"
echo "  Images dir        : $INPUT_DIR"
echo "  Output dir        : $OUTPUT_DIR"
echo "  Gen concurrency   : $GEN_CONCURRENCY"
echo "  Render concurrency: $RENDER_CONCURRENCY"
if [ "$FORCE_FLAG" = "--force" ]; then
  echo "  Render mode       : FORCE (reprocess all)"
else
  echo "  Render mode       : incremental (skip successful)"
fi
echo "=================================================="
echo ""

export INTEGRATED_RENDER=true
export RENDER_CONCURRENCY="$RENDER_CONCURRENCY"

# Step 1+2: Integrated generation + per-image rendering
echo "Step 1+2: Generating and rendering in parallel (per image)..."
./scripts/generation/generate-batch.sh "$INPUT_DIR" "$OUTPUT_DIR" "$GEN_CONCURRENCY"

echo ""
echo "=================================================="
echo "✅ Batch pipeline completed (integrated rendering)"
echo "Root output dir: $OUTPUT_DIR"
echo "  Each widget is under: $OUTPUT_DIR/<image-stem>/"
echo "  Final PNG at:        $OUTPUT_DIR/<image-stem>/output.png"
echo "  Artifacts at:        $OUTPUT_DIR/<image-stem>/artifacts/"
echo "=================================================="
