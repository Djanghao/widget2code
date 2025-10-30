#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input-dir> <output-dir> [concurrency] [dev-server-url]"
    echo "Example: $0 ./images ./output 5"
    exit 1
fi

INPUT_DIR=$1
OUTPUT_DIR=$2
CONCURRENCY=${3:-3}
DEV_SERVER=${4:-"http://localhost:$FRONTEND_PORT"}

mkdir -p "$OUTPUT_DIR"

echo "===== Full Batch Pipeline ====="
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "Concurrency: $CONCURRENCY"
echo ""

echo "Step 1/2: Generate WidgetDSL from images..."
./scripts/generation/generate-batch.sh "$INPUT_DIR" "$OUTPUT_DIR" "$CONCURRENCY"

echo ""
echo "Step 2/2: Batch render DSL to PNG..."
./scripts/rendering/render-batch.sh "$OUTPUT_DIR" "$OUTPUT_DIR" "$CONCURRENCY" "$DEV_SERVER"

echo ""
echo "===== Complete ====="
echo "Output: $OUTPUT_DIR"
echo "Each widget has its own subdirectory with:"
echo "  - widget_id_original.{ext}: Original image"
echo "  - widget_id.json: Generated DSL"
echo "  - widget_id.jsx: Compiled JSX"
echo "  - widget_id.png: Rendered PNG"
echo "  - log.json: Complete pipeline metadata"
