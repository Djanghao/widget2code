#!/bin/bash
#
# Generate VQA Dataset from Widget Directory
#
# This script generates Visual Question Answering datasets for all widgets
# in a directory. It provides a simple default workflow while maintaining
# flexibility for advanced use cases.
#
# Simple usage: ./generate-all.sh <widget-directory>
# Advanced usage: ./generate-all.sh <widget-directory> [options]
#

set -e

# Function to display help
show_help() {
    cat << EOF
🎯 VQA Dataset Generator - Generate All Widgets

Usage: $0 <widget-directory> [options]

Arguments:
  widget-directory    Directory containing widget subdirectories with:
                      - artifacts/4-dsl/widget.json (DSL specification)
                      - artifacts/6-rendering/6.4-bounding-boxes.json (Bounding boxes)
                      - output.png (Rendered image)

Options:
  --output-dir PATH       Custom output directory (default: <widget-directory>/vqa-dataset)
  --target-size NUMBER    Limit combined dataset size (default: use all data)
  --avoid FILE            Path to existing combined.json to avoid duplicates
  --widget-list FILE      Process only widgets listed in file (one ID per line)
  --help, -h              Show this help message

Examples:
  # Simple: generate VQA for all widgets
  $0 results/widgets-dsl

  # Custom output location
  $0 results/widgets-dsl --output-dir ./my-vqa-dataset

  # Incremental: avoid duplicates from existing dataset
  $0 results/widgets-dsl --avoid results/widgets-dsl/vqa-dataset/combined.json

  # Process only newly rendered widgets
  $0 results/widgets-dsl --widget-list newly-rendered-2025-11-18.txt

  # Generate limited dataset avoiding duplicates
  $0 results/widgets-dsl --avoid existing/combined.json --target-size 1000

Output:
  - referring.json      UI referring VQA pairs (describe elements in bounding boxes)
  - grounding.json      UI grounding VQA pairs (find all instances of components)
  - layout.json         Layout understanding VQA pairs (widget structure)
  - combined.json       Sampled combined dataset (4:3:2 ratio)

Dataset Statistics:
  - ~50 referring pairs per widget (5 elements × 10 templates)
  - ~30 grounding pairs per widget (3 categories × 10 templates)
  - ~80 total pairs per widget
  - For 100 widgets: ~8,000 VQA pairs

EOF
    exit 0
}

# Check for help flag
if [ "$1" = "--help" ] || [ "$1" = "-h" ] || [ $# -lt 1 ]; then
    show_help
fi

# Parse arguments
WIDGET_DIR=""
OUTPUT_DIR=""
TARGET_SIZE=""
AVOID_FILE=""
WIDGET_LIST=""

WIDGET_DIR="$1"
shift

# Parse optional flags
while [ $# -gt 0 ]; do
    case "$1" in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --target-size)
            TARGET_SIZE="$2"
            shift 2
            ;;
        --avoid)
            AVOID_FILE="$2"
            shift 2
            ;;
        --widget-list)
            WIDGET_LIST="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "❌ Error: Unknown option '$1'"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$WIDGET_DIR" ]; then
    echo "❌ Error: Widget directory is required"
    echo "Run '$0 --help' for usage information"
    exit 1
fi

# Resolve to absolute path
WIDGET_DIR=$(cd "$WIDGET_DIR" && pwd)

# Pre-flight checks
echo "🎯 VQA Dataset Generator"
echo "============================"
echo ""

# Check if widget directory exists
if [ ! -d "$WIDGET_DIR" ]; then
    echo "❌ Error: Widget directory not found: $WIDGET_DIR"
    exit 1
fi

# Check if avoid file exists (if specified)
if [ -n "$AVOID_FILE" ] && [ ! -f "$AVOID_FILE" ]; then
    echo "❌ Error: Avoid file not found: $AVOID_FILE"
    exit 1
fi

# Check if widget list exists (if specified)
if [ -n "$WIDGET_LIST" ] && [ ! -f "$WIDGET_LIST" ]; then
    echo "❌ Error: Widget list file not found: $WIDGET_LIST"
    exit 1
fi

# Count widgets with required files
echo "🔍 Scanning widget directory..."
TOTAL_WIDGETS=$(find "$WIDGET_DIR" -maxdepth 1 -type d -name "widget-*" | wc -l)
READY_WIDGETS=0

for widget_dir in "$WIDGET_DIR"/widget-*; do
    if [ -d "$widget_dir" ]; then
        dsl_file="$widget_dir/artifacts/4-dsl/widget.json"
        bbox_file="$widget_dir/artifacts/6-rendering/6.4-bounding-boxes.json"
        image_file="$widget_dir/output.png"

        if [ -f "$dsl_file" ] && [ -f "$bbox_file" ] && [ -f "$image_file" ]; then
            READY_WIDGETS=$((READY_WIDGETS + 1))
        fi
    fi
done

