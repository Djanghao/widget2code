#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <widget-directory>"
    echo ""
    echo "Description:"
    echo "  Render a single widget from its directory."
    echo "  The widget directory must contain a DSL file at artifacts/4-dsl/widget.json"
    echo ""
    echo "Examples:"
    echo "  $0 ./results/tmp/image_0001"
    echo "  $0 ./widgets/my-widget"
    echo ""
    echo "Output:"
    echo "  - artifacts/5-compilation/widget.jsx"
    echo "  - artifacts/6-rendering/6.1-raw.png"
    echo "  - artifacts/6-rendering/6.2-autoresize.png"
    echo "  - artifacts/6-rendering/6.3-resize.png"
    echo "  - output.png (final output)"
    exit 1
fi

WIDGET_DIR=$1
DEV_SERVER="http://localhost:$FRONTEND_PORT"

# Validate that widget directory exists
if [ ! -d "$WIDGET_DIR" ]; then
    echo "Error: Widget directory does not exist: $WIDGET_DIR"
    exit 1
fi

# Validate that DSL file exists
DSL_FILE="$WIDGET_DIR/artifacts/4-dsl/widget.json"
if [ ! -f "$DSL_FILE" ]; then
    echo "Error: DSL file not found: $DSL_FILE"
    echo ""
    echo "The widget directory must contain a generated DSL file from the generation pipeline."
    echo "Please run generate-widget first to create the DSL."
    exit 1
fi

echo "Rendering widget: $WIDGET_DIR"
echo "Dev Server: $DEV_SERVER"
echo ""

npx widget-factory render "$WIDGET_DIR"
