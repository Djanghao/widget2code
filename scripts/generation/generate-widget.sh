#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ $# -lt 2 ]; then
    echo "Usage: $0 <image-path> <output-dir>"
    echo "Example: $0 input.png ./output"
    echo ""
    echo "Note: This will create output-dir/image-name/ with full artifacts"
    echo "      The DSL will be at output-dir/image-name/artifacts/4-dsl/widget.json"
    exit 1
fi

IMAGE_PATH=$1
OUTPUT_DIR=$2

# Validate image file exists
if [ ! -f "$IMAGE_PATH" ]; then
    echo "Error: Image file not found: $IMAGE_PATH"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "=================================================="
echo "Generating widget from image: $IMAGE_PATH"
echo "Output directory: $OUTPUT_DIR"
echo "=================================================="

source apps/api/.venv/bin/activate

generate-widget "$IMAGE_PATH" "$OUTPUT_DIR"
