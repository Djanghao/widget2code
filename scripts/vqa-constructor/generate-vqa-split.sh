#!/bin/bash
#
# Example script for generating VQA dataset with train/val/test split
# This uses the new batch-generate-vqa-split command
#
# Distribution:
# - 60% General Grounding (all UI elements grouped by type)
# - 10% Category-specific Grounding (specific component types)
# - 20% Referring (box-to-text descriptions)
# - 10% Layout (layout code generation)
#
# Split: 7:1:2 (train:val:test) based on widget folders
#

set -e

# Configuration
WIDGETS_DIR="${1:-./hub}"
OUTPUT_DIR="${2:-./results/vqa-dataset-v3}"
WIDGET_LIST="${3:-}"
SEED="${4:-42}"

echo "=============================================="
echo "VQA Dataset Generation with Split"
echo "=============================================="
echo "Input directory:  $WIDGETS_DIR"
echo "Output directory: $OUTPUT_DIR"
if [ -n "$WIDGET_LIST" ]; then
  echo "Widget list:      $WIDGET_LIST"
fi
echo "Random seed:      $SEED"
echo "=============================================="
echo ""

# Build the command
CMD="npx widget-factory batch-generate-vqa-split $WIDGETS_DIR"
CMD="$CMD --output-dir $OUTPUT_DIR"
CMD="$CMD --dataset-root $WIDGETS_DIR"
CMD="$CMD --seed $SEED"

if [ -n "$WIDGET_LIST" ]; then
  CMD="$CMD --widget-list $WIDGET_LIST"
fi

echo "Running: $CMD"
echo ""

# Execute the command
eval $CMD

echo ""
echo "=============================================="
echo "VQA dataset generation complete!"
echo "=============================================="
echo ""
echo "Output files created:"
echo "  - general_grounding_train.json"
echo "  - category_grounding_train.json"
echo "  - referring_train.json"
echo "  - layout_train.json"
echo "  - combined_train.json"
echo ""
echo "  - general_grounding_val.json"
echo "  - category_grounding_val.json"
echo "  - referring_val.json"
echo "  - layout_val.json"
echo "  - combined_val.json"
echo ""
echo "  - general_grounding_test.json"
echo "  - category_grounding_test.json"
echo "  - referring_test.json"
echo "  - layout_test.json"
echo "  - combined_test.json"
echo ""
echo "Task Distribution (in combined files):"
echo "  - 60% General Grounding"
echo "  - 10% Category-specific Grounding"
echo "  - 20% Referring"
echo "  - 10% Layout"
echo ""
