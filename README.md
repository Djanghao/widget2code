# Widget2Code: From Visual Widgets to UI Code via Multimodal LLMs

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Paper](https://img.shields.io/badge/paper-arxiv-red.svg)](https://)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717.svg?logo=github)](https://github.com/Djanghao/widget-factory/tree/main)

![Description](https://github.com/user-attachments/assets/20fb1917-7cc2-4148-a900-0a7c0cd276ac)

## Overview

**Widget2Code** is a baseline framework that strengthens both perceptual understanding and system-level generation for transforming visual widgets into UI code. 

## Key Capabilities

### 1. Widget Generation
Automatically generate WidgetDSL from screenshots using advanced vision-language models with:
- Icon detection and retrieval from 57,000+ icons
- Chart recognition (LineChart, BarChart, StackedBarChart, RadarChart, PieChart, etc.)
- Layout and composition analysis
- Color extraction and preservation

### 2. Component Library
19 UI components and icon support:
- **Layout**: WidgetShell
- **Text**: Text, Button, AppLogo
- **Visual**: Icon, Image, MapImage, Divider, Indicator
- **Input**: Checkbox, Slider, Switch
- **Charts**: LineChart, BarChart, StackedBarChart, RadarChart, PieChart, ProgressBar, ProgressRing, Sparkline

### 3. Interactive Playground
Web-based interface for widget creation

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

**Step 1: Start API Service**
```bash
# Start API backend (required for batch processing)
npm run api
```

**Step 2: Generate Widgets (Batch)**
```bash
# Batch generation with 5 concurrent workers
./scripts/generation/generate-batch.sh ./mockups ./output 5

# Force regenerate all images
./scripts/generation/generate-batch.sh ./mockups ./output 5 --force
```

**Step 3: Render Widgets (Batch)**
```bash
# Batch rendering with 5 concurrent workers
./scripts/rendering/render-batch.sh ./output 5

# Force rerender all widgets
./scripts/rendering/render-batch.sh ./output 5 --force
```

**Step 4: Evaluate Results**
```bash
# Evaluate generated widgets against ground truth
./scripts/evaluation/run_evaluation.sh ./output -g ./ground_truth

# Use GPU and more workers for faster evaluation
./scripts/evaluation/run_evaluation.sh ./output -g ./ground_truth --cuda -w 16
```

**Interactive Playground (Optional)**
```bash
# Start full stack (API + Frontend on ports 8010 + 3060)
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
