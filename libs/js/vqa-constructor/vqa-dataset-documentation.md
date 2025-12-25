# VQA Dataset Constructor for UI Understanding

## Overview

This VQA (Visual Question Answering) dataset constructor creates training data for UI understanding tasks, following the methodology from the **UI-UG: Unified MLLM for UI Understanding and Generation** paper.

The constructor produces four types of VQA tasks:
1. **Referring**: Describe a specific region given its bounding box (Box-to-Text)
2. **Grounding**: Locate an element by description and return its bounding box (Text-to-Box)
3. **General Grounding**: Detect all UI elements grouped by component type
4. **Category Grounding**: Find all elements of a specific component type
5. **Layout**: Generate layout code from widget image (Image-to-Code)

## Installation & Setup

### Prerequisites
- Widgets must have been processed through the rendering pipeline
- Required files for each widget:
  - `artifacts/4-dsl/widget.json` - Widget DSL specification
  - `artifacts/6-rendering/6.4-bounding-boxes.json` - Element bounding boxes
  - `output.png` - Rendered widget image
  - `artifacts/5-compilation/layout.jsx` - (Optional) Layout code for layout VQA

### Generate Bounding Boxes

Bounding boxes are generated automatically during the rendering process. Choose the appropriate command based on your input:

**Option 1: Full Pipeline (from Stage 2 mutator output)**

If you have flat JSON files from the mutator stage (e.g., `output/2-mutator/flat/*.json`):

```bash
./scripts/rendering/render-batch-vqa.sh
```

This script:
1. Transforms flat JSON files into widget directory structure
2. Runs batch rendering with bounding box capture
3. Outputs to `output/3-rendering/widgets/`

**Option 2: Direct Batch Render (existing widget directories)**

If your widgets are already in the correct directory structure (`<widget-id>/artifacts/4-dsl/widget.json`):

```bash
./scripts/rendering/render-batch.sh <widget-directory> [concurrency] [--force]

# Or using the CLI directly:
widget-factory batch-render <widget-directory> --force
```

Examples:
```bash
# Process only failed widgets with default concurrency (3)
./scripts/rendering/render-batch.sh ./widgets

# Reprocess ALL widgets with concurrency 5
./scripts/rendering/render-batch.sh ./widgets 5 --force
```

Both options generate bounding boxes at `artifacts/6-rendering/6.4-bounding-boxes.json` for each widget.

## Usage

### Basic Usage

Generate VQA dataset with train/val/test split for all widgets in a directory:

```bash
widget-factory batch-generate-vqa-split <widget-directory>
```

This creates JSON files in `./results/vqa-dataset-v3/` with train/val/test splits.

### Advanced Options

```bash
# Specify custom output directory
widget-factory batch-generate-vqa-split ./widgets --output-dir ./my-vqa-data

# Specify dataset root for relative image paths
widget-factory batch-generate-vqa-split ./widgets --dataset-root ./my-dataset

# Use a specific widget list file
widget-factory batch-generate-vqa-split ./widgets --widget-list ./valid-widgets.txt

# Use a specific random seed for reproducible splits
widget-factory batch-generate-vqa-split ./widgets --seed 42
```

### Output Structure

```
results/vqa-dataset-v3/
├── general_grounding_train.json
├── general_grounding_val.json
├── general_grounding_test.json
├── category_grounding_train.json
├── category_grounding_val.json
├── category_grounding_test.json
├── referring_train.json
├── referring_val.json
├── referring_test.json
├── layout_train.json
├── layout_val.json
├── layout_test.json
├── combined_train.json
├── combined_val.json
└── combined_test.json
```

## Dataset Format

### JSON Format (Qwen3-VL Compatible)

Each file contains a JSON array of VQA conversation pairs:

```json
[
  {
    "messages": [
      {"role": "user", "content": "<image>\nQuestion text here"},
      {"role": "assistant", "content": "Answer text here"}
    ],
    "images": ["widget-0001/output.png"],
    "task": "referring",
    "origin": "widget-0001"
  }
]
```

### Bounding Box Format

Following Qwen3-VL conventions:
- Coordinates normalized to **0-1000 range**
- Format: `[xmin, ymin, xmax, ymax]` (JSON array)
- Coordinates are integers rounded to nearest value

Example:
```json
[100, 50, 300, 150]
```

## Task Types

### 1. Referring Tasks (Box-to-Text)

**Purpose**: Given a bounding box, describe the UI element within it.

