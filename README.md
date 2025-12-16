<div align="center">

<img src="./assets/logo.png" alt="Widget2Code Logo" width="55%">

# 🎨 Widget2Code: From Visual Widgets to UI Code via Multimodal LLMs

</div>


<div align="center">
<!-- <img src="./assets/banner.png" alt="Widget2Code Banner" width="800"> -->

</div>


Widget2Code is a baseline framework that strengthens both perceptual understanding and system-level generation for transforming visual widgets into UI code. It leverages advanced vision-language models to automatically generate production-ready WidgetDSL from screenshots, featuring icon detection across 57,000+ icons, chart recognition for 8 chart types, and sophisticated layout analysis. This repository provides the implementation and tools needed to generate high-fidelity UI code.


<div align="center">
  <a href="https://arxiv.org/abs/PLACEHOLDER" target="_blank"><img src=https://img.shields.io/badge/Report-b5212f.svg?logo=arxiv height=22px></a>
  <a href=https://PLACEHOLDER_PROJECT_PAGE target="_blank"><img src= https://img.shields.io/badge/Project-Page-bb8a2e.svg?logo=github height=22px></a>
  <a href=https://github.com/Djanghao/widget-factory/tree/main target="_blank"><img src=https://img.shields.io/badge/GitHub-Repository-181717.svg?logo=github height=22px></a>
  <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank"><img src=https://img.shields.io/badge/license-Apache%202.0-blue.svg height=22px></a>

</div>


<p align="center">
    💻 <a href="./apps/playground">Interactive Playground</a> |
📊 <a href="#-benchmarks--evaluation">Benchmarks</a>&nbsp&nbsp
</p>

## 🔥🔥🔥 News
* 🚀 Dec 16, 2025: **Code Open-Sourced**: We release the complete Widget2Code framework including inference code, interactive playground, batch processing scripts, and evaluation tools! The framework features 19 production-ready UI components, 57,000+ icon retrieval system, and state-of-the-art performance across 13 benchmark datasets. 🔥🔥🔥🆕


## 🎥 Demo
<div align="center">
  <video src="https://github.com/user-attachments/assets/883112b1-6d78-4576-a356-2a7061f31751" width="80%" controls></video>



</div>

## 📑 Open-source Plan
- Widget2Code Framework
  - [x] Inference Code and Widget Generation Pipeline
  - [x] Interactive Playground (Web UI)
  - [x] Batch Processing Scripts
  - [x] Evaluation Framework with 13 Benchmarks
  - [x] 19 UI Components Library
  - [x] Icon Retrieval System (57,000+ icons)
  - [x] Chart Recognition (8 chart types)
  - [ ] Training Code and Fine-tuning Scripts
  - [ ] Pre-trained Model Weights Release

