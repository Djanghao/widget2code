#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/output/pipeline-logs"
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
LOG_FILE="$LOG_DIR/run-$TIMESTAMP.log"

# Create log directory BEFORE redirect
mkdir -p "$LOG_DIR"

# Now set up logging
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Track execution times
PIPELINE_START_TIME=$(date +%s)
declare -A STAGE_TIMES

echo "=========================================="
echo "Synthetic Dataset Orchestration Pipeline"
echo "=========================================="
echo ""
echo "Run ID: $TIMESTAMP"
echo "Log: $LOG_FILE"
echo ""

FROM_STAGE=1
TO_STAGE=4
SKIP_STAGES=""
QUICK_TEST=false

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

Note:
  Configuration is managed within each stage's script in scripts/<domain>/
  To adjust parameters (limits, counts, concurrency), edit the respective run-*.sh files

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
  echo "INFO: QUICK TEST MODE"
  echo "  - Synthesis: 5 widgets"
  echo "  - Mutator: 5 base DSLs (x5 themes = 25 total)"
  echo "  - Concurrency: 3"
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
  STAGE_START_TIME=$(date +%s)
  echo ""
  echo "=========================================="
  echo "STAGE $1: $2"
  echo "=========================================="
  echo "Started: $(date)"
  echo ""
}

log_stage_complete() {
  local stage_num=$1
  STAGE_END_TIME=$(date +%s)
  STAGE_DURATION=$((STAGE_END_TIME - STAGE_START_TIME))
  STAGE_TIMES[$stage_num]=$STAGE_DURATION
  
  echo ""
  echo "SUCCESS: Stage $stage_num completed successfully (${STAGE_DURATION}s)"
  echo "Finished: $(date)"
  echo ""
}

log_stage_skipped() {
  echo ""
  echo "INFO: Stage $1: $2 - SKIPPED"
  echo ""
}

if should_run_stage 1; then
  log_stage 1 "Synthesis"

  if [ "$QUICK_TEST" = true ]; then
    bash "$PROJECT_ROOT/scripts/synthesis/run-synthesis-batch-test.sh"
  else
    bash "$SCRIPT_DIR/stages/1-run-synthesis.sh"
  fi

  log_stage_complete 1
else
  log_stage_skipped 1 "Synthesis"
fi

if should_run_stage 2; then
  log_stage 2 "Mutator"

  if [ "$QUICK_TEST" = true ]; then
    bash "$PROJECT_ROOT/scripts/mutator/run-mutator-test.sh"
  else
    bash "$SCRIPT_DIR/stages/2-run-mutator.sh"
  fi

  log_stage_complete 2
else
  log_stage_skipped 2 "Mutator"
fi

if should_run_stage 3; then
  log_stage 3 "Rendering"

  if [ "$QUICK_TEST" = true ]; then
    bash "$PROJECT_ROOT/scripts/rendering/render-batch-vqa-test.sh"
  else
    bash "$SCRIPT_DIR/stages/3-run-rendering.sh"
  fi

  log_stage_complete 3
else
  log_stage_skipped 3 "Rendering"
fi

if should_run_stage 4; then
  log_stage 4 "VQA Generation"

  if [ "$QUICK_TEST" = true ]; then
    bash "$PROJECT_ROOT/scripts/vqa-constructor/run-vqa-test.sh"
  else
    bash "$SCRIPT_DIR/stages/4-run-vqa.sh"
  fi

  log_stage_complete 4
else
  log_stage_skipped 4 "VQA Generation"
fi


# Calculate total execution time
PIPELINE_END_TIME=$(date +%s)
TOTAL_DURATION=$((PIPELINE_END_TIME - PIPELINE_START_TIME))

echo ""
echo "=========================================="
echo "Pipeline Execution Complete"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Run ID: $TIMESTAMP"
echo "  Log: $LOG_FILE"
echo ""

# Show timing information
echo "Execution Times:"
if should_run_stage 1 && [ ! -z "${STAGE_TIMES[1]}" ]; then
  echo "  Stage 1 (Synthesis):  ${STAGE_TIMES[1]}s"
fi
if should_run_stage 2 && [ ! -z "${STAGE_TIMES[2]}" ]; then
  echo "  Stage 2 (Mutator):    ${STAGE_TIMES[2]}s"
fi
if should_run_stage 3 && [ ! -z "${STAGE_TIMES[3]}" ]; then
  echo "  Stage 3 (Rendering):  ${STAGE_TIMES[3]}s"
fi
if should_run_stage 4 && [ ! -z "${STAGE_TIMES[4]}" ]; then
  echo "  Stage 4 (VQA):        ${STAGE_TIMES[4]}s"
fi
echo "  ---"
echo "  Total:                ${TOTAL_DURATION}s ($((TOTAL_DURATION / 60))m $((TOTAL_DURATION % 60))s)"
echo ""

echo "Output Structure:"
if should_run_stage 1; then
  echo "  Stage 1: output/1-synthesis/render-ready/"
fi
if should_run_stage 2; then
  echo "  Stage 2: output/2-mutator/flat/"
fi
if should_run_stage 3; then
  echo "  Stage 3: output/3-rendering/widgets/"
fi
if should_run_stage 4; then
  echo "  Stage 4: output/4-vqa/"
fi
echo ""
echo "Next Steps:"
echo "  - Review logs: cat $LOG_FILE"
echo "  - Check outputs: ls -lh output/*/"
echo ""
