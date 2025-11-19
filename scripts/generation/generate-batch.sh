#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Unset deprecated TRANSFORMERS_CACHE to avoid warnings
unset TRANSFORMERS_CACHE

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input-dir> <output-dir> [concurrency] [--force]"
    echo "Example: $0 ./images ./generated 5"
    echo "Example: $0 ./images ./generated 5 --force"
    echo ""
    echo "Options:"
    echo "  --force    Force reprocess all images, even if already generated"
    exit 1
fi

INPUT_DIR=$1
OUTPUT_DIR=$2
FORCE_FLAG=""

# Validate input directory exists
if [ ! -d "$INPUT_DIR" ]; then
    echo "Error: Input directory not found: $INPUT_DIR"
    exit 1
fi

# Parse remaining arguments for concurrency and --force flag
shift 2  # Remove first two arguments (input and output dirs)
while [ $# -gt 0 ]; do
    case "$1" in
        --force)
            FORCE_FLAG="--force"
            echo "🔄 Force reprocessing enabled - will regenerate all images"
            shift
            ;;
        *)
            # Assume it's concurrency if it's a number
            if [[ "$1" =~ ^[0-9]+$ ]]; then
                CONCURRENCY=$1
                echo "📊 Using concurrency from command line: $CONCURRENCY"
            fi
            shift
            ;;
    esac
done

# Check concurrency: command line > .env > error
if [ -z "$CONCURRENCY" ]; then
    if [ -n "${CONCURRENCY:-}" ]; then
        echo "📊 Using concurrency from .env: $CONCURRENCY"
    else
        echo "❌ ERROR: CONCURRENCY not specified"
        echo ""
        echo "Please either:"
        echo "  1. Set CONCURRENCY in .env file"
        echo "  2. Or provide as third argument: $0 <input-dir> <output-dir> <concurrency>"
        echo ""
        echo "Example: $0 ./images ./output 200"
        echo "Example: $0 ./images ./output 200 --force"
        exit 1
    fi
fi

# Check if ENABLE_MODEL_CACHE is true
if [ "${ENABLE_MODEL_CACHE}" = "true" ]; then
    echo "=================================================="
    echo "🔍 Checking backend service availability..."
    echo "=================================================="

    BACKEND_PORT=${BACKEND_PORT:-8010}
    BACKEND_HOST=${HOST:-0.0.0.0}

    # Convert 0.0.0.0 to localhost for curl
    if [ "$BACKEND_HOST" = "0.0.0.0" ]; then
        BACKEND_HOST="localhost"
    fi

    BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}/health"

    # Check if backend is running
    if ! curl -f -s -o /dev/null --connect-timeout 3 "$BACKEND_URL"; then
        echo ""
        echo "❌ ERROR: Backend service is NOT running!"
        echo ""
        echo "ENABLE_MODEL_CACHE=true requires backend service for icon retrieval."
        echo "Backend should be running at: $BACKEND_URL"
        echo ""
        echo "Solutions:"
        echo "  1. Start backend service:"
        echo "     cd apps/api"
        echo "     source .venv/bin/activate"
        echo "     python3 -m app.main"
        echo ""
        echo "  2. OR disable model cache in .env:"
        echo "     ENABLE_MODEL_CACHE=false"
        echo "     (Warning: This will load BLIP2 6.7B model, very slow and memory-intensive)"
        echo ""
        echo "=================================================="
        exit 1
    fi

    echo "✅ Backend service is running at $BACKEND_URL"
    echo "=================================================="
    echo ""
fi

source apps/api/.venv/bin/activate

generate-widget-batch "$INPUT_DIR" "$OUTPUT_DIR" --concurrency "$CONCURRENCY" $FORCE_FLAG
