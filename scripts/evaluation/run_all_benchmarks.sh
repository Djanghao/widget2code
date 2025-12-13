#!/bin/bash
# Run evaluation for all benchmark datasets
# Usage: ./scripts/evaluation/run_all_benchmarks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVAL_SCRIPT="$SCRIPT_DIR/run_evaluation.sh"

# Check if evaluation script exists
if [ ! -f "$EVAL_SCRIPT" ]; then
    echo "Error: Evaluation script not found: $EVAL_SCRIPT"
    exit 1
fi

echo "========================================"
echo "Running evaluation for all benchmarks"
echo "========================================"
echo ""

# List of all benchmark datasets
DATASETS=(
    "data/benchmarks/DCGen-Extracted-Widget"
    "data/benchmarks/Design2Code-Extracted-Widget"
    "data/benchmarks/Doubao_size"
    "data/benchmarks/GPT_size"
    "data/benchmarks/Gemini_size"
    "data/benchmarks/LatCoder-Extracted-Widget"
    "data/benchmarks/Pix2Code-Pytorch"
    "data/benchmarks/Qwen3VL_235b_size"
    "data/benchmarks/Screencoder"
    "data/benchmarks/UICopilot"
    "data/benchmarks/UIUG"
    "data/benchmarks/WebSight-VLM-8B"
    "data/benchmarks/Widget2Code"
)

# Counter for progress
TOTAL=${#DATASETS[@]}
CURRENT=0

# Run evaluation for each dataset
for DATASET in "${DATASETS[@]}"; do
    CURRENT=$((CURRENT + 1))

    echo ""
    echo "========================================"
    echo "[$CURRENT/$TOTAL] Processing: $DATASET"
    echo "========================================"
    echo ""

    # Check if dataset directory exists
    if [ ! -d "$DATASET" ]; then
        echo "⚠️  Warning: Directory not found, skipping: $DATASET"
        continue
    fi

    # Run evaluation
    OUTPUT_DIR="$DATASET/.analysis"

    if "$EVAL_SCRIPT" "$DATASET" "$OUTPUT_DIR" --cuda -w 10; then
        echo "✅ Completed: $DATASET"
    else
        echo "❌ Failed: $DATASET"
        echo "   Continuing with next dataset..."
    fi
done

echo ""
echo "========================================"
echo "All benchmarks completed!"
echo "========================================"
echo ""
echo "Results are saved in each dataset's .analysis directory:"
for DATASET in "${DATASETS[@]}"; do
    if [ -d "$DATASET/.analysis" ]; then
        echo "  ✓ $DATASET/.analysis"
    fi
done
