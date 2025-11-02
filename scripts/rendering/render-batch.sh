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
    echo "Usage: $0 <directory> [concurrency] [--force]"
    echo "Examples:"
    echo "  $0 ./widgets              # Process failed widgets only with default concurrency (3)"
    echo "  $0 ./widgets 5            # Process failed widgets with concurrency 5"
    echo "  $0 ./widgets 5 --force    # Reprocess ALL widgets with concurrency 5"
    echo "  $0 ./widgets --force      # Reprocess ALL widgets with default concurrency"
    exit 1
fi

DIRECTORY=$1
CONCURRENCY=3
FORCE_FLAG=""

# Parse arguments
shift  # Remove directory argument
for arg in "$@"; do
    if [ "$arg" = "--force" ]; then
        FORCE_FLAG="--force"
    elif [[ "$arg" =~ ^[0-9]+$ ]]; then
        CONCURRENCY=$arg
    fi
done

npx widget-factory batch-render "$DIRECTORY" --concurrency "$CONCURRENCY" $FORCE_FLAG
