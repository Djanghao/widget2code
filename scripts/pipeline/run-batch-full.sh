#!/bin/bash
set -e

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input-dir> <output-dir> [concurrency] [dev-server-url]"
    echo "Example: $0 ./images ./output 5"
    exit 1
fi

INPUT_DIR=$1
OUTPUT_DIR=$2
CONCURRENCY=${3:-3}
DEV_SERVER=${4:-"http://localhost:$FRONTEND_PORT"}

mkdir -p "$OUTPUT_DIR"

LOG_FILE="$OUTPUT_DIR/run.log"
METADATA_FILE="$OUTPUT_DIR/run_info.json"
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_TIMESTAMP=$(date +%s)

exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "===== Full Batch Pipeline ====="
echo "Start Time: $START_TIME"
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "Concurrency: $CONCURRENCY"
echo "Dev Server: $DEV_SERVER"
echo "Log File: $LOG_FILE"
echo ""

RUN_ID=$(uuidgen 2>/dev/null || date +%s%N)

echo "Step 1/2: Generate WidgetDSL from images..."
./scripts/generation/generate-batch.sh "$INPUT_DIR" "$OUTPUT_DIR" "$CONCURRENCY"

echo ""
echo "Step 2/2: Batch render DSL to PNG..."
./scripts/rendering/render-batch.sh "$OUTPUT_DIR" "$CONCURRENCY"

END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
END_TIMESTAMP=$(date +%s)
DURATION=$((END_TIMESTAMP - START_TIMESTAMP))

cat > "$METADATA_FILE" <<EOF
{
  "run_id": "$RUN_ID",
  "start_time": "$START_TIME",
  "end_time": "$END_TIME",
  "duration_seconds": $DURATION,
  "status": "completed",
  "input_dir": "$INPUT_DIR",
  "output_dir": "$OUTPUT_DIR",
  "concurrency": $CONCURRENCY,
  "dev_server": "$DEV_SERVER",
  "environment": {
    "backend_port": "${BACKEND_PORT:-8010}",
    "frontend_port": "${FRONTEND_PORT:-3060}",
    "enable_model_cache": "${ENABLE_MODEL_CACHE:-false}",
    "use_cuda_for_retrieval": "${USE_CUDA_FOR_RETRIEVAL:-true}",
    "default_model": "${DEFAULT_MODEL:-qwen3-vl-flash}"
  }
}
EOF

echo ""
echo "===== Complete ====="
echo "End Time: $END_TIME"
echo "Duration: ${DURATION}s"
echo "Output: $OUTPUT_DIR"
echo "Log: $LOG_FILE"
echo "Metadata: $METADATA_FILE"
echo ""
echo "Each widget has its own subdirectory with:"
echo "  - widget_id_original.{ext}: Original image"
echo "  - widget_id.json: Generated DSL"
echo "  - widget_id.jsx: Compiled JSX"
echo "  - widget_id.png: Rendered PNG (autoresize)"
echo "  - widget_id_raw.png: RAW render (natural layout)"
echo "  - widget_id_autoresize.png: AUTORESIZE render"
echo "  - widget_id_rescaled.png: RESCALED to original size"
echo "  - log.json: Complete pipeline metadata"