## 📋 Table of Contents
- [🎨 Widget2Code: From Visual Widgets to UI Code via Multimodal LLMs](#-widget2code-from-visual-widgets-to-ui-code-via-multimodal-llms)
  - [🔥🔥🔥 News](#-news)
  - [🎥 Demo](#-demo)
  - [📑 Open-source Plan](#-open-source-plan)
  - [📋 Table of Contents](#-table-of-contents)
  - [📖 Overview](#-overview)
  - [✨ Key Features](#-key-features)
    - [1. Widget Generation](#1-widget-generation)
    - [2. Component Library](#2-component-library)
    - [3. Interactive Playground](#3-interactive-playground)
  - [📜 System Requirements](#-system-requirements)
    - [Hardware Requirements](#hardware-requirements)
    - [Software Requirements](#software-requirements)
  - [🛠️ Dependencies and Installation](#️-dependencies-and-installation)
    - [Quick Install (Recommended)](#quick-install-recommended)
    - [Manual Installation](#manual-installation)
  - [⚙️ Configuration](#️-configuration)
    - [Environment Variables](#environment-variables)
  - [🚀 Quick Start](#-quick-start)
    - [Step 1: Start API Service](#step-1-start-api-service)
    - [Step 2: Generate Widgets (Batch)](#step-2-generate-widgets-batch)
    - [Step 3: Render Widgets (Batch)](#step-3-render-widgets-batch)
    - [Step 4: Evaluate Results](#step-4-evaluate-results)
    - [Interactive Playground (Optional)](#interactive-playground-optional)
  - [📊 Benchmarks \& Evaluation](#-benchmarks--evaluation)
    - [Performance Comparison](#performance-comparison)
    - [Quality Metrics](#quality-metrics)
    - [Evaluation Datasets](#evaluation-datasets)
    - [Download Benchmarks](#download-benchmarks)
  - [🔧 API \& CLI Reference](#-api--cli-reference)
    - [Batch Generation Script](#batch-generation-script)
    - [Batch Rendering Script](#batch-rendering-script)
    - [Evaluation Script](#evaluation-script)
    - [API Server](#api-server)
  - [🏗️ Architecture](#️-architecture)
    - [Generation Pipeline](#generation-pipeline)
    - [Advanced Features](#advanced-features)
  - [📚 Citation](#-citation)
  - [🌟 Acknowledgments](#-acknowledgments)


## 📖 Overview

**Widget2Code** is a baseline framework that strengthens both perceptual understanding and system-level generation for transforming visual widgets into UI code.

## ✨ Key Features

### 1. Widget Generation
Automatically generate WidgetDSL from screenshots using advanced vision-language models with:
- **Icon Detection and Retrieval**: FAISS-based similarity search across 57,000+ icons from multiple libraries (Lucide, SF Symbols, Heroicons, Feather, Material Design, and more)
- **Chart Recognition**: Specialized detection for 8 chart types (LineChart, BarChart, StackedBarChart, RadarChart, PieChart, ProgressBar, ProgressRing, Sparkline)
- **Layout Analysis**: Multi-stage layout detection with intelligent retry mechanism for robust component positioning
- **Color Extraction**: Sophisticated palette and gradient extraction with color preservation
- **Multi-Domain Support**: Optimized prompts for 15+ application domains (weather, utilities, communication, health & fitness, productivity, etc.)

### 2. Component Library
19 production-ready UI components with full icon support:
- **Layout**: WidgetShell (container with padding and background support)
- **Text**: Text, Button, AppLogo
- **Visual**: Icon, Image, MapImage, Divider, Indicator
- **Input**: Checkbox, Slider, Switch
- **Charts**: LineChart, BarChart, StackedBarChart, RadarChart, PieChart, ProgressBar, ProgressRing, Sparkline

### 3. Interactive Playground
Web-based interface for widget creation and experimentation:
- Real-time DSL editing and preview
- Component library browser
- Export to React JSX or HTML
- 50+ built-in examples

## 📜 System Requirements

### Hardware Requirements
- **GPU**: NVIDIA GPU with CUDA support (recommended for icon retrieval acceleration)
- **Memory**: Minimum 8GB RAM, 16GB+ recommended for batch processing
- **Storage**: ~2GB for model embeddings and icon database

### Software Requirements
- **Operating System**: Linux, macOS, or Windows (WSL2)
- **Node.js**: 18.x or higher
- **Python**: 3.10 or higher
- **CUDA**: Compatible CUDA version for PyTorch (if using GPU acceleration)

## 🛠️ Dependencies and Installation

### Quick Install (Recommended)

**One-Command Setup**:
```bash
./scripts/setup/install.sh
```

Installs all dependencies including Node.js packages and isolated Python environment.

### Manual Installation

```bash
# Step 1: Clone the repository
git clone https://github.com/Djanghao/widget-factory.git
cd widget-factory-release

# Step 2: Install Node.js dependencies
npm install

# Step 3: Install Python dependencies
cd libs/python/generator
pip install -r requirements.txt

# Step 4: Set up icon embeddings (optional, for GPU acceleration)
python setup_embeddings.py --use-cuda
```

## ⚙️ Configuration

Create `.env` file with API credentials:

```bash
cp .env.example .env
# Edit .env and add your API configuration
```

### Environment Variables

**API Configuration**
```bash
DEFAULT_API_KEY=your-api-key              # API key for LLM provider
DEFAULT_MODEL=qwen3-vl-plus               # qwen3-vl-flash, qwen3-vl-plus, qwen3-vl-235b
TIMEOUT=800                               # Request timeout in seconds
```

**Server Ports**
```bash
BACKEND_PORT=8010                         # API backend port
FRONTEND_PORT=3060                        # Playground frontend port
HOST=0.0.0.0                              # Server host
```

**AI Models**
```bash
DEFAULT_MODEL=qwen3-vl-plus               # Primary model for generation
TIMEOUT=800                               # Model inference timeout
```

**Icon Retrieval (FAISS)**
```bash
RETRIEVAL_TOPK=50                         # Top-k similar icons to retrieve
RETRIEVAL_TOPM=10                         # Top-m for re-ranking
RETRIEVAL_ALPHA=0.8                       # Text/image similarity weight (0-1)
```

**Performance**
```bash
ENABLE_MODEL_CACHE=true                   # Cache models for concurrent requests
USE_CUDA_FOR_RETRIEVAL=true               # GPU acceleration for icon embeddings
BATCH_SIZE=4                              # Generation batch size
CONCURRENCY=100                           # Max concurrent workers
```

**Security**
```bash
MAX_FILE_SIZE_MB=100                      # Maximum upload file size
MAX_REQUESTS_PER_MINUTE=1000              # Rate limiting threshold
```

**Debug**
```bash
SAVE_DEBUG_VISUALIZATIONS=true            # Save intermediate processing images
SAVE_PROMPTS=true                         # Save LLM prompts for debugging
```

## 🚀 Quick Start

### Step 1: Start API Service

```bash
# Start API backend (required for batch processing)
npm run api
```

### Step 2: Generate Widgets (Batch)

```bash
# Batch generation with 5 concurrent workers
./scripts/generation/generate-batch.sh ./mockups ./output 5

# Force regenerate all images
./scripts/generation/generate-batch.sh ./mockups ./output 5 --force
```

### Step 3: Render Widgets (Batch)

```bash
# Batch rendering with 5 concurrent workers
./scripts/rendering/render-batch.sh ./output 5

# Force rerender all widgets
./scripts/rendering/render-batch.sh ./output 5 --force
```

### Step 4: Evaluate Results

```bash
# Evaluate generated widgets against ground truth
./scripts/evaluation/run_evaluation.sh ./output -g ./ground_truth

# Use GPU and more workers for faster evaluation
./scripts/evaluation/run_evaluation.sh ./output -g ./ground_truth --cuda -w 16
```

### Interactive Playground (Optional)

```bash
# Start full stack (API + Frontend on ports 8010 + 3060)
npm run dev:full
```

## 📊 Benchmarks & Evaluation

### Performance Comparison

Widget2Code achieves state-of-the-art performance across multiple quality dimensions including layout accuracy, legibility, style preservation, perceptual similarity, and geometric precision.

<div align="center">
  <img src="./assets/benchmarks.png" alt="Benchmark Results" width="800">
</div>

### Quality Metrics

Our evaluation framework assesses generated widgets across multiple key dimensions:

**Layout Quality**
- **Margin**: Margin alignment accuracy
- **Content**: Content area preservation
- **Area**: Overall area coverage

**Legibility**
- **Text**: Text readability and accuracy
- **Contrast**: Color contrast ratios
- **LocCon**: Location consistency

**Style Preservation**
- **Palette**: Color palette matching
- **Vibrancy**: Color vibrancy retention
- **Polarity**: Color polarity accuracy

**Perceptual Quality**
- **SSIM**: Structural Similarity Index
- **LPIPS**: Learned Perceptual Image Patch Similarity
- **CLIP**: CLIP-based semantic similarity

**Geometric Accuracy**
- Component position and size accuracy

### Evaluation Datasets

Widget2Code has been evaluated on 13 benchmark datasets:
1. DCGen-Extracted-Widget
2. Design2Code-Extracted-Widget
3. Doubao_size
4. GPT_size
5. Gemini_size
6. LatCoder-Extracted-Widget
7. Pix2Code-Pytorch
8. Qwen3VL_235b_size
9. Screencoder
10. UICopilot
11. UIUG
12. WebSight-VLM-8B
13. Widget2Code (internal test set)

### Download Benchmarks

The evaluation results on multiple benchmarks are available for download:

**Download Link**: [Benchmarks Dataset (1.5GB)](https://drive.google.com/file/d/1TFLrW5lBLFX_hK7U9nQLRLiYn_hDOiT_/view?usp=sharing)

This archive contains evaluation results across all 13 benchmark datasets.

To use the benchmarks:
```bash
# Install gdown (if not already installed)
pip install gdown

# Download using gdown (1.5GB)
gdown --fuzzy "https://drive.google.com/file/d/1TFLrW5lBLFX_hK7U9nQLRLiYn_hDOiT_/view?usp=sharing"

# If download fails, manually download from the link above

# Extract to data/ directory
mkdir -p data
unzip benchmarks_backup_20251213.zip -d data/

# Run evaluation on all benchmarks
./scripts/evaluation/run_all_benchmarks.sh
```

## 🔧 API & CLI Reference

### Batch Generation Script

```bash
./scripts/generation/generate-batch.sh <input_dir> <output_dir> <workers> [--force]
```

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `input_dir` | path | Directory containing mockup images | Required |
| `output_dir` | path | Directory for generated widget DSL files | Required |
| `workers` | int | Number of concurrent workers | Required |
| `--force` | flag | Force regeneration of existing outputs | false |

**Example**:
```bash
./scripts/generation/generate-batch.sh ./mockups ./output 5 --force
```

### Batch Rendering Script

```bash
./scripts/rendering/render-batch.sh <output_dir> <workers> [--force]
```

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `output_dir` | path | Directory containing widget DSL files | Required |
| `workers` | int | Number of concurrent workers | Required |
| `--force` | flag | Force rerendering of existing outputs | false |

**Example**:
```bash
./scripts/rendering/render-batch.sh ./output 5
```

### Evaluation Script

```bash
./scripts/evaluation/run_evaluation.sh <output_dir> [options]
```

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `output_dir` | path | Directory with generated widgets | Required |
| `-g, --ground_truth` | path | Ground truth directory for comparison | Required |
| `--cuda` | flag | Enable GPU acceleration for metrics | false |
| `-w, --workers` | int | Number of parallel evaluation workers | 4 |
| `--save-visualizations` | flag | Save comparison visualizations | false |

**Example**:
```bash
./scripts/evaluation/run_evaluation.sh ./output -g ./ground_truth --cuda -w 16
```

### API Server

Start the FastAPI backend server:

```bash
npm run api
# Server runs on http://localhost:8010
```

**Key Endpoints**:
- `POST /generate` - Generate widget from image
- `POST /batch` - Batch generation
- `GET /health` - Health check
- `GET /models` - List available models

## 🏗️ Architecture

Widget2Code employs a sophisticated multi-stage generation pipeline:

### Generation Pipeline

1. **Image Preprocessing**: Resolution normalization, format conversion, and quality analysis
2. **Layout Detection**: Multi-stage layout analysis with intelligent retry mechanism for robust component positioning
3. **Icon Retrieval**: FAISS-based similarity search across 57,000+ icons with dual-encoder (text + image) matching
4. **Chart Recognition**: Specialized detection and classification for 8 chart types using vision models
5. **Color Extraction**: Advanced palette and gradient analysis with perceptual color matching
6. **DSL Generation**: LLM-based structured output generation with domain-specific prompts
7. **Validation**: Schema validation, constraint checking, and error correction
8. **Compilation**: DSL to React JSX/HTML transformation with optimization

<div align="center">
  <img src="./assets/overview.png" alt="Widget2Code Architecture" width="100%">
</div>

### Advanced Features

**Stage-Specific LLM Configuration**
- Per-stage model selection (layout, graph, DSL generation)
- Temperature, top-k, top-p tuning per stage
- Thinking mode support for complex reasoning

**Performance Optimizations**
- Model caching for concurrent requests
- GPU-accelerated icon embedding search
- Batch processing with configurable workers
- Token bucket rate limiting

**Icon Library Management**
- 57,000+ icons from 6+ libraries
- FAISS vector database for fast retrieval
- Configurable icon set selection
- Automatic icon variant matching

## 📚 Citation

If you find Widget2Code useful for your research or projects, please cite our work:

```bibtex
@article{widget2code2025,
  title={Widget2Code: From Visual Widgets to UI Code via Multimodal LLMs},
  author={},
  journal={},
  year={2025}
}
```

## 🌟 Acknowledgments

This project builds upon research in vision-language models, UI understanding, and code generation. We thank the open-source community for their contributions.

---

<div align="center">
  Made with ❤️ by the Widget2Code Team
</div>
