#!/bin/bash

# Script to push code to widget2code repository
# This script creates a clean orphan branch with only one "initial commit"
# and pushes to both main and gh-pages branches

set -e

WIDGET2CODE_REPO="https://github.com/Djanghao/widget2code.git"
TEMP_BRANCH="temp-widget2code-release"
EXCLUDE_PATH="scripts/release"

echo "🚀 Starting push to widget2code..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Add widget2code remote if it doesn't exist
if ! git remote get-url widget2code &> /dev/null; then
    echo "📌 Adding widget2code remote..."
    git remote add widget2code "$WIDGET2CODE_REPO"
fi

# Create orphan branch (no history)
echo "🌱 Creating orphan branch..."
git checkout --orphan "$TEMP_BRANCH"

# Remove the release scripts from staging
echo "🗑️  Excluding release scripts..."
git reset HEAD "$EXCLUDE_PATH" 2>/dev/null || true
git rm -rf --cached "$EXCLUDE_PATH" 2>/dev/null || true

# Add all files except the excluded path
echo "📦 Staging files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "initial commit"

# Push to main branch (force push to overwrite history)
echo "⬆️  Pushing to main branch..."
git push -f widget2code "$TEMP_BRANCH:main"

# Push to gh-pages branch (force push to overwrite history)
echo "⬆️  Pushing to gh-pages branch..."
git push -f widget2code "$TEMP_BRANCH:gh-pages"

# Return to original branch
echo "🔙 Returning to main branch..."
git checkout main

# Delete temporary branch
echo "🧹 Cleaning up temporary branch..."
git branch -D "$TEMP_BRANCH"

echo "✅ Successfully pushed to widget2code!"
echo "   - main: single 'initial commit'"
echo "   - gh-pages: single 'initial commit'"
echo "   - Excluded: $EXCLUDE_PATH"
