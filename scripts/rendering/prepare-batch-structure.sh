#!/bin/bash
set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <source-directory> <output-directory>"
    echo ""
    echo "Description:"
    echo "  Transforms a flat directory of widget JSON files into the required"
    echo "  folder structure for batch rendering."
    echo ""
    echo "Arguments:"
    echo "  source-directory   Directory containing flat widget JSON files"
    echo "  output-directory   Directory where structured folders will be created"
    echo ""
    echo "Example:"
    echo "  $0 ./flat-widgets ./widgets"
    echo ""
    echo "Input structure:"
    echo "  flat-widgets/"
    echo "  ├── widget-001.json"
    echo "  ├── widget-002.json"
    echo "  └── widget-003.json"
    echo ""
    echo "Output structure:"
    echo "  widgets/"
    echo "  ├── widget-001/"
    echo "  │   └── artifacts/"
    echo "  │       └── 4-dsl/"
    echo "  │           └── widget.json"
    echo "  ├── widget-002/"
    echo "  │   └── artifacts/"
    echo "  │       └── 4-dsl/"
    echo "  │           └── widget.json"
    echo "  └── widget-003/"
    echo "      └── artifacts/"
    echo "          └── 4-dsl/"
    echo "              └── widget.json"
    exit 1
fi

SOURCE_DIR=$1
OUTPUT_DIR=$2

if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory '$SOURCE_DIR' does not exist"
    exit 1
fi

if [ ! -d "$OUTPUT_DIR" ]; then
    echo "Creating output directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
fi

echo "Transforming widget JSONs from flat to structured format..."
echo "Source: $SOURCE_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

count=0
for json_file in "$SOURCE_DIR"/*.json; do
    if [ ! -f "$json_file" ]; then
        echo "No JSON files found in $SOURCE_DIR"
        exit 1
    fi

    filename=$(basename "$json_file")
    widget_id="${filename%.json}"

    target_dir="$OUTPUT_DIR/$widget_id/artifacts/4-dsl"
    target_file="$target_dir/widget.json"
    log_dir="$OUTPUT_DIR/$widget_id/log"

    mkdir -p "$target_dir"
    mkdir -p "$log_dir"

    cp "$json_file" "$target_file"

    echo "✓ $widget_id"
    count=$((count + 1))
done

echo ""
echo "=========================================="
echo "Complete!"
echo "=========================================="
echo "Processed: $count widget(s)"
echo ""
echo "You can now run batch rendering:"
echo "  ./scripts/rendering/render-batch.sh $OUTPUT_DIR"
