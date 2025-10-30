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
DSL_DIR="$OUTPUT_DIR/dsl"
mkdir -p "$DSL_DIR"

echo "===== Full Batch Pipeline ====="
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "Concurrency: $CONCURRENCY"
echo ""

echo "Step 1/2: Generate WidgetDSL from images..."
./scripts/generation/generate-batch.sh "$INPUT_DIR" "$DSL_DIR"

echo ""
echo "Step 2/2: Batch render DSL to PNG..."
./scripts/rendering/render-batch.sh "$DSL_DIR" "$OUTPUT_DIR" "$CONCURRENCY"

echo ""
echo "===== Complete ====="
echo "DSL: $DSL_DIR"
echo "PNG: $OUTPUT_DIR"
