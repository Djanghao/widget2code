#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <output> [concurrency] [dev-server-url]"
    echo "Example: $0 ./widgets ./output 5"
    exit 1
fi

INPUT=$1
OUTPUT=$2
CONCURRENCY=${3:-3}
DEV_SERVER=${4:-"http://localhost:$FRONTEND_PORT"}

npx widget-factory batch-render "$INPUT" "$OUTPUT" "$CONCURRENCY"
