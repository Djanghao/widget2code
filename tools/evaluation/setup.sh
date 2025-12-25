#!/bin/bash
# Setup script for Widget Quality Evaluation environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Widget Evaluation Environment Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if virtual environment already exists
if [ -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Virtual environment already exists at: $VENV_DIR${NC}"
    read -p "Do you want to recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Removing old virtual environment...${NC}"
        rm -rf "$VENV_DIR"
    else
        echo -e "${GREEN}Using existing virtual environment${NC}"
        echo ""
        echo -e "${BLUE}To activate the environment, run:${NC}"
        echo -e "  source tools/evaluation/.venv/bin/activate"
        exit 0
    fi
fi

# Create virtual environment
echo -e "${GREEN}Creating virtual environment...${NC}"
python3 -m venv "$VENV_DIR"

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo -e "${GREEN}Upgrading pip...${NC}"
pip install --upgrade pip

# Install requirements
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -r "$SCRIPT_DIR/requirements.txt"

# Check tesseract
echo ""
echo -e "${BLUE}Checking system dependencies...${NC}"
if command -v tesseract &> /dev/null; then
    echo -e "${GREEN}✓ Tesseract OCR found: $(tesseract --version | head -1)${NC}"
else
    echo -e "${YELLOW}⚠ Tesseract OCR not found${NC}"
    echo -e "${YELLOW}  Install with:${NC}"
    echo -e "${YELLOW}    Ubuntu/Debian: sudo apt-get install tesseract-ocr${NC}"
    echo -e "${YELLOW}    macOS: brew install tesseract${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}To activate the environment, run:${NC}"
echo -e "  source tools/evaluation/.venv/bin/activate"
echo ""
echo -e "${BLUE}To run evaluation:${NC}"
echo -e "  ./scripts/evaluation/run_evaluation.sh <PRED_DIR> <OUTPUT_DIR>"
echo ""
