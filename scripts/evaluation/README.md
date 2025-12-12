# Widget Evaluation Scripts

Quick shell scripts for running widget quality evaluation.

## Setup

### First Time Setup

Run the setup script to create an isolated environment:

```bash
./tools/evaluation/setup.sh
```

This creates a virtual environment at `tools/evaluation/.venv` with all dependencies. The evaluation script will automatically use this environment.

### Environment Variables

Set `GT_DIR` in `.env` to avoid specifying it every time:

```bash
# .env
GT_DIR=/path/to/ground/truth
```

## Quick Start

### Basic Usage

```bash
./scripts/evaluation/run_evaluation.sh <PRED_DIR> [OUTPUT_DIR]
```

**Example:**
```bash
# Run from project root (uses .env GT_DIR, outputs to PRED_DIR/.analysis)
./scripts/evaluation/run_evaluation.sh results/my-test

# With custom output directory
./scripts/evaluation/run_evaluation.sh results/my-test assets/stats
```

This will:
1. ⚡ Evaluate all GT-prediction pairs (multi-threaded)
2. 💾 Save `evaluation.json` per image and `evaluation.xlsx` summary
3. 📊 Generate statistics to output directory (`.analysis` by default)

## Arguments

### Positional Arguments

1. **PRED_DIR** (required)
   - Directory containing prediction results
   - Supports two structures:
     - Old: `image_0001/output.png`, `image_0002/output.png`, ...
     - New: `0001/pred.png`, `0002/pred.png`, ...

2. **OUTPUT_DIR** (optional)
   - Output directory for statistics (default: `{PRED_DIR}/.analysis`)
   - Will be created automatically if doesn't exist

### Optional Flags

- `-g, --gt_dir PATH`: Ground truth directory path (overrides .env)
- `-w, --workers NUM`: Number of worker threads (default: 8)
- `--skip-eval`: Skip evaluation step (if evaluation.json already exist)
- `--cuda`: Use GPU for LPIPS computation (default: CPU)
- `-h, --help`: Show help message

## Usage Examples

### 1. Basic Usage (CPU)
```bash
./scripts/evaluation/run_evaluation.sh results/my-test
```

### 2. With GPU Acceleration
```bash
./scripts/evaluation/run_evaluation.sh results/my-test --cuda
```

### 3. Custom GT Directory
```bash
./scripts/evaluation/run_evaluation.sh results/my-test -g /path/to/GT
```

### 4. More Workers (Faster)
```bash
./scripts/evaluation/run_evaluation.sh results/my-test -w 16
```

### 5. Statistics Only (Skip Evaluation)
```bash
# If evaluation.json files already exist
./scripts/evaluation/run_evaluation.sh results/my-test --skip-eval
```

### 6. Custom Output Directory
```bash
./scripts/evaluation/run_evaluation.sh results/my-test assets/my-stats
```

## Output Files

After running, the following files will be generated:

### In Prediction Directory:
- `evaluation.xlsx` - Average metrics summary with two-level headers
- `image_*/evaluation.json` or `*/evaluation.json` - Detailed results per image

### In Output Directory (default: `{PRED_DIR}/.analysis`):
- `metrics_stats.json` - Detailed statistics (q1, q2, q3, mean, std, min, max) for all 12 metrics
- `metrics.xlsx` - Metrics summary table

### Example Output Structure

```
results/my-test/
├── 0001/
│   ├── pred.png
│   └── evaluation.json          ← Generated
├── 0002/
│   ├── pred.png
│   └── evaluation.json          ← Generated
├── evaluation.xlsx               ← Generated (avg metrics)
└── .analysis/                    ← Generated (default OUTPUT_DIR)
    ├── metrics_stats.json        ← Detailed statistics
    └── metrics.xlsx              ← Summary table
```

## Metrics

The evaluation computes 12 metrics across 5 categories:

- **Layout** (3): MarginAsymmetry, ContentAspectDiff, AreaRatioDiff
- **Legibility** (3): TextJaccard, ContrastDiff, ContrastLocalDiff
- **Style** (3): PaletteDistance, Vibrancy, PolarityConsistency
- **Perceptual** (2): SSIM, LPIPS
- **Geometry** (1): geo_score

All metrics are transformed to 0-100 scale (higher is better).

## Notes

1. **First Run**: Run without skip flags to get complete results
2. **Re-analysis**: Use `--skip-eval` if evaluation.json files exist to save time
3. **Performance**: Increase `-w` for faster processing on multi-core machines
4. **GPU Usage**: Add `--cuda` flag to use GPU for LPIPS (much faster)
5. **Paths**: Script supports both relative and absolute paths

## Related Documentation

- [Tools Documentation](../../tools/evaluation/README.md) - Detailed metrics documentation
- [Python Entry Point](../../tools/evaluation/main.py) - Main pipeline script
- [Analysis Tool](../../tools/evaluation/analysis.py) - Statistics generation script