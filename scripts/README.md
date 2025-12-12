# Widget Factory Scripts

## Installation

```bash
./scripts/setup/install.sh
```

Configure `.env` with your `DASHSCOPE_API_KEY`

## Quick Start

Run generation, rendering, and evaluation manually in sequence:

```bash
# Step 1: Generate widget DSL
./scripts/generation/generate-widget.sh input.png ./output

# Step 2: Render widget to PNG
./scripts/rendering/render-widget.sh ./output/<widget-name>

# Step 3: Run evaluation (optional)
./scripts/evaluation/run_evaluation.sh ./output ./analysis
```

## Available Scripts

### Setup
```bash
./scripts/setup/install.sh       # Install all dependencies
```

### Development Servers
```bash
./scripts/dev/start-dev.sh       # Start playground (port 3060)
./scripts/dev/start-api.sh       # Start API server
./scripts/dev/start-full.sh      # Start both API + playground
```

### Generation (No server needed)
```bash
# Single image → DSL JSON
./scripts/generation/generate-widget.sh input.png output.json

# Batch generation (parallel processing)
./scripts/generation/generate-batch.sh ./images ./output [concurrency]

# Example: Process 5 images at a time
./scripts/generation/generate-batch.sh ./images ./output 5
```

### Rendering
```bash
# Compile DSL → JSX (no server needed)
./scripts/rendering/compile-widget.sh widget.json widget.jsx

# Render JSX → PNG (auto-starts server if needed)
./scripts/rendering/render-widget.sh widget.jsx widget.png

# Batch render
./scripts/rendering/render-batch.sh ./widgets ./output 5
```

### Evaluation
```bash
# Run evaluation on generated widgets
./scripts/evaluation/run_evaluation.sh ./output ./analysis

# With ground truth directory
./scripts/evaluation/run_evaluation.sh ./output ./analysis -g ./ground-truth
```

## Server Requirement

Rendering scripts require playground server running:

```bash
# Terminal 1: Start server
./scripts/dev/start-dev.sh

# Terminal 2: Run rendering tasks
./scripts/rendering/render-widget.sh ./output/<widget-name>
```

## Examples

### Generate only DSL
```bash
./scripts/generation/generate-widget.sh mockup.png widget.json
```

### View generated React code
```bash
./scripts/rendering/compile-widget.sh widget.json widget.jsx
cat widget.jsx
```

### Complete workflow
```bash
# Step 1: Generate DSL
./scripts/generation/generate-widget.sh design.png ./result

# Step 2: Render to PNG
./scripts/rendering/render-widget.sh ./result/design

# Output: ./result/design/{artifacts/, output.png}
```

## Configuration

All scripts read settings from `.env` file:
- `FRONTEND_PORT` - Playground server port (default: 3060)
- `BACKEND_PORT` - API server port (default: 8010)
- `DASHSCOPE_API_KEY` - Required for AI generation
- `DEFAULT_MODEL` - AI model to use (default: qwen3-vl-flash)

## Tools Used

- **CLI** (`@widget-factory/cli`) - Compile, render, batch-render
- **Generator** (`generator`) - AI-powered widget generation
