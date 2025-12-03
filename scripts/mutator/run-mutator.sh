#!/bin/bash

echo "🎯 Starting DSL Mutator with preset configuration..."
echo "📋 Configuration:"
echo "   - Count: auto (matching seed DSL count)"
echo "   - All themes enabled (5 theme variants)"
echo "   - Mode: controlled (theme transformations only)"
echo ""

node libs/js/mutator/generate-dsl-diversity.js \
  --match-seeds \
  --all-themes \
  --mode controlled

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo ""
  echo "✅ Mutator completed successfully!"
else
  echo ""
  echo "❌ Mutator failed with exit code $exit_code"
  exit $exit_code
fi
