#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input-image> <output-folder>"
    echo "Example: $0 input.png ./output/image_0001"
    exit 1
fi

INPUT_IMAGE=$1
OUTPUT_FOLDER=$2

# Validate input image exists
if [ ! -f "$INPUT_IMAGE" ]; then
    echo "Error: Input image file not found: $INPUT_IMAGE"
    exit 1
fi

# Create output folder structure
mkdir -p "$OUTPUT_FOLDER/artifacts"
mkdir -p "$OUTPUT_FOLDER/log"
mkdir -p "$OUTPUT_FOLDER/prompts"

# Copy input image to output folder
cp "$INPUT_IMAGE" "$OUTPUT_FOLDER/input.png"

echo "=================================================="
echo "Running full pipeline for: $INPUT_IMAGE"
echo "Output folder: $OUTPUT_FOLDER"
echo "=================================================="
echo ""

# Step 1: Generate DSL
echo "Step 1/2: Generating DSL..."
DSL_OUTPUT="$OUTPUT_FOLDER/artifacts/4-dsl/widget.json"
mkdir -p "$(dirname "$DSL_OUTPUT")"

./scripts/generation/generate-widget.sh "$INPUT_IMAGE" "$DSL_OUTPUT"

echo ""
echo "✅ DSL generation completed: $DSL_OUTPUT"
echo ""

# Step 2: Render widget
echo "Step 2/2: Rendering widget..."
RENDER_OUTPUT="$OUTPUT_FOLDER/artifacts"

./scripts/rendering/render-widget.sh "$DSL_OUTPUT" "$RENDER_OUTPUT"

# Move the final rendered output to the root of output folder
if [ -f "$RENDER_OUTPUT/widget.png" ]; then
    mv "$RENDER_OUTPUT/widget.png" "$OUTPUT_FOLDER/output.png"
    echo ""
    echo "✅ Rendering completed: $OUTPUT_FOLDER/output.png"
fi

echo ""
echo "=================================================="
echo "✅ Pipeline completed successfully!"
echo "=================================================="
echo "Output folder: $OUTPUT_FOLDER"
echo "  - input.png: Input image"
echo "  - output.png: Rendered widget"
echo "  - artifacts/: Generated artifacts (DSL, JSX, intermediate files)"
echo "=================================================="
