#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <image> [output-dir] [dev-server-url]"
    echo "Example: $0 input.png [./output]"
    exit 1
fi

IMAGE_PATH=$1
OUTPUT_DIR=${2:-.}
DEV_SERVER=${3:-"http://localhost:$FRONTEND_PORT"}

mkdir -p "$OUTPUT_DIR"

BASENAME=$(basename "$IMAGE_PATH" | sed 's/\.[^.]*$//')
DSL_PATH="$OUTPUT_DIR/${BASENAME}.json"
JSX_PATH="$OUTPUT_DIR/${BASENAME}.jsx"
PNG_PATH="$OUTPUT_DIR/${BASENAME}.png"

echo "===== Full Pipeline ====="
echo "Image: $IMAGE_PATH"
echo "Output: $OUTPUT_DIR"
echo ""

echo "Step 1/3: Generate WidgetDSL from image..."
./scripts/generation/generate-widget.sh "$IMAGE_PATH" "$DSL_PATH"

echo ""
echo "Step 2/3: Compile DSL to JSX..."
./scripts/rendering/compile-widget.sh "$DSL_PATH" "$JSX_PATH"

echo ""
echo "Step 3/3: Render JSX to PNG..."
./scripts/rendering/render-widget.sh "$JSX_PATH" "$PNG_PATH" "$DEV_SERVER"

echo ""
echo "===== Complete ====="
echo "DSL: $DSL_PATH"
echo "JSX: $JSX_PATH"
echo "PNG: $PNG_PATH"
