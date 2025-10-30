# Widget Factory Scripts

## Installation

```bash
./scripts/setup/install.sh
```

Configure `.env` with your `DASHSCOPE_API_KEY`

## Quick Start

### Full Pipeline (Image → PNG)
```bash
# Auto-manages server, creates DSL, JSX, and PNG
./scripts/pipeline/run-full.sh input.png ./output
```

### Batch Process
```bash
# Process multiple images (5 concurrent)
./scripts/pipeline/run-batch-full.sh ./images ./output 5
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

### Pipeline
```bash
# Full: Image → DSL → JSX → PNG
./scripts/pipeline/run-full.sh input.png ./output

# Batch full pipeline
./scripts/pipeline/run-batch-full.sh ./images ./output 5
```

## Server Requirement

Rendering and pipeline scripts require playground server running:

```bash
# Terminal 1: Start server
./scripts/dev/start-dev.sh

# Terminal 2: Run rendering tasks
./scripts/pipeline/run-full.sh design.png ./output
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
./scripts/pipeline/run-full.sh design.png ./result
# Output: ./result/{design.json, design.jsx, design.png}
```

## Configuration

All scripts read settings from `.env` file:
- `FRONTEND_PORT` - Playground server port (default: 3060)
- `BACKEND_PORT` - API server port (default: 8010)
- `DASHSCOPE_API_KEY` - Required for AI generation
- `DEFAULT_MODEL` - AI model to use (default: qwen3-vl-flash)

## Tools Used

- **CLI** (`@widget-factory/cli`) - Compile, render, batch-render
- **Generator** (`widgetdsl-generator`) - AI-powered widget generation
