# @widget-factory/vqa-constructor

VQA (Visual Question Answering) dataset constructor for UI understanding tasks.

Following the methodology from **UI-UG: Unified MLLM for UI Understanding and Generation** (arXiv:2509.24361).

## Features

- UI Referring: Describe elements within bounding boxes
- UI Grounding: Find all instances of component types
- 10 Question Templates per task for diversity
- Normalized Coordinates: 0-1000 range following UI-UG conventions
- Spatial Ordering: Reading order (top-to-bottom, left-to-right)
- JSON Structured Answers: Easy parsing and validation
- Train/Val/Test Split: 7:1:2 ratio

## Installation

```bash
npm install
```

## Usage

### CLI Command

```bash
widget-factory batch-generate-vqa-split <widget-directory>

widget-factory batch-generate-vqa-split ./widgets \
  --output-dir ./vqa-data \
  --dataset-root ./my-dataset \
  --seed 42
```

### Programmatic API

```javascript
import { generateAllVQA } from '@widget-factory/vqa-constructor';

const vqaData = generateAllVQA({
  boundingBoxData: { scale: 2, elements: {...} },
  dsl: { widget: {...} },
  imageWidth: 477,
  imageHeight: 204,
  imagePath: 'widget-0001/output.png'
});

console.log(vqaData.referring);  // UI referring VQA pairs
console.log(vqaData.grounding);  // UI grounding VQA pairs
console.log(vqaData.combined);   // All VQA pairs
```

## Output Format

JSONL files with conversation pairs:

```json
{
  "image": "widget-0001/output.png",
  "conversations": [
    {"from": "human", "value": "Describe the region <box_start>(101,78),(520,196)<box_end>."},
    {"from": "gpt", "value": "{\"type\":\"leaf\",\"component\":\"Text\",\"properties\":{...}}"}
  ]
}
```

## Dataset Statistics

For a widget with 5 leaf components:
- **Referring**: 50 VQA pairs (5 elements × 10 templates)
- **Grounding**: 30 VQA pairs (3 categories × 10 templates)
- **Total**: 80 VQA pairs per widget

For 100 widgets: **~8,000 VQA pairs**

## Documentation

See [VQA Dataset Documentation](../../../.artifacts/vqa-dataset-documentation.md) for complete details.

## License

Private - Part of Widget Factory project
