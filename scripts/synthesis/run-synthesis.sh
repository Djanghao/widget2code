#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SYNTHESIS_ROOT="$PROJECT_ROOT/libs/js/synthesis"

SETUP_ONLY=false
GENERATE_ONLY=false
POSTPROCESS_ONLY=false
SKIP_OPTIONAL=false
TEST_MODE=false
DOMAINS=""
DEFAULT_LIMIT=2

load_env() {
  local env_file="$PROJECT_ROOT/.env"
  if [ -f "$env_file" ]; then
    echo "Loading environment from .env file..."
    export $(grep -v '^#' "$env_file" | xargs)
  else
    echo "Warning: .env file not found at $env_file"
  fi
}

show_help() {
  cat << EOF
╔═══════════════════════════════════════════════════════════╗
║         SYNTHESIS SYSTEM - MASTER RUNNER                  ║
╚═══════════════════════════════════════════════════════════╝

Description:
  Runs all phases of the widget synthesis system in sequence.

Usage:
  ./run-synthesis.sh [options]

Options:
  --setup-only          Run only Phase 1 (Setup)
  --generate-only       Run only Phase 2 (Batch Generation)
  --postprocess-only    Run only Phase 3 (Post-processing)
  --skip-optional       Skip optional scripts in each phase
  --domains=d1,d2       Limit to specific domains (comma-separated)
  --test                Test mode - verify directory structure and files exist
  --help, -h            Show this help message

Phases:
  Phase 1: Setup - Generate Description Libraries
    - Generate static descriptions (required)
    - Generate dynamic variations (optional)
    - Generate image descriptions (optional)
    - Generate domain prompts (required)

  Phase 2: Batch Widget Generation
    - Run batch-generate-widgets.js with default settings

  Phase 3: Post-processing
    - Prepare widgets for rendering

Examples:
  ./run-synthesis.sh                    # Run all phases, all domains
  ./run-synthesis.sh --setup-only       # Only generate descriptions
  ./run-synthesis.sh --skip-optional    # Skip optional scripts
  ./run-synthesis.sh --generate-only    # Only run batch generation
  ./run-synthesis.sh --domains=health   # Run all phases for health only
  ./run-synthesis.sh --setup-only --domains=health,finance  # Setup for 2 domains
  ./run-synthesis.sh --test             # Test directory structure
EOF
}