**Question Templates** (10 variations, one randomly selected per element):
1. "What is the UI element located at the bounding box {box}?"
2. "Describe the element at {box}."
3. "What can you tell me about the component at bounding box {box}?"
4. "What UI component is shown at the coordinates {box}?"
5. "Identify the element at the bounding box {box}."
6. "What is present in the region defined by {box}?"
7. "Describe what you see at the bounding box {box}."
8. "What type of UI element is at the coordinates {box}?"
9. "Tell me about the component located at {box}."
10. "What is the element at bounding box {box}?"

**Special Text Templates** (for Text components):
1. "What is the text content at the bounding box {box}?"
2. "Read the text located at {box}."
3. "What does the text say at the coordinates {box}?"
4. "Transcribe the text at the bounding box {box}."
5. "What text is shown at {box}?"
6. "Tell me the text content at the bounding box {box}."
7. "What is written at the coordinates {box}?"
8. "Read what's at the bounding box {box}."
9. "What text appears at {box}?"
10. "Describe the text at the bounding box {box}."

**Answer Format** (natural language description):

```
This is a Text element with the text "Hello World". Properties: color: #000000, font size: 18, font weight: 600.
```

For containers:
```
This is a Button element. Properties: background: #007AFF, border radius: 8, padding: 16. Layout: col direction, gap of 8. Contains 2 child elements.
```

**Example**:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "<image>\nWhat is the UI element located at the bounding box [101,78,520,196]?"
    },
    {
      "role": "assistant",
      "content": "This is a Text element with the text \"Cooking Instructions\". Properties: color: #000000, font size: 18, font weight: 400."
    }
  ],
  "images": ["widget-0001/output.png"],
  "task": "referring",
  "origin": "widget-0001"
}
```

### 2. Grounding Tasks (Text-to-Box)

**Purpose**: Given an element description, find and return its bounding box.

**Question Templates** (10 variations, one randomly selected per element):
1. "Please locate the {description} in the image and provide its bounding box in JSON format."
2. "Find the {description} and give me its coordinates as a bounding box."
3. "Where is the {description}? Provide the bounding box."
4. "Locate the {description} and return its position as a bounding box in JSON."
5. "Can you find the {description} and tell me its bounding box coordinates?"
6. "Identify the location of the {description} with a bounding box."
7. "Please provide the bounding box for the {description}."
8. "Show me where the {description} is located by giving its bounding box."
9. "What is the bounding box of the {description}?"
10. "Give me the coordinates of the {description} in bounding box format."

**Answer Format**:

```
Here is the bounding box for the text with text "Hello World":
{"bbox_2d": [101, 78, 520, 196]}
```

**Example**:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "<image>\nPlease locate the button with #007AFF background in the image and provide its bounding box in JSON format."
    },
    {
      "role": "assistant",
      "content": "Here is the bounding box for the button with #007AFF background:\n{\"bbox_2d\": [34, 588, 966, 784]}"
    }
  ],
  "images": ["widget-0001/output.png"],
  "task": "grounding",
  "origin": "widget-0001"
}
```

### 3. General Grounding Tasks

**Purpose**: Detect all UI elements and group them by component type.

**Question Templates** (3 variations, one randomly selected):
1. "Detect all UI elements in this image."
2. "List all the UI components with their types and bounding boxes."
3. "Identify every element in the widget."

**Answer Format**:

```json
{
  "Button": [
    {"bbox_2d": [34, 588, 966, 784]}
  ],
  "Icon": [
    {"bbox_2d": [42, 42, 125, 125]}
  ],
  "Text": [
    {"bbox_2d": [101, 78, 520, 196]},
    {"bbox_2d": [34, 275, 966, 373]}
  ]
}
```

### 4. Category Grounding Tasks

**Purpose**: Find all elements of a specific component type.

**Question Templates** (4 variations, one randomly selected per category):
1. "List all the {category} elements in the image."
2. "Find all {category} components and provide their bounding boxes."
3. "Locate every {category} in this widget."
4. "What are the bounding boxes for all {category} elements?"

**Answer Format**:

```json
{
  "Text": [
    {"bbox_2d": [101, 78, 520, 196]},
    {"bbox_2d": [34, 275, 966, 373]},
    {"bbox_2d": [34, 412, 966, 510]}
  ]
}
```

### 5. Layout Tasks (Image-to-Code)

**Purpose**: Generate layout.jsx code from the widget image.

**Question**: "What is the layout structure of this mobile widget?"

**Answer Format**: The complete layout.jsx code.

## Dataset Statistics

For the combined dataset, the target distribution is:
- **General Grounding**: 60%
- **Category Grounding**: 10%
- **Referring**: 20%
- **Layout**: 10%

The batch generator samples from each task type to achieve this distribution.

### Dataset Split

Default split ratio is **7:1:2** (train:val:test):
- Train: 70%
- Validation: 10%
- Test: 20%

The split is deterministic based on a seed value (default: 42).

