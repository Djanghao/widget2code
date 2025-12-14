# Widget2Code: From Visual Widgets to UI Code via Multimodal LLMs

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Paper](https://img.shields.io/badge/paper-arxiv-red.svg)](https://)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717.svg?logo=github)](https://github.com/Djanghao/widget-factory/tree/main)

![Description](https://github.com/user-attachments/assets/20fb1917-7cc2-4148-a900-0a7c0cd276ac)

## Overview

**Widget Factory** is an end-to-end infrastructure with a widget-specific DSL, a multi-target compiler, and an adaptive rendering module for geometry-consistent widget reconstruction from screenshot image.

## Key Capabilities

### 1. Widget Generation
Automatically generate WidgetDSL specifications from screenshots using advanced vision-language models with:
- Icon detection and intelligent retrieval from 57,000+ icons
- Multi-chart recognition (LineChart, BarChart, StackedBarChart, RadarChart, PieChart, etc.)
- Layout and composition analysis
- Color extraction and preservation
- Batch processing with configurable concurrency (supports 100+ concurrent workers)

### 2. Component Library
19 production-ready UI components plus extensive icon support:
- **Layout**: WidgetShell
- **Text**: Text, Button, AppLogo
- **Visual**: Icon, Image, MapImage, Divider, Indicator
- **Input**: Checkbox, Slider, Switch
- **Charts**: LineChart, BarChart, StackedBarChart, RadarChart, PieChart, ProgressBar, ProgressRing, Sparkline

### 3. Interactive Playground
Web-based interface for widget creation and editing:
- Preset templates gallery
- Image upload and DSL generation
- Natural language widget generation
- Real-time JSON editing with syntax highlighting
- Tree-based widget structure visualization
- PNG export with dimension control
- Responsive design preview

### 4. Flexible Architecture
Modular, composable design enabling multiple workflows:
- Standalone generation (Python)
- Server-based rendering (FastAPI + Playwright)
- Programmatic API (JavaScript/TypeScript)
- Command-line tools (Node.js)
The platform leverages Vision-Language Models (By default, Qwen) for intelligent image analysis and includes a comprehensive component library with 6,950+ SF Symbols and 57,000+ additional icons with AI-powered retrieval.

## Getting Started

### Installation

**One-Command Setup**:
```bash
./scripts/setup/install.sh
```

Installs all dependencies including Node.js packages and isolated Python environment.

### Configuration

Create `.env` file with API credentials:
```bash
cp .env.example .env
# Edit .env and add DEFAULT_API_KEY
```

### Quick Start

**Generate widgets from images**:
```bash
# Single image
./scripts/generation/generate-widget.sh mockup.png output/widget.json

# Batch processing (5 concurrent workers)
./scripts/generation/generate-batch.sh ./mockups ./output 5
```

**Start interactive playground**:
```bash
# Frontend server only (port 3060)
npm run dev

# Frontend + API backend
npm run dev:full
```

## Environment Variables

Create `.env` file:

```bash
# API Configuration
DEFAULT_API_KEY=your-api-key

# Server Ports
BACKEND_PORT=8010
FRONTEND_PORT=3060
HOST=0.0.0.0

# AI Models
DEFAULT_MODEL=qwen3-vl-plus              # qwen3-vl-flash, qwen3-vl-plus, qwen3-vl-235b
TIMEOUT=800

# Icon Retrieval (FAISS)
RETRIEVAL_TOPK=50                        # Top-k similar icons
RETRIEVAL_TOPM=10                        # Top-m for re-ranking
RETRIEVAL_ALPHA=0.8                      # Text/image weight

# Performance
ENABLE_MODEL_CACHE=true                  # Cache models for concurrent requests
USE_CUDA_FOR_RETRIEVAL=true              # GPU acceleration for embeddings
BATCH_SIZE=4                              # Generation batch size
CONCURRENCY=100                           # Max concurrent workers

# Security
MAX_FILE_SIZE_MB=100
MAX_REQUESTS_PER_MINUTE=1000

# Debug
SAVE_DEBUG_VISUALIZATIONS=true           # Save intermediate images
SAVE_PROMPTS=true                        # Save generation prompts
```

## Evaluation

### Benchmark Results

The evaluation results on multiple benchmarks are available for download:

**Download Link**: [Benchmarks Dataset (1.5GB)](https://drive.google.com/file/d/1TFLrW5lBLFX_hK7U9nQLRLiYn_hDOiT_/view?usp=sharing)

This archive contains evaluation results across 13 benchmark datasets:
- DCGen-Extracted-Widget
- Design2Code-Extracted-Widget
- Doubao_size
- GPT_size
- Gemini_size
- LatCoder-Extracted-Widget
- Pix2Code-Pytorch
- Qwen3VL_235b_size
- Screencoder
- UICopilot
- UIUG
- WebSight-VLM-8B
- Widget2Code

To use the benchmarks:
```bash
# Install gdown (if not already installed)
pip install gdown

# Download using gdown (1.5GB)
gdown --fuzzy "https://drive.google.com/file/d/1TFLrW5lBLFX_hK7U9nQLRLiYn_hDOiT_/view?usp=sharing"

# If download fails, manually download from:
# https://drive.google.com/file/d/1TFLrW5lBLFX_hK7U9nQLRLiYn_hDOiT_/view?usp=sharing

# Extract to data/ directory
mkdir -p data
unzip benchmarks_backup_20251213.zip -d data/

# Run evaluation on all benchmarks
./scripts/evaluation/run_all_benchmarks.sh
```
