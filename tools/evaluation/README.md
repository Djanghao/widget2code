# Widget Quality Evaluation Toolkit

This directory contains tools for evaluating and analyzing widget generation quality.

## Installation

### Quick Setup (Recommended)

Run the setup script to create an isolated virtual environment:

```bash
./tools/evaluation/setup.sh
```

This will:
1. Create a virtual environment at `tools/evaluation/.venv`
2. Install all Python dependencies
3. Check for system dependencies

The evaluation script will automatically use this environment when running.

### Manual Installation

If you prefer to install in your current environment:

```bash
pip install -r tools/evaluation/requirements.txt
```

### System Dependencies

**Tesseract OCR** (required for text metrics):

- **Ubuntu/Debian**:
  ```bash
  sudo apt-get install tesseract-ocr
  ```

- **macOS**:
  ```bash
  brew install tesseract
  ```

- **Alternative**: If you don't need text metrics, you can comment out `pytesseract` import in `widget_quality/legibility.py`

## Directory Structure

```
tools/evaluation/
├── README.md                    # This file
├── main.py                      # Main entry point: integrated evaluation pipeline
├── analysis.py                  # Statistics generation and reporting
├── eval.py                      # Multi-threaded evaluation script
├── widget_quality/              # Core evaluation metrics library
│   ├── composite.py            # Composite scoring
│   ├── geometry.py             # Geometry metrics
│   ├── layout.py               # Layout metrics
│   ├── legibility.py           # Legibility metrics
│   ├── perceptual.py           # Perceptual metrics (SSIM, LPIPS)
│   ├── style.py                # Style metrics
│   └── utils.py                # Utility functions
├── utils/                       # Utility scripts
│   ├── bbx_extraction.py       # Bounding box extraction
│   └── comparison.py           # Single image pair comparison
├── examples/                    # Example usage scripts
│   ├── example.py              # Basic example
│   └── example_loop.py         # Loop evaluation example
└── archived/                    # Old/deprecated scripts
    ├── loop_OneByOne.py        # Legacy evaluation script
    ├── loop_metrics.py         # Old metrics loop
    ├── loo_only.py             # Leave-one-out test
    └── filter_hard.py          # Deprecated hard case filter
```

## Quick Start

### 1. Run Complete Evaluation Pipeline

Evaluate generated widgets against ground truth and generate statistics:

```bash
python main.py \
  --gt_dir /path/to/GT \
  --pred_dir /path/to/results \
  --output_dir /path/to/output \
  --workers 8
```

**Arguments:**
- `--gt_dir`: Path to ground truth directory (required)
- `--pred_dir`: Path to prediction directory (required)
- `--output_dir`: Output directory for statistics (default: `{pred_dir}/.analysis`)
- `--workers`: Number of worker threads (default: 4)
- `--skip_eval`: Skip evaluation step (assumes evaluation.json files already exist)
- `--cuda`: Use GPU for LPIPS computation (default: CPU)

**Expected Directory Structure:**
```
GT/
  gt_0001.png
  gt_0002.png
  ...

results/
  image_0001/output.png  (old structure)
  OR
  0001/pred.png          (new structure)
  ...
```

### 2. Run Evaluation Only

Compute quality metrics for all GT-prediction pairs:

```bash
# Evaluate all images (default: CPU)
python eval.py \
  --gt_dir /path/to/GT \
  --baseline_dir /path/to/results \
  --workers 8

# Use GPU for faster computation
python eval.py \
  --gt_dir /path/to/GT \
  --baseline_dir /path/to/results \
  --workers 8 \
  --cuda
```

**Output:**
- Individual `evaluation.json` files in each `image_*/` folder
- Summary `evaluation.xlsx` in the prediction directory

### 3. Run Analysis Only

Generate statistics from existing evaluation results:

```bash
python analysis.py \
  --results-dir /path/to/results \
  --output-dir /path/to/output
```

**Output:**
- `metrics_stats.json`: Detailed statistics with quartiles (q1, q2, q3), mean, std, min, max for all metrics
- `metrics.xlsx`: Metrics summary table with two-level headers

## Metrics

The toolkit evaluates 12 metrics across 5 categories:

### Layout Metrics (3 metrics)
- **MarginAsymmetry**: Margin asymmetry degree
- **ContentAspectDiff**: Content aspect ratio difference
- **AreaRatioDiff**: Element area distribution difference

### Legibility Metrics (3 metrics)
- **TextJaccard**: Text content similarity (Jaccard index)
- **ContrastDiff**: Global contrast difference
- **ContrastLocalDiff**: Local contrast difference

### Perceptual Metrics (2 metrics)
- **SSIM**: Structural similarity index
- **LPIPS**: Learned perceptual image patch similarity

### Style Metrics (3 metrics)
- **PaletteDistance**: Color palette distance
- **Vibrancy**: Color vibrancy consistency
- **PolarityConsistency**: Brightness polarity consistency

### Geometry Metrics (1 metric)
- **geo_score**: Aspect ratio and dimensionality fidelity

## Development

To modify or extend the evaluation metrics, edit the files in `widget_quality/`:
- Add new metrics in the appropriate category module
- Update `composite.py` to include new metrics in scoring
- Update `METRIC_CATEGORIES` in `analysis.py` for statistics generation

## Notes

- All scripts support multi-threaded parallel processing for efficiency
- Evaluation results are cached in `evaluation.json` files to avoid recomputation
- The toolkit uses exponential decay functions to convert raw metric differences to 0-100 scores
- Higher scores are better for all metrics
