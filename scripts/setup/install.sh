#!/bin/bash
set -e

echo "Cleaning up existing environment..."

echo "Removing node_modules directories..."
rm -rf node_modules
rm -rf apps/node_modules
rm -rf apps/playground/node_modules
rm -rf libs/packages/icons/node_modules

echo "Removing build artifacts..."
rm -rf apps/playground/dist

echo "Removing Python virtual environment..."
rm -rf apps/api/.venv

echo "Environment cleaned successfully!"
echo ""
echo "Installing Widget Factory dependencies..."

echo "Installing Node.js packages..."
npm install

# Setup Python virtual environment for API
echo "Setting up Python virtual environment..."
cd apps/api
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
cd ../..

# Install generator Python package
echo "Installing generator package..."
cd libs/python
pip install -e .
cd ../..

# Install playwright browsers
echo "Installing Playwright browsers..."
npx playwright install

echo "Installation complete!"
