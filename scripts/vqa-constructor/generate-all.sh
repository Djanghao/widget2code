#!/bin/bash
#
# Generate VQA Dataset from Widget Directory
#
# This script generates Visual Question Answering datasets for all widgets
# in a directory with train/val/test split.
#
# Simple usage: ./generate-all.sh <widget-directory>
# Advanced usage: ./generate-all.sh <widget-directory> [options]
#

set -e

show_help() {
    cat << EOF
VQA Dataset Generator - Generate All Widgets

Usage: $0 <widget-directory> [options]

Arguments:
  widget-directory    Directory containing widget subdirectories with:
                      - artifacts/4-dsl/widget.json (DSL specification)
                      - artifacts/6-rendering/6.4-bounding-boxes.json (Bounding boxes)
                      - output.png (Rendered image)

Options:
  --output-dir PATH       Custom output directory (default: ./results/vqa-dataset-v3)
  --widget-list FILE      Process only widgets listed in file (one ID per line)
  --seed NUMBER           Random seed for reproducible splits (default: 42)
  --help, -h              Show this help message

Examples:
  $0 results/widgets-dsl
  $0 results/widgets-dsl --output-dir ./my-vqa-dataset
  $0 results/widgets-dsl --widget-list newly-rendered.txt --seed 123

Output (with train/val/test split 7:1:2):
  - general_grounding_{train,val,test}.json   (60%)
  - category_grounding_{train,val,test}.json  (10%)
  - referring_{train,val,test}.json           (20%)
  - layout_{train,val,test}.json              (10%)
  - combined_{train,val,test}.json            (sampled)

EOF
    exit 0
}

if [ "$1" = "--help" ] || [ "$1" = "-h" ] || [ $# -lt 1 ]; then
    show_help
fi

WIDGET_DIR=""
OUTPUT_DIR=""
WIDGET_LIST=""
SEED="42"

WIDGET_DIR="$1"
shift

while [ $# -gt 0 ]; do
    case "$1" in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --widget-list)
            WIDGET_LIST="$2"
            shift 2
            ;;
        --seed)
            SEED="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "Error: Unknown option '$1'"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

if [ -z "$WIDGET_DIR" ]; then
    echo "Error: Widget directory is required"
    echo "Run '$0 --help' for usage information"
    exit 1
fi

WIDGET_DIR=$(cd "$WIDGET_DIR" && pwd)

echo "VQA Dataset Generator"
echo "============================"
echo ""

if [ ! -d "$WIDGET_DIR" ]; then
    echo "Error: Widget directory not found: $WIDGET_DIR"
    exit 1
fi

if [ -n "$WIDGET_LIST" ] && [ ! -f "$WIDGET_LIST" ]; then
    echo "Error: Widget list file not found: $WIDGET_LIST"
    exit 1
fi

echo "Scanning widget directory..."
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
    echo "Error: No widgets ready for VQA generation"
    echo ""
    echo "Each widget needs:"
    echo "  - artifacts/4-dsl/widget.json"
    echo "  - artifacts/6-rendering/6.4-bounding-boxes.json"
    echo "  - output.png"
    echo ""
    echo "Run 'widget-factory batch-render' first to generate required data"
    exit 1
fi

echo "Found $TOTAL_WIDGETS widget directories"
echo "$READY_WIDGETS widgets ready for VQA generation"
echo ""

echo "Configuration:"
echo "============================"
echo "  Widget Directory:  $WIDGET_DIR"
if [ -n "$OUTPUT_DIR" ]; then
    echo "  Output Directory:  $OUTPUT_DIR"
else
    echo "  Output Directory:  ./results/vqa-dataset-v3 (default)"
fi
echo "  Random Seed:       $SEED"

if [ -n "$WIDGET_LIST" ]; then
    FILTER_COUNT=$(grep -c "^widget-" "$WIDGET_LIST" 2>/dev/null || echo "0")
    echo "  Widget Filter:     $WIDGET_LIST"
    echo "                     (${FILTER_COUNT} widgets in list)"
fi
echo ""

CMD="npx widget-factory batch-generate-vqa-split \"$WIDGET_DIR\""
CMD="$CMD --dataset-root \"$WIDGET_DIR\""
CMD="$CMD --seed $SEED"

if [ -n "$OUTPUT_DIR" ]; then
    CMD="$CMD --output-dir \"$OUTPUT_DIR\""
fi

if [ -n "$WIDGET_LIST" ]; then
    CMD="$CMD --widget-list \"$WIDGET_LIST\""
fi

echo "Starting VQA generation..."
echo ""

eval "$CMD"

echo ""
echo "============================"
echo "VQA Dataset Generation Complete!"
echo "============================"
echo ""
