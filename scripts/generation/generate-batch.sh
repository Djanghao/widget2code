#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input-dir> <output-dir> [concurrency]"
    echo "Example: $0 ./images ./generated 5"
    exit 1
fi

INPUT_DIR=$1
OUTPUT_DIR=$2
CONCURRENCY=${3:-3}

cd libs/generator
source ../../apps/api/.venv/bin/activate

python batch_generate.py "$INPUT_DIR" "$OUTPUT_DIR" "$CONCURRENCY"
