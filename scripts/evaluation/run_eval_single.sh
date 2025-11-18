#!/bin/bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV_DIR="$PROJECT_ROOT/tools/evaluation/.venv"
PYTHON_CMD="python3"

if [ -d "$VENV_DIR" ]; then
  PYTHON_CMD="$VENV_DIR/bin/python"
fi

if [ $# -lt 1 ]; then exit 1; fi

WIDGET_DIR=$1
GT_DIR=${2:-${EVAL_GT_DIR:-/shared/zhixiang_team/widget_research/Comparison/GT}}

if [ ! -d "$WIDGET_DIR" ]; then exit 1; fi
if [ ! -d "$GT_DIR" ]; then exit 0; fi

CMD=("$PYTHON_CMD" "$PROJECT_ROOT/tools/evaluation/eval_single.py" --widget_dir "$WIDGET_DIR")
if [ -n "${GT_DIR:-}" ]; then
  CMD+=(--gt_dir "$GT_DIR")
fi

"${CMD[@]}"