## Implementation Details

### Component Selection

**Included**:
- All leaf components (Text, Button, Icon, Image, Chart, etc.)

**Excluded**:
- Container elements (VStack, HStack)
- Null/undefined components

This follows the configuration: "Leaf components only" to focus on actual UI elements.

### Coordinate Normalization

Raw pixel coordinates are normalized to 0-1000 range:

```javascript
normalizedX = Math.round((pixelX / imageWidth) * 1000)
normalizedY = Math.round((pixelY / imageHeight) * 1000)
```

This normalization:
- Makes coordinates resolution-independent
- Follows Qwen3-VL conventions
- Enables better model generalization

### Bounding Box Conversion

Converts from (x, y, width, height) to (xmin, ymin, xmax, ymax):

```javascript
xmin = normalizeCoordinate(x, imageWidth)
ymin = normalizeCoordinate(y, imageHeight)
xmax = normalizeCoordinate(x + width, imageWidth)
ymax = normalizeCoordinate(y + height, imageHeight)
```

### Spatial Ordering

For bounding box sorting, elements are sorted by position:
1. Primary sort: y-coordinate (top to bottom)
2. Secondary sort: x-coordinate (left to right)
3. Tolerance: 5px vertical similarity threshold

This creates a natural reading order that matches human perception.

## Library API

### Generate VQA Programmatically

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

console.log(`Generated ${vqaData.referring.length} referring pairs`);
console.log(`Generated ${vqaData.grounding.length} grounding pairs`);
console.log(`Generated ${vqaData.layout.length} layout pairs`);
```

### Individual Task Generation

```javascript
import {
  generateReferringVQA,
  generateGroundingVQA,
  generateGeneralGroundingVQA,
  generateCategoryGroundingVQA,
  generateLayoutVQA
} from '@widget-factory/vqa-constructor';

// Referring only (box-to-text)
const referring = generateReferringVQA(options);

// Grounding only (text-to-box)
const grounding = generateGroundingVQA(options);

// General grounding (all elements grouped by type)
const generalGrounding = generateGeneralGroundingVQA(options);

// Category grounding (all elements of specific types)
const categoryGrounding = generateCategoryGroundingVQA(options);

// Layout (image-to-code)
const layout = generateLayoutVQA({ layoutCode, imagePath });
```

### Batch Generation with Split

```javascript
import { batchGenerateVQAWithSplit } from '@widget-factory/vqa-constructor';

await batchGenerateVQAWithSplit('./widgets', {
  outputDir: './results/vqa-dataset-v3',
  datasetRoot: './widgets',
  widgetListPath: './valid-widgets.txt', // optional
  seed: 42
});
```

### Utilities

```javascript
import {
  processBoundingBox,
  getReferringQuestions,
  getGroundingQuestions
} from '@widget-factory/vqa-constructor';

// Normalize and format a bbox
const formattedBox = processBoundingBox(
  { x: 100, y: 50, width: 200, height: 100 },
  imageWidth,
  imageHeight
);
// Returns: [209, 245, 629, 735]

// Get question templates
const questions = getReferringQuestions(formattedBox, isText=false);
// Returns: Array of 10 question variations
```

## Troubleshooting

### No widgets found

**Error**: "No widgets found with complete rendering data"

**Solution**: Run batch-render first:
```bash
./scripts/rendering/render-batch.sh <directory> --force
```

### Missing bounding boxes

**Check**: Does `artifacts/6-rendering/6.4-bounding-boxes.json` exist?

**Solution**: Re-run rendering with latest code that includes bbox capture.

### JSON parsing errors

**Check**: Validate DSL and bounding box files:
```bash
jq . artifacts/4-dsl/widget.json
jq . artifacts/6-rendering/6.4-bounding-boxes.json
```

### Image path issues

**Issue**: Image paths don't match your dataset structure

**Solution**: Use `--dataset-root` option:
```bash
widget-factory batch-generate-vqa-split ./widgets \
  --dataset-root ./my-dataset \
  --output-dir ./vqa-output
```

## References

- **Paper**: UI-UG: A Unified MLLM for UI Understanding and Generation
- **Model**: Qwen3-VL (base model format for VQA pairs)
- **Coordinate Format**: 0-1000 normalization (standard in UI understanding)
- **Bounding Box Format**: `[x1, y1, x2, y2]` array (Qwen3-VL convention)

## File Locations

- **Library**: `libs/js/vqa-constructor/`
- **CLI Command**: `libs/js/cli/src/commands/batch-generate-vqa-split.js`
- **Documentation**: `libs/js/vqa-constructor/vqa-dataset-documentation.md`

## License

Part of the Widget Factory project. Private use only.
