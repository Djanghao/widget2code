#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/output/pipeline-logs"
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
LOG_FILE="$LOG_DIR/run-$TIMESTAMP.log"

exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "=========================================="
echo "Synthetic Dataset Orchestration Pipeline"
echo "=========================================="
echo ""
echo "Run ID: $TIMESTAMP"
echo "Log: $LOG_FILE"
echo ""

mkdir -p "$LOG_DIR"

FROM_STAGE=1
TO_STAGE=4
SKIP_STAGES=""
QUICK_TEST=false
SYNTHESIS_LIMIT=10
MUTATOR_COUNT=100
CONCURRENCY=3

print_help() {
  cat <<EOF

Synthetic Dataset Orchestration Pipeline - Master Script

Usage: $0 [options]

Pipeline Stages:
  1. Synthesis    - Generate widget DSL from descriptions
  2. Mutator      - Create DSL variations from synthesis + examples
  3. Rendering    - Compile DSL to JSX and render to PNG with bboxes
  4. VQA          - Generate VQA dataset from rendered widgets

Options:
  --from-stage=N       Start from stage N (1-4, default: 1)
  --to-stage=N         Stop at stage N (1-4, default: 4)
  --stage=N            Run only stage N
  --skip-stage=N       Skip stage N (can be used multiple times)
  --quick-test         Quick test mode (5 synthesis, 5 mutator widgets)
  --help, -h           Show this help message

Examples:
  # Quick test with 5 widgets
  $0 --quick-test

  # Run all stages (full production)
  $0

  # Run only synthesis and mutator
  $0 --from-stage=1 --to-stage=2

  # Run only stage 3 (rendering)
  $0 --stage=3

  # Skip synthesis, run mutator through VQA
  $0 --from-stage=2

  # Run all except rendering
  $0 --skip-stage=3

Directory Structure:
  output/
  ├── 1-synthesis/
  │   ├── batch-generated/     # Raw synthesis output
  │   └── render-ready/         # After prepare-render.js
  ├── 2-mutator/
  │   ├── seeds/                # Combined: synthesis + 76 examples
  │   ├── batch-generated/      # Raw mutator output
  │   └── flat/                 # After extract-batch-widgets.js
  ├── 3-rendering/
  │   └── widgets/              # Rendered widgets with artifacts
  ├── 4-vqa/                    # VQA dataset
  └── pipeline-logs/            # Execution logs

EOF
}

for arg in "$@"; do
  case $arg in
    --from-stage=*)
      FROM_STAGE="${arg#*=}"
      ;;
    --to-stage=*)
      TO_STAGE="${arg#*=}"
      ;;
    --stage=*)
      FROM_STAGE="${arg#*=}"
      TO_STAGE="${arg#*=}"
      ;;
    --skip-stage=*)
      SKIP_STAGES="$SKIP_STAGES ${arg#*=}"
      ;;
    --quick-test)
      QUICK_TEST=true
      SYNTHESIS_LIMIT=5
      MUTATOR_COUNT=5
      ;;
    --help|-h)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      print_help
      exit 1
      ;;
  esac
done

if [ "$QUICK_TEST" = true ]; then
  echo "⚡ QUICK TEST MODE"
  echo "  - Synthesis: $SYNTHESIS_LIMIT widgets"
  echo "  - Mutator: $MUTATOR_COUNT base DSLs (×5 themes = $((MUTATOR_COUNT * 5)) total)"
  echo "  - Concurrency: $CONCURRENCY"
  echo ""
fi

should_run_stage() {
  local stage=$1

  if [ $stage -lt $FROM_STAGE ] || [ $stage -gt $TO_STAGE ]; then
    return 1
  fi

  for skip in $SKIP_STAGES; do
    if [ "$skip" == "$stage" ]; then
      return 1
    fi
  done

  return 0
}

log_stage() {
  echo ""
  echo "=========================================="
  echo "STAGE $1: $2"
  echo "=========================================="
  echo "Started: $(date)"
  echo ""
}

log_stage_complete() {
  echo ""
  echo "✓ Stage $1 completed successfully"
  echo "Finished: $(date)"
  echo ""
}

log_stage_skipped() {
  echo ""
  echo "⊘ Stage $1: $2 - SKIPPED"
  echo ""
}

if should_run_stage 1; then
  log_stage 1 "Synthesis"

  bash "$SCRIPT_DIR/stages/1-run-synthesis.sh" $SYNTHESIS_LIMIT

  log_stage_complete 1
else
  log_stage_skipped 1 "Synthesis"
fi

if should_run_stage 2; then
  log_stage 2 "Mutator"

  bash "$SCRIPT_DIR/stages/2-run-mutator.sh" $MUTATOR_COUNT

  log_stage_complete 2
else
  log_stage_skipped 2 "Mutator"
fi

if should_run_stage 3; then
  log_stage 3 "Rendering"

  bash "$SCRIPT_DIR/stages/3-run-rendering.sh" $CONCURRENCY

  log_stage_complete 3
else
  log_stage_skipped 3 "Rendering"
fi

if should_run_stage 4; then
  log_stage 4 "VQA Generation"

  bash "$SCRIPT_DIR/stages/4-run-vqa.sh" "$PROJECT_ROOT/output/4-vqa"

  log_stage_complete 4
else
  log_stage_skipped 4 "VQA Generation"
fi

echo ""
echo "=========================================="
echo "Pipeline Execution Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Run ID: $TIMESTAMP"
echo "  Log: $LOG_FILE"
echo ""
echo "Output Structure:"
if should_run_stage 1; then
  echo "  ✓ Stage 1: output/1-synthesis/render-ready/"
fi
if should_run_stage 2; then
  echo "  ✓ Stage 2: output/2-mutator/flat/"
fi
if should_run_stage 3; then
  echo "  ✓ Stage 3: output/3-rendering/widgets/"
fi
if should_run_stage 4; then
  echo "  ✓ Stage 4: output/4-vqa/"
fi
echo ""
echo "Next Steps:"
echo "  - Review logs: cat $LOG_FILE"
echo "  - Check outputs: ls -lh output/*/"
echo ""
