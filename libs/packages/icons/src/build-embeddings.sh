#!/bin/bash

# Build embeddings for all react-icons libraries
# Usage: ./build-embeddings.sh [library_name...]
# If no library names are provided, processes all libraries

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONS_DIR="$(dirname "$SCRIPT_DIR")"
EMBEDDINGS_DIR="$ICONS_DIR/embeddings"
BUILD_SCRIPT="$SCRIPT_DIR/build_library.py"

# react-icons SVG source directory
SVG_ROOT="/home/houston/workspace/widget-research/react-icons/react-icons-svgs"

ICON_LIBRARIES=(
  "ai" "bi" "bs" "cg" "ci" "di" "fa" "fa6" "fc" "fi" "gi" "go" "gr"
  "hi" "hi2" "im" "io" "io5" "lia" "lu" "md" "pi" "ri" "rx" "si"
  "sl" "tb" "tfi" "ti" "vsc" "wi"
)

# If arguments provided, use those instead of all libraries
if [ $# -gt 0 ]; then
  ICON_LIBRARIES=("$@")
fi

echo "=================================="
echo "Building Icon Library Embeddings"
echo "=================================="
echo ""

mkdir -p "$EMBEDDINGS_DIR"

total=${#ICON_LIBRARIES[@]}
current=0

for lib in "${ICON_LIBRARIES[@]}"; do
  current=$((current + 1))
  echo "[$current/$total] Processing $lib..."

  svg_dir="$SVG_ROOT/$lib"
  output_dir="$EMBEDDINGS_DIR/$lib"

  if [ ! -d "$svg_dir" ]; then
    echo "  ✗ Error: SVG directory not found: $svg_dir"
    continue
  fi

  if [ -d "$output_dir" ]; then
    echo "  Skipping $lib (already exists)"
    continue
  fi

  python "$BUILD_SCRIPT" "$svg_dir" "$output_dir"

  if [ $? -eq 0 ]; then
    echo "  ✓ Completed $lib"
  else
    echo "  ✗ Failed to build $lib"
  fi
  echo ""
done

echo "=================================="
echo "All embeddings generated!"
echo "Output directory: $EMBEDDINGS_DIR"
echo "=================================="
