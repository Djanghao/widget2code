#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 2 ]; then
    echo "Usage: $0 <jsx-file> <output-png> [dev-server-url]"
    echo "Example: $0 widget.jsx widget.png"
    exit 1
fi

JSX_PATH=$1
OUTPUT_PATH=$2
DEV_SERVER=${3:-"http://localhost:$FRONTEND_PORT"}

npx widget-factory render "$JSX_PATH" "$OUTPUT_PATH" "$DEV_SERVER"