run_script() {
  local script_name="$1"
  local script_path="$2"
  shift 2
  local args=("$@")

  echo ""
  echo "======================================================================"
  echo "Running: $script_name"
  echo "Path: $script_path"
  if [ ${#args[@]} -gt 0 ]; then
    echo "Args: ${args[*]}"
  fi
  echo "======================================================================"
  echo ""

  if node "$script_path" "${args[@]}"; then
    echo ""
    echo "✓ Completed: $script_name"
    echo ""
    return 0
  else
    echo ""
    echo "✗ Script exited with error: $script_name"
    echo ""
    return 1
  fi
}

test_directory_structure() {
  echo ""
  echo "██████████████████████████████████████████████████████████████████████"
  echo "TESTING SYNTHESIS DIRECTORY STRUCTURE"
  echo "██████████████████████████████████████████████████████████████████████"
  echo ""

  local all_pass=true

  local directories=(
    "description-generators"
    "batch"
    "postprocess"
    "config"
    "config/runner-configs"
    "data"
    "data/descriptions"
    "data/descriptions/dynamic"
    "data/descriptions/with-images"
    "data/descriptions/image-urls"
  )

  local files=(
    "description-generators/index.js"
    "batch/batch-generate-widgets.js"
    "batch/run-parallel.js"
    "postprocess/prepare-render.js"
    "config/prompt-presets.json"
    "config/runner-config.example.json"
    "package.json"
    "README.md"
  )

  echo "Checking directories:"
  for dir in "${directories[@]}"; do
    if [ -d "$SYNTHESIS_ROOT/$dir" ]; then
      echo "✓ $dir"
    else
      echo "✗ $dir"
      all_pass=false
    fi
  done

  echo ""
  echo "Checking key files:"
  for file in "${files[@]}"; do
    if [ -f "$SYNTHESIS_ROOT/$file" ]; then
      echo "✓ $file"
    else
      echo "✗ $file"
      all_pass=false
    fi
  done

  echo ""
  echo "██████████████████████████████████████████████████████████████████████"
  if [ "$all_pass" = true ]; then
    echo "✓ ALL TESTS PASSED"
    echo "Synthesis system is correctly configured and ready to use."
    echo "██████████████████████████████████████████████████████████████████████"
    echo ""
    return 0
  else
    echo "✗ SOME TESTS FAILED"
    echo "Please check the output above for missing files or directories."
    echo "██████████████████████████████████████████████████████████████████████"
    echo ""
    return 1
  fi
}

run_phase_setup() {
  echo ""
  echo "██████████████████████████████████████████████████████████████████████"
  echo "PHASE: Setup - Generate Description Libraries"
  echo "██████████████████████████████████████████████████████████████████████"
  echo ""

  local args=()
  [ -n "$DOMAINS" ] && args+=("--domains=$DOMAINS")

  run_script \
    "Generate Static Descriptions" \
    "$SYNTHESIS_ROOT/description-generators/generate-descriptions.js" \
    "${args[@]}"

  if [ "$SKIP_OPTIONAL" = false ]; then
    run_script \
      "Generate Dynamic Variations" \
      "$SYNTHESIS_ROOT/description-generators/generate-dynamic-variations.js" \
      "${args[@]}" || echo "⚠ Optional script failed: Generate Dynamic Variations"

    run_script \
      "Generate Image Descriptions" \
      "$SYNTHESIS_ROOT/description-generators/generate-image-descriptions.js" \
      || echo "⚠ Optional script failed: Generate Image Descriptions"
  else
    echo "⊘ Skipping optional: Generate Dynamic Variations"
    echo "⊘ Skipping optional: Generate Image Descriptions"
  fi

  run_script \
    "Generate Domain Prompts" \
    "$SYNTHESIS_ROOT/description-generators/generate-domain-prompts.js" \
    "${args[@]}"

  echo ""
  echo "✓ Phase complete: Setup - Generate Description Libraries"
  echo ""
}

run_phase_generate() {
  echo ""
  echo "██████████████████████████████████████████████████████████████████████"
  echo "PHASE: Batch Widget Generation"
  echo "██████████████████████████████████████████████████████████████████████"
  echo ""

  local args=("--limit=$DEFAULT_LIMIT")
  [ -n "$DOMAINS" ] && args+=("--domains=$DOMAINS")
  [ -n "$BACKEND_PORT" ] && args+=("--port=$BACKEND_PORT")

  run_script \
    "Batch Generate Widgets" \
    "$SYNTHESIS_ROOT/batch/batch-generate-widgets.js" \
    "${args[@]}"

  echo ""
  echo "✓ Phase complete: Batch Widget Generation"
  echo ""
}

run_phase_postprocess() {
  echo ""
  echo "██████████████████████████████████████████████████████████████████████"
  echo "PHASE: Post-processing - Prepare for Rendering"
  echo "██████████████████████████████████████████████████████████████████████"
  echo ""

  run_script \
    "Prepare Batch Render" \
    "$SYNTHESIS_ROOT/postprocess/prepare-render.js"

  echo ""
  echo "✓ Phase complete: Post-processing - Prepare for Rendering"
  echo ""
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --setup-only)
        SETUP_ONLY=true
        shift
        ;;
      --generate-only)
        GENERATE_ONLY=true
        shift
        ;;
      --postprocess-only)
        POSTPROCESS_ONLY=true
        shift
        ;;
      --skip-optional)
        SKIP_OPTIONAL=true
        shift
        ;;
      --domains=*)
        DOMAINS="${1#*=}"
        shift
        ;;
      --test)
        TEST_MODE=true
        shift
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
    esac
  done
}

main() {
  parse_args "$@"

  load_env

  local start_time=$(date +%s)

  if [ "$TEST_MODE" = true ]; then
    test_directory_structure
    exit $?
  fi

  if [ "$SETUP_ONLY" = true ]; then
    run_phase_setup
  elif [ "$GENERATE_ONLY" = true ]; then
    run_phase_generate
  elif [ "$POSTPROCESS_ONLY" = true ]; then
    run_phase_postprocess
  else
    run_phase_setup
    run_phase_generate
    run_phase_postprocess
  fi

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  echo ""
  echo "██████████████████████████████████████████████████████████████████████"
  echo "✓ ALL PHASES COMPLETED SUCCESSFULLY"
  echo "Total duration: ${duration}s"
  echo "██████████████████████████████████████████████████████████████████████"
  echo ""
}

main "$@"
