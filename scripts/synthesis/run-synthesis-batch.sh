#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

LIMIT=10

echo "Stage 1: Synthesis"
echo "  Limit: $LIMIT descriptions per domain"
echo ""

echo "[1/2] Running synthesis batch generation..."
cd "$PROJECT_ROOT/libs/js/synthesis"
node batch/batch-generate-widgets.js --limit=$LIMIT

echo ""
echo "[2/2] Running prepare-render..."
node postprocess/prepare-render.js

echo ""
echo "Stage 1 complete"
