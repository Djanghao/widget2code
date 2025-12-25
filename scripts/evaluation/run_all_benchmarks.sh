#!/bin/bash
# Run evaluation for all benchmark datasets
# Usage: ./scripts/evaluation/run_all_benchmarks.sh [OPTIONS]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVAL_SCRIPT="$SCRIPT_DIR/run_evaluation.sh"

# Default values
GT_DIR=""
WORKERS=10
USE_CUDA=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--gt_dir)
            GT_DIR="$2"
            shift 2
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        --cuda)
            USE_CUDA=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -g, --gt_dir PATH     Path to ground truth directory (optional, uses .env GT_DIR if not set)"
            echo "  -w, --workers NUM     Number of worker threads (default: 10)"
            echo "  --cuda                Use CUDA/GPU for computation (default: CPU)"
            echo "  -h, --help            Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 -g ./data/widget2code-benchmark/test --cuda -w 16"
            exit 0
            ;;
        *)
            echo "Error: Unknown option $1"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

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
    "data/benchmarks/DCGen"
    "data/benchmarks/Design2Code"
    "data/benchmarks/Gemini2.5-Pro"
    "data/benchmarks/GPT-4o"
    "data/benchmarks/LatCoder"
    "data/benchmarks/Qwen3-VL"
    "data/benchmarks/Qwen3-VL-235b"
    "data/benchmarks/ScreenCoder"
    "data/benchmarks/Seed1.6-Thinking"
    "data/benchmarks/UI-UG"
    "data/benchmarks/UICopilot"
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

    # Build command with optional parameters
    EVAL_CMD="$EVAL_SCRIPT $DATASET $OUTPUT_DIR"

    if [ -n "$GT_DIR" ]; then
        EVAL_CMD="$EVAL_CMD -g $GT_DIR"
    fi

    EVAL_CMD="$EVAL_CMD -w $WORKERS"

    if [ "$USE_CUDA" = true ]; then
        EVAL_CMD="$EVAL_CMD --cuda"
    fi

    if eval "$EVAL_CMD"; then
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
