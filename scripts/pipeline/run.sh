#!/bin/bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input-image> <output-dir>"
  echo "Example: $0 ./images/design.png ./results"
  exit 1
fi

INPUT_IMAGE=$1
OUTPUT_DIR=$2

# Validate input image exists
if [ ! -f "$INPUT_IMAGE" ]; then
  echo "Error: Input image file not found: $INPUT_IMAGE"
  exit 1
fi

# Ensure output base directory exists
mkdir -p "$OUTPUT_DIR"

echo "=================================================="
echo "Running pipeline"
echo "  Image : $INPUT_IMAGE"
echo "  Output: $OUTPUT_DIR"
echo "=================================================="
echo ""

# Step 1: Generate widget (Image -> WidgetDSL + artifacts)
echo "Step 1/2: Generating WidgetDSL..."

# Capture generator output to detect the actual widget directory
GEN_LOG=$(./scripts/generation/generate-widget.sh "$INPUT_IMAGE" "$OUTPUT_DIR" 2>&1 | tee /dev/stderr)

# Try to parse the widget directory from generator output, fallback to <output-dir>/<image-stem>
PARSED_DIR=$(printf "%s\n" "$GEN_LOG" | sed -n 's/^  Widget directory: \(.*\)/\1/p' | tail -n 1 || true)
IMAGE_BASENAME=$(basename -- "$INPUT_IMAGE")
IMAGE_STEM=${IMAGE_BASENAME%.*}
WIDGET_DIR=${PARSED_DIR:-"$OUTPUT_DIR/$IMAGE_STEM"}

# Verify the expected DSL exists
DSL_FILE="$WIDGET_DIR/artifacts/4-dsl/widget.json"
if [ ! -f "$DSL_FILE" ]; then
  echo ""
  echo "❌ Expected DSL not found: $DSL_FILE"
  echo "   Generation output may differ. Please check logs above."
  exit 1
fi

echo ""
echo "✅ DSL ready: $DSL_FILE"
echo ""

# Step 2: Render widget (DSL -> JSX -> PNG)
echo "Step 2/2: Rendering widget..."
./scripts/rendering/render-widget.sh "$WIDGET_DIR"

FINAL_PNG="$WIDGET_DIR/output.png"
if [ -f "$FINAL_PNG" ]; then
  echo ""
  echo "✅ Rendering completed: $FINAL_PNG"
fi

echo ""
echo "=================================================="
echo "✅ Pipeline completed"
echo "Widget directory: $WIDGET_DIR"
echo "Outputs:"
echo "  - $WIDGET_DIR/output.png"
echo "  - $WIDGET_DIR/artifacts/ (DSL, JSX, intermediate files)"
echo "=================================================="
