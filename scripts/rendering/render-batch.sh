#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <directory> [concurrency]"
    echo "Examples:"
    echo "  $0 ./widgets         # Process with default concurrency (3)"
    echo "  $0 ./widgets 5       # Process with concurrency 5"
    exit 1
fi

DIRECTORY=$1
CONCURRENCY=${2:-3}

npx widget-factory batch-render "$DIRECTORY" "$CONCURRENCY"
