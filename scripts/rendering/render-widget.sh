#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 2 ]; then
    echo "Usage: $0 <dsl-json-or-jsx-file> <output-png> [dev-server-url]"
    echo "Example: $0 widget.json widget.png"
    echo "Example: $0 widget.jsx widget.png"
    exit 1
fi

INPUT_PATH=$1
OUTPUT_PATH=$2
DEV_SERVER=${3:-"http://localhost:$FRONTEND_PORT"}

# Check if input is a JSON file (DSL) or JSX file
if [[ "$INPUT_PATH" == *.json ]]; then
    # It's a DSL JSON file, need to compile first
    DSL_PATH=$INPUT_PATH
    JSX_PATH="${DSL_PATH%.json}.jsx"

    echo "Compiling DSL to JSX: $DSL_PATH -> $JSX_PATH"
    npx widget-factory compile "$DSL_PATH" "$JSX_PATH"

    echo "Rendering JSX to PNG: $JSX_PATH -> $OUTPUT_PATH"
    npx widget-factory render "$JSX_PATH" "$OUTPUT_PATH" "$DEV_SERVER"
elif [[ "$INPUT_PATH" == *.jsx ]]; then
    # It's already a JSX file, render directly
    JSX_PATH=$INPUT_PATH
    echo "Rendering JSX to PNG: $JSX_PATH -> $OUTPUT_PATH"
    npx widget-factory render "$JSX_PATH" "$OUTPUT_PATH" "$DEV_SERVER"
else
    echo "Error: Input file must be either .json (DSL) or .jsx file"
    exit 1
fi
