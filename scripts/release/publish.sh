#!/bin/bash

# Script to push code to widget2code repository
# This script squashes local main and gh-pages branches into single commits
# and pushes them to widget2code remote (does not affect origin)

set -e

WIDGET2CODE_REPO="https://github.com/Djanghao/widget2code.git"
TEMP_MAIN_BRANCH="temp-widget2code-main"
TEMP_PAGES_BRANCH="temp-widget2code-pages"
EXCLUDE_PATH="scripts/release"

echo "🚀 Starting push to widget2code..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Add widget2code remote if it doesn't exist
if ! git remote get-url widget2code &> /dev/null; then
    echo "📌 Adding widget2code remote..."
    git remote add widget2code "$WIDGET2CODE_REPO"
fi

# Function to process a branch
process_branch() {
    local source_branch=$1
    local temp_branch=$2
    local target_branch=$3

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Processing $source_branch → widget2code/$target_branch"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if source branch exists
    if ! git show-ref --verify --quiet "refs/heads/$source_branch"; then
        echo "⚠️  Branch $source_branch does not exist, skipping..."
        return
    fi

    # Checkout source branch
    echo "📂 Checking out $source_branch..."
    git checkout -q "$source_branch"

    # Create orphan branch (no history)
    echo "🌱 Creating orphan branch $temp_branch..."
    git checkout --orphan "$temp_branch" 2>&1 | grep -v "^Switched to" || true

    # Clear staging area completely
    echo "📦 Staging files (excluding $EXCLUDE_PATH)..."
    git rm -rf --cached . > /dev/null 2>&1 || true
    git add . -- ":!$EXCLUDE_PATH"

    # Create initial commit
    echo "💾 Creating initial commit..."
    git commit -m "initial commit" --quiet

    # Push to target branch (force push to overwrite history)
    echo "⬆️  Force pushing to widget2code/$target_branch..."
    git push -f widget2code "$temp_branch:$target_branch"

    # Clean working tree and switch back
    echo "🧹 Cleaning up $temp_branch..."
    git checkout -qf "$source_branch"
    git branch -D "$temp_branch" > /dev/null 2>&1
}

# Process main branch
process_branch "main" "$TEMP_MAIN_BRANCH" "main"

# Process gh-pages branch
process_branch "gh-pages" "$TEMP_PAGES_BRANCH" "gh-pages"

# Return to original branch
echo ""
echo "🔙 Returning to $CURRENT_BRANCH..."
git checkout -q "$CURRENT_BRANCH"

echo ""
echo "✅ Successfully pushed to widget2code!"
echo "   - main: squashed to single 'initial commit'"
echo "   - gh-pages: squashed to single 'initial commit'"
echo "   - Excluded: $EXCLUDE_PATH"
echo "   - Origin remote: unchanged"
