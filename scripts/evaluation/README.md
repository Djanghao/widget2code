# Widget Evaluation Scripts

Quick shell scripts for running widget quality evaluation.

## Setup

### First Time Setup

Run the setup script to create an isolated environment:

```bash
./tools/evaluation/setup.sh
```

This creates a virtual environment at `tools/evaluation/.venv` with all dependencies. The evaluation script will automatically use this environment.

## Quick Start

### Basic Usage

```bash
./scripts/evaluation/run_evaluation.sh <PRED_DIR> <OUTPUT_DIR>
```

**Example:**
```bash
# Run from project root
./scripts/evaluation/run_evaluation.sh results/test-1000-qwen3vl-plus-v1.2.0 assets/hard-cases
```

This will:
1. ⚡ Evaluate all GT-prediction pairs (using 8 threads)
2. 📊 Generate `evaluation.xlsx` summary report
3. 🔍 Identify hard cases (bottom 5% per metric)
4. 📝 Generate comprehensive analysis report to `assets/hard-cases/`
5. 🖼️ Copy hard case images (with metric delta annotations)

## Arguments

### Required Arguments

1. **PRED_DIR**
   - Directory containing prediction results
   - Format: `image_0001/output.png`, `image_0002/output.png`, ...

2. **OUTPUT_DIR**
   - Output directory for hard case analysis
   - Will be created automatically if doesn't exist

### Optional Arguments

- `-g, --gt_dir PATH`: Ground truth directory path (default: `/shared/zhixiang_team/widget_research/Comparison/GT`)
- `-w, --workers NUM`: Number of worker threads (default: 8)
- `-k, --top_k NUM`: Hard case percentage threshold (default: 5.0)
- `--skip-eval`: Skip evaluation step (if evaluation.json already exist)
- `--skip-analysis`: Skip analysis step
- `-h, --help`: Show help message

## Usage Examples

### 1. Basic Usage
```bash
./scripts/evaluation/run_evaluation.sh results/test-1000-qwen3vl-plus-v1.2.0 assets/hard-cases
```

### 2. Custom GT Directory
```bash
./scripts/evaluation/run_evaluation.sh results/my-test output/hard-cases -g /path/to/GT
```

### 3. More Workers (Faster)
```bash
./scripts/evaluation/run_evaluation.sh results/my-test output/hard-cases -w 16
```

### 4. Analysis Only (Skip Evaluation)
```bash
# If evaluation.json files already exist
./scripts/evaluation/run_evaluation.sh results/my-test output/hard-cases --skip-eval
```

### 5. Custom Hard Case Threshold
```bash
# Extract top 10% instead of 5%
./scripts/evaluation/run_evaluation.sh results/my-test output/hard-cases -k 10.0
```

## Output Files

After running, the following files will be generated:

### In Prediction Directory:
- `evaluation.xlsx` - Average metrics summary
- `image_*/evaluation.json` - Detailed evaluation results per image

### In Output Directory:
- `hard_cases_analysis_report.md` - Comprehensive analysis report (with metrics documentation)
- `hard_cases_summary.csv` - CSV summary of hard cases
- `metrics_stats.json` - Quartile statistics for all metrics
- `input/` - GT images of hard cases (original names)
- `output/` - Generated images of hard cases (filenames include metric deltas)

### Example Output Structure

```
prediction_dir/
├── image_0001/
│   ├── output.png
│   └── evaluation.json          ← Generated
├── image_0002/
│   ├── output.png
│   └── evaluation.json          ← Generated
└── evaluation.xlsx               ← Generated

output_dir/
├── hard_cases_analysis_report.md
├── hard_cases_summary.csv
├── metrics_stats.json
├── input/
│   ├── image_0001.png
│   └── image_0123.png
└── output/
    ├── image_0001_[ElementCountDiff:-14.3].png
    └── image_0123_[lp:-39.1_total:-22.5].png
```

## Notes

1. **First Run**: Don't use any skip flags to get complete results
2. **Re-analysis**: Use `--skip-eval` if evaluation.json files already exist to save time
3. **Performance**: Increase `-w` parameter for faster processing on multi-core machines
4. **Relative Paths**: Script supports both relative paths (relative to project root) and absolute paths

## Related Documentation

- [Tools Documentation](../../tools/evaluation/README.md) - Detailed metrics documentation
- [Python Entry Point](../../tools/evaluation/main.py) - Main pipeline script
- [Analysis Tool](../../tools/evaluation/analysis.py) - Hard case analysis script
