#!/bin/bash
set -e

echo "Installing Widget Factory dependencies..."

# Install Node.js dependencies
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

# Install widgetdsl-generator Python package
echo "Installing widgetdsl-generator..."
cd libs/generator
pip install -e .
cd ../..

# Install playwright browsers
echo "Installing Playwright browsers..."
npx playwright install

echo "Installation complete!"
