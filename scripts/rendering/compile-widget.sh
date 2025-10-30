#!/bin/bash
set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <dsl-json> <output-jsx>"
    echo "Example: $0 widget.json widget.jsx"
    exit 1
fi

DSL_PATH=$1
OUTPUT_PATH=$2

echo "Compiling WidgetDSL to JSX..."
echo "Input: $DSL_PATH"
echo "Output: $OUTPUT_PATH"

npx widget-factory compile "$DSL_PATH" "$OUTPUT_PATH"

echo "Compilation complete!"
