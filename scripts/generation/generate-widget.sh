#!/bin/bash
set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <image-path> <output-dsl-path>"
    echo "Example: $0 input.png output.json"
    exit 1
fi

IMAGE_PATH=$1
OUTPUT_PATH=$2

echo "Generating widget from image: $IMAGE_PATH"
echo "Output will be saved to: $OUTPUT_PATH"

source apps/api/.venv/bin/activate

generate-widget "$IMAGE_PATH" "$OUTPUT_PATH"
