#!/bin/bash

# Script to publish develop branch to origin/main
# This script squashes all develop branch commits into a single commit
# and force pushes to origin/main (excludes scripts/release directory)

set -e

TARGET_REMOTE="origin"
SOURCE_BRANCH="develop"
TARGET_BRANCH="main"
TEMP_BRANCH="temp-publish-main"
EXCLUDE_PATH="scripts/release"

echo "🚀 Starting publish from develop to origin/main..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"


# Function to process a branch
process_branch() {
    local source_branch=$1
    local temp_branch=$2
    local target_branch=$3

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Processing $source_branch → $TARGET_REMOTE/$target_branch"
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
    echo "⬆️  Force pushing to $TARGET_REMOTE/$target_branch..."
    git push -f "$TARGET_REMOTE" "$temp_branch:$target_branch"

    # Clean working tree and switch back
    echo "🧹 Cleaning up $temp_branch..."
    git checkout -qf "$source_branch"
    git branch -D "$temp_branch" > /dev/null 2>&1
}

# Process develop branch
process_branch "$SOURCE_BRANCH" "$TEMP_BRANCH" "$TARGET_BRANCH"

# Return to original branch
echo ""
echo "🔙 Returning to $CURRENT_BRANCH..."
git checkout -q "$CURRENT_BRANCH"

echo ""
echo "✅ Successfully published develop to origin/main!"
echo "   - Source: $SOURCE_BRANCH branch"
echo "   - Target: $TARGET_REMOTE/$TARGET_BRANCH"
echo "   - Commits: squashed to single 'initial commit'"
echo "   - Excluded: $EXCLUDE_PATH"
