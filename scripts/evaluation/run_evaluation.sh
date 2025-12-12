#!/bin/bash
# Widget Quality Evaluation Script
# Simple interface for running widget evaluation and statistics generation

set -e  # Exit on error

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVAL_TOOL="$PROJECT_ROOT/tools/evaluation/main.py"
VENV_DIR="$PROJECT_ROOT/tools/evaluation/.venv"

# Load .env if present
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# Default values
WORKERS=8
USE_CUDA=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print usage
usage() {
    cat << EOF
${BLUE}Widget Quality Evaluation Script${NC}

Usage: $0 <PRED_DIR> [OUTPUT_DIR] [OPTIONS]

${YELLOW}Arguments:${NC}
  PRED_DIR              Path to prediction/results directory (required)
  OUTPUT_DIR            Path to output directory for statistics (optional, default: PRED_DIR/.analysis)

${YELLOW}Options:${NC}
  -g, --gt_dir PATH     Path to ground truth directory
                        (default: GT_DIR from .env, required if not set)
  -w, --workers NUM     Number of worker threads (default: $WORKERS)
  --skip-eval           Skip evaluation step (assumes evaluation.json already exist)
  --cuda                Use CUDA/GPU for computation (default: CPU)
  -h, --help            Show this help message

${YELLOW}Examples:${NC}
  # Basic usage (CPU, output to results/my-test/.analysis)
  $0 results/my-test

  # Specify custom output directory
  $0 results/my-test assets/stats-my-test

  # With custom GT directory
  $0 results/my-test -g /path/to/GT

  # Use GPU for faster processing
  $0 results/my-test --cuda

  # Use more workers for faster processing
  $0 results/my-test -w 16

  # Only generate statistics (skip evaluation)
  $0 results/my-test --skip-eval

${YELLOW}Output Files:${NC}
  PRED_DIR/image_*/evaluation.json    - Individual evaluation results
  PRED_DIR/evaluation.xlsx            - Average metrics summary (from evaluation)
  OUTPUT_DIR/metrics_stats.json       - Detailed statistics with quartiles
  OUTPUT_DIR/metrics.xlsx             - Metrics summary table

EOF
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Parse positional arguments
PRED_DIR=""
OUTPUT_DIR=""
GT_DIR_FROM_ENV="${GT_DIR:-}"
GT_DIR_FROM_CMD=""
SKIP_EVAL=false

# Get first two positional arguments
if [ $# -ge 1 ] && [[ ! "$1" =~ ^- ]]; then
    PRED_DIR="$1"
    shift
fi

if [ $# -ge 1 ] && [[ ! "$1" =~ ^- ]]; then
    OUTPUT_DIR="$1"
    shift
fi

# Parse optional arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--gt_dir)
            GT_DIR_FROM_CMD="$2"
            shift 2
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        --skip-eval)
            SKIP_EVAL=true
            shift
            ;;
        --cuda)
            USE_CUDA=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Set GT_DIR: command line > .env > error
GT_DIR="${GT_DIR_FROM_CMD:-${GT_DIR_FROM_ENV}}"

if [ -z "$GT_DIR" ]; then
    echo -e "${RED}Error: Ground truth directory not specified${NC}"
    echo -e "${YELLOW}Please either:${NC}"
    echo -e "  1. Set GT_DIR in .env file"
    echo -e "  2. Or provide via -g flag: $0 <PRED_DIR> -g /path/to/GT"
    echo ""
    usage
    exit 1
fi

# Validate required arguments
if [ -z "$PRED_DIR" ]; then
    echo -e "${RED}Error: PRED_DIR (prediction directory) is required${NC}"
    echo ""
    usage
    exit 1
fi

# Default OUTPUT_DIR to PRED_DIR/.analysis if not provided
if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="${PRED_DIR}/.analysis"
    echo -e "${YELLOW}ℹ  OUTPUT_DIR not specified, using default: $OUTPUT_DIR${NC}"
fi

# Convert to absolute paths and normalize
if [[ ! "$PRED_DIR" = /* ]]; then
    PRED_DIR="$PROJECT_ROOT/$PRED_DIR"
fi
PRED_DIR="$(realpath -m "$PRED_DIR")"

if [[ ! "$OUTPUT_DIR" = /* ]]; then
    OUTPUT_DIR="$PROJECT_ROOT/$OUTPUT_DIR"
fi
OUTPUT_DIR="$(realpath -m "$OUTPUT_DIR")"

if [[ ! "$GT_DIR" = /* ]]; then
    GT_DIR="$PROJECT_ROOT/$GT_DIR"
fi
GT_DIR="$(realpath -m "$GT_DIR")"

# Validate directories exist
if [ ! -d "$GT_DIR" ]; then
    echo -e "${RED}Error: GT directory does not exist: $GT_DIR${NC}"
    exit 1
fi

if [ ! -d "$PRED_DIR" ]; then
    echo -e "${RED}Error: Prediction directory does not exist: $PRED_DIR${NC}"
    exit 1
fi

# Check and activate virtual environment if it exists
PYTHON_CMD="python"
if [ -d "$VENV_DIR" ]; then
    echo -e "${GREEN}Using virtual environment: $VENV_DIR${NC}"
    PYTHON_CMD="$VENV_DIR/bin/python"
else
    echo -e "${YELLOW}⚠ Virtual environment not found at: $VENV_DIR${NC}"
    echo -e "${YELLOW}  Run 'tools/evaluation/setup.sh' to create it${NC}"
    echo -e "${YELLOW}  Continuing with system Python...${NC}"
    echo ""
fi

# Print GT_DIR source
GT_DIR_SOURCE=""
if [ -n "$GT_DIR_FROM_CMD" ]; then
    GT_DIR_SOURCE="(from -g flag)"
elif [ -n "$GT_DIR_FROM_ENV" ]; then
    GT_DIR_SOURCE="(from .env)"
fi

# Print configuration
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Widget Quality Evaluation${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}GT Directory:${NC}     $GT_DIR $GT_DIR_SOURCE"
echo -e "${GREEN}Prediction Dir:${NC}   $PRED_DIR"
echo -e "${GREEN}Output Dir:${NC}       $OUTPUT_DIR"
echo -e "${GREEN}Workers:${NC}          $WORKERS"
echo -e "${GREEN}CUDA:${NC}             $(if [ "$USE_CUDA" = true ]; then echo "Enabled"; else echo "Disabled (CPU)"; fi)"
if [ "$SKIP_EVAL" = true ]; then
    echo -e "${YELLOW}⏩ Skipping evaluation step${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""

# Build command
CMD="\"$PYTHON_CMD\" \"$EVAL_TOOL\" --gt_dir \"$GT_DIR\" --pred_dir \"$PRED_DIR\" --output_dir \"$OUTPUT_DIR\" --workers $WORKERS"

if [ "$SKIP_EVAL" = true ]; then
    CMD="$CMD --skip_eval"
fi

if [ "$USE_CUDA" = true ]; then
    CMD="$CMD --cuda"
fi

# Run command
echo -e "${GREEN}Running evaluation...${NC}"
echo ""
eval $CMD

# Success message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Evaluation completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Results saved to:${NC} $OUTPUT_DIR"
echo ""