if [ $READY_WIDGETS -eq 0 ]; then
    echo "❌ Error: No widgets ready for VQA generation"
    echo ""
    echo "Each widget needs:"
    echo "  - artifacts/4-dsl/widget.json"
    echo "  - artifacts/6-rendering/6.4-bounding-boxes.json"
    echo "  - output.png"
    echo ""
    echo "Run 'widget-factory batch-render' first to generate required data"
    exit 1
fi

echo "✅ Found $TOTAL_WIDGETS widget directories"
echo "✅ $READY_WIDGETS widgets ready for VQA generation"
echo ""

# Display configuration
echo "Configuration:"
echo "============================"
echo "  Widget Directory:  $WIDGET_DIR"
if [ -n "$OUTPUT_DIR" ]; then
    echo "  Output Directory:  $OUTPUT_DIR"
else
    echo "  Output Directory:  $WIDGET_DIR/vqa-dataset (default)"
fi

if [ -n "$TARGET_SIZE" ]; then
    echo "  Target Size:       $TARGET_SIZE pairs"
else
    echo "  Target Size:       All available data"
fi

if [ -n "$AVOID_FILE" ]; then
    echo "  Avoid Duplicates:  $AVOID_FILE"
    EXISTING_COUNT=$(grep -c '"messages":' "$AVOID_FILE" 2>/dev/null || echo "0")
    echo "                     (${EXISTING_COUNT} existing pairs to avoid)"
fi

if [ -n "$WIDGET_LIST" ]; then
    FILTER_COUNT=$(grep -c "^widget-" "$WIDGET_LIST" 2>/dev/null || echo "0")
    echo "  Widget Filter:     $WIDGET_LIST"
    echo "                     (${FILTER_COUNT} widgets in list)"
fi

ESTIMATED_PAIRS=$((READY_WIDGETS * 80))
echo ""
echo "  Estimated Output:  ~${ESTIMATED_PAIRS} VQA pairs (before sampling)"
echo ""

# Build command
CMD="npx widget-factory batch-generate-vqa \"$WIDGET_DIR\""

if [ -n "$OUTPUT_DIR" ]; then
    CMD="$CMD --output-dir \"$OUTPUT_DIR\""
fi

if [ -n "$TARGET_SIZE" ]; then
    CMD="$CMD --target-size $TARGET_SIZE"
fi

if [ -n "$AVOID_FILE" ]; then
    CMD="$CMD --avoid \"$AVOID_FILE\""
fi

if [ -n "$WIDGET_LIST" ]; then
    CMD="$CMD --widget-list \"$WIDGET_LIST\""
fi

# Run the command
echo "🚀 Starting VQA generation..."
echo ""

eval "$CMD"

# Post-execution summary
echo ""
echo "============================"
echo "✅ VQA Dataset Generation Complete!"
echo "============================"
echo ""

# Determine output directory for summary
SUMMARY_OUTPUT_DIR="${OUTPUT_DIR:-$WIDGET_DIR/vqa-dataset}"

if [ -f "$SUMMARY_OUTPUT_DIR/combined.json" ]; then
    COMBINED_COUNT=$(grep -c '"messages":' "$SUMMARY_OUTPUT_DIR/combined.json" 2>/dev/null || echo "0")
    echo "📊 Dataset Statistics:"
    echo "   Combined dataset:  $COMBINED_COUNT pairs"

    if [ -f "$SUMMARY_OUTPUT_DIR/referring.json" ]; then
        REFERRING_COUNT=$(grep -c '"messages":' "$SUMMARY_OUTPUT_DIR/referring.json" 2>/dev/null || echo "0")
        echo "   Referring:         $REFERRING_COUNT pairs"
    fi

    if [ -f "$SUMMARY_OUTPUT_DIR/grounding.json" ]; then
        GROUNDING_COUNT=$(grep -c '"messages":' "$SUMMARY_OUTPUT_DIR/grounding.json" 2>/dev/null || echo "0")
        echo "   Grounding:         $GROUNDING_COUNT pairs"
    fi

    if [ -f "$SUMMARY_OUTPUT_DIR/layout.json" ]; then
        LAYOUT_COUNT=$(grep -c '"messages":' "$SUMMARY_OUTPUT_DIR/layout.json" 2>/dev/null || echo "0")
        echo "   Layout:            $LAYOUT_COUNT pairs"
    fi

    echo ""
    echo "📁 Output Location:"
    echo "   $SUMMARY_OUTPUT_DIR"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Review the dataset:    ls -lh $SUMMARY_OUTPUT_DIR"
    echo "   2. Check dataset quality: python3 scripts/evaluation/count_vqa_pairs.py $SUMMARY_OUTPUT_DIR/combined.json"
    echo "   3. Split train/test:      (manually split combined.json externally)"
    echo "   4. Use for training:      Copy dataset to your training pipeline"
    echo ""
else
    echo "⚠️  Warning: combined.json not found in output directory"
    echo "   Expected at: $SUMMARY_OUTPUT_DIR/combined.json"
    echo ""
fi
