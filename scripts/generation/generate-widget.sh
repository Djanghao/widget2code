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

cd libs/generator
source ../../apps/api/.venv/bin/activate

python -c "
from widgetdsl_generator import generate_widget_full
import json
import asyncio

result = asyncio.run(generate_widget_full('$IMAGE_PATH'))
with open('$OUTPUT_PATH', 'w') as f:
    json.dump(result, f, indent=2)
print('Widget generated successfully!')
"
