# Synthetic Dataset Orchestration

Automated 4-stage pipeline that generates synthetic widget datasets: from text descriptions to rendered images with VQA annotations.

## Quick Start

Test run (5 widgets, ~5 minutes):
```bash
./scripts/synthetic-dataset-orchestration/run-master-pipeline.sh --quick-test
```

Full production run:
```bash
./scripts/synthetic-dataset-orchestration/run-master-pipeline.sh
```

## Pipeline Stages

```
Descriptions → [1. Synthesis] → DSL → [2. Mutator] → Variations → [3. Rendering] → Images → [4. VQA] → Dataset
```

### 1. Synthesis
Generate widget DSL from text descriptions using LLM
- Input: `libs/js/synthesis/data/descriptions/`
- Output: `output/1-synthesis/render-ready/`

### 2. Mutator
Create themed variations from synthesis output + 76 examples
- Input: Stage 1 output + `apps/playground/src/examples/`
- Output: `output/2-mutator/flat/`
- Produces ~500 widget variations (100 base × 5 themes)

### 3. Rendering
Compile DSL to JSX and render PNG with bounding boxes
- Input: `output/2-mutator/flat/`
- Output: `output/3-rendering/widgets/{id}/`
  - `output.png`
  - `artifacts/4-dsl/widget.json`
  - `artifacts/6-rendering/6.4-bounding-boxes.json`

### 4. VQA
Generate Visual Question Answering dataset with train/val/test split (7:1:2)
- Input: `output/3-rendering/widgets/`
- Output: `output/4-vqa/`
  - `combined_{train,val,test}.json` - All tasks combined (60% general, 10% category, 20% referring, 10% layout)
  - `general_grounding_{train,val,test}.json` - Detect all UI elements by type
  - `category_grounding_{train,val,test}.json` - Find elements of specific types
  - `referring_{train,val,test}.json` - Describe element at bounding box (box→text)
  - `layout_{train,val,test}.json` - Generate layout code (image→code)

## Usage Options

Run specific stages:
```bash
./run-master-pipeline.sh --stage=3              # Only rendering
./run-master-pipeline.sh --from-stage=2         # Skip synthesis
./run-master-pipeline.sh --to-stage=2           # Stop after mutator
./run-master-pipeline.sh --skip-stage=3         # Skip rendering
```

Help:
```bash
./run-master-pipeline.sh --help
```

## Output Structure

```
output/
├── 1-synthesis/render-ready/          # Stage 1: DSL from descriptions
├── 2-mutator/flat/                    # Stage 2: Theme variations
├── 3-rendering/widgets/{id}/          # Stage 3: PNG + bboxes + artifacts
├── 4-vqa/                             # Stage 4: VQA dataset
│   ├── combined_{train,val,test}.json
│   ├── general_grounding_{train,val,test}.json
│   ├── category_grounding_{train,val,test}.json
│   ├── referring_{train,val,test}.json
│   └── layout_{train,val,test}.json
└── pipeline-logs/run-{timestamp}.log  # Execution logs
```

## Troubleshooting

View logs:
```bash
cat output/pipeline-logs/run-*.log
```