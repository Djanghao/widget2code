# @widget-factory/vqa-constructor

VQA (Visual Question Answering) dataset constructor for UI understanding tasks.

Following the methodology from **UI-UG: Unified MLLM for UI Understanding and Generation**.

## Features

- **Referring (Box-to-Text)**: Describe elements within bounding boxes
- **Grounding (Text-to-Box)**: Locate elements by description
- **General Grounding**: Detect all UI elements grouped by type
- **Category Grounding**: Find all elements of a specific type
- **Layout (Image-to-Code)**: Generate layout.jsx from images
- **Qwen3-VL Format**: Compatible message format
- **Normalized Coordinates**: 0-1000 range
- **Train/Val/Test Split**: 7:1:2 ratio (70%/10%/20%)
- **Task Distribution**: 60% general, 10% category, 20% referring, 10% layout

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
  --widget-list ./valid-widgets.txt \
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
  imagePath: 'widget-0001/output.png',
  layoutCode: '...' // optional
});

console.log(vqaData.referring);  // Box-to-text VQA pairs
console.log(vqaData.grounding);  // Text-to-box VQA pairs
console.log(vqaData.layout);     // Image-to-code VQA pairs
console.log(vqaData.combined);   // All VQA pairs
```

## Output Format

JSON files with Qwen3-VL compatible format:

```json
[
  {
    "messages": [
      {"role": "user", "content": "<image>\nWhat is the UI element at [101,78,520,196]?"},
      {"role": "assistant", "content": "This is a Text element with the text \"Hello\"."}
    ],
    "images": ["widget-0001/output.png"],
    "task": "referring",
    "origin": "widget-0001"
  }
]
```

### Bounding Box Format

Coordinates normalized to 0-1000 range as JSON array:
```json
[xmin, ymin, xmax, ymax]
```

## Output Files

```
results/vqa-dataset-v3/
├── general_grounding_{train,val,test}.json
├── category_grounding_{train,val,test}.json
├── referring_{train,val,test}.json
├── layout_{train,val,test}.json
└── combined_{train,val,test}.json
```

## Documentation

See [VQA Dataset Documentation](./vqa-dataset-documentation.md) for complete details.

## License

Private - Part of Widget Factory project
