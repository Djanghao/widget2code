#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <input> [output] [concurrency] [dev-server-url]"
    echo "Examples:"
    echo "  $0 ./widgets              # In-place processing"
    echo "  $0 ./widgets 5            # In-place with concurrency"
    echo "  $0 ./source ./target      # Copy to new directory"
    echo "  $0 ./source ./target 5    # Copy with concurrency"
    exit 1
fi

INPUT=$1

if [ $# -eq 1 ]; then
    npx widget-factory batch-render "$INPUT"
elif [ $# -eq 2 ]; then
    if [[ $2 =~ ^[0-9]+$ ]]; then
        npx widget-factory batch-render "$INPUT" "$2"
    else
        npx widget-factory batch-render "$INPUT" "$2"
    fi
elif [ $# -eq 3 ]; then
    if [[ $2 =~ ^[0-9]+$ ]]; then
        npx widget-factory batch-render "$INPUT" "$2"
    else
        npx widget-factory batch-render "$INPUT" "$2" "$3"
    fi
else
    npx widget-factory batch-render "$INPUT" "$2" "$3"
fi
