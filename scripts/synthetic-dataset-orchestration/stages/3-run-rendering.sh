#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

CONCURRENCY=${1:-3}

echo "Stage 3: Rendering"
echo "  Concurrency: $CONCURRENCY"
echo ""

echo "[1/2] Preparing batch structure..."
bash "$PROJECT_ROOT/scripts/rendering/prepare-batch-structure.sh" \
  "$PROJECT_ROOT/output/2-mutator/flat" \
  "$PROJECT_ROOT/output/3-rendering/widgets"

echo ""
echo "[2/2] Running batch render..."
cd "$PROJECT_ROOT"
widget-factory batch-render "$PROJECT_ROOT/output/3-rendering/widgets" --concurrency $CONCURRENCY

echo ""
echo "Stage 3 complete"
