# Widget Synthesis System

A comprehensive system for generating synthetic widget datasets through a 3-phase pipeline.

## Overview

The synthesis system combines:
- **Description libraries** - Curated widget descriptions for each domain
- **Domain prompts** - LLM system prompts enhanced with component documentation
- **Batch generation** - Scalable widget generation via API calls
- **Post-processing** - Preparation for rendering

## Directory Structure

```
libs/js/synthesis/
├── description-generators/      # Phase 1: Generate descriptions
│   ├── index.js                # Exports all generators
│   ├── generate-descriptions.js
│   ├── generate-dynamic-variations.js
│   ├── generate-image-descriptions.js
│   ├── generate-domain-prompts.js
│   └── expand-components.js
├── batch/                       # Phase 2: Batch generation
│   ├── batch-generate-widgets.js
│   └── run-parallel.js
├── postprocess/                 # Phase 3: Post-processing
│   └── prepare-render.js
├── config/                      # Configuration files
│   ├── prompt-presets.json
│   ├── runner-config.example.json
│   └── runner-configs/
│       ├── batch1.json
│       ├── batch2.json
│       └── ...
├── data/                        # Data files
│   └── descriptions/
│       ├── {domain}-descriptions.json
│       ├── dynamic/
│       ├── with-images/
│       └── image-urls/
└── README.md                    # This file
```

## Quick Start

### Option 1: Test the Setup (Recommended First Step)

```bash
cd scripts/synthesis
./run-synthesis.sh --test
```

### Option 2: Run All Phases

```bash
cd scripts/synthesis
./run-synthesis.sh
```

### Option 3: Run Individual Phases

```bash
# Phase 1: Setup
./run-synthesis.sh --setup-only

# Phase 2: Generate
./run-synthesis.sh --generate-only

# Phase 3: Post-process
./run-synthesis.sh --postprocess-only
```

## Detailed Workflow

### Phase 1: Setup - Generate Description Libraries

**Purpose**: Create description libraries and domain-specific prompts.

#### 1.1 Generate Static Descriptions

```bash
node libs/js/synthesis/description-generators/generate-descriptions.js
```

Creates hand-crafted description libraries for each domain:
- Output: `data/descriptions/{domain}-descriptions.json`
- Contains: Widget descriptions with IDs, prompts, complexity levels

#### 1.2 Generate Dynamic Variations (Optional)

```bash
node libs/js/synthesis/description-generators/generate-dynamic-variations.js
```

Procedurally generates variations by combining templates:
- Metrics (heart rate, steps, calories) × Visualizations (chart, gauge) × Layouts
- Output: `data/descriptions/dynamic/{domain}-dynamic.json`

#### 1.3 Generate Image Descriptions (Optional)

```bash
node libs/js/synthesis/description-generators/generate-image-descriptions.js
```

Creates image-focused widget descriptions:
- Includes image context and placement metadata
- Output: `data/descriptions/with-images/{domain}-with-images.json`

#### 1.4 Generate Domain Prompts

```bash
node libs/js/synthesis/description-generators/generate-domain-prompts.js
```

Combines base prompt with domain component documentation:
- Reads components from `libs/js/components/src/domains/{domain}.js`
- Appends component library to base prompt
- Output: `libs/python/generator/prompts/prompt2dsl/domains/prompt2dsl-{domain}.md`

### Phase 2: Batch Widget Generation

**Purpose**: Generate widgets by combining descriptions with domain prompts via API.

#### 2.1 Single Process Generation

```bash
node libs/js/synthesis/batch/batch-generate-widgets.js [options]
```

**Options:**
```bash
--limit=N                      # Limit to N descriptions per domain
--domains=domain1,domain2      # Comma-separated domains
--prompt-preset=NAME           # Use prompt preset (apple-style, android-style, etc.)
--port=PORT                    # Backend API port (default: 8010)
--dynamic                      # Use dynamic variations
--with-images                  # Use image-focused descriptions
--both                         # Use static + dynamic
--all                          # Use static + dynamic + with-images
--reference-images-dir=PATH    # Reference images for style guidance
--references-per-description=N # Generate N variants per description
--image-urls-dir=PATH          # Image URL files for content
```

**Examples:**
```bash
# Basic generation
node batch-generate-widgets.js --limit=5

# With Apple-style preset
node batch-generate-widgets.js --prompt-preset=apple-style --limit=5

# With reference images
node batch-generate-widgets.js --reference-images-dir=./reference-widgets --limit=10

# Image-focused widgets
node batch-generate-widgets.js --with-images --image-urls-dir=../data/descriptions/image-urls --limit=10
```

**Output:** `output/batch-generated/{domain}/{widget-id}.json`

#### 2.2 Parallel Generation

```bash
node libs/js/synthesis/batch/run-parallel.js --config=../config/runner-configs/batch1.json
```

Runs multiple `batch-generate-widgets.js` instances in parallel:
- Each runner uses different port and processes different domains
- Speeds up generation significantly
- Config files define runners, ports, domains, and options

**Config Example:**
```json
{
  "globalOptions": {
    "referenceImagesDir": "./reference-widgets",
    "imageUrlsDir": "./libs/js/synthesis/data/descriptions/image-urls"
  },
  "runners": [
    {
      "name": "health-finance",
      "port": "8010",
      "domains": ["health", "finance"],
      "promptPreset": "apple-style",
      "options": {
        "limit": 10,
        "useStatic": true
      }
    }
  ]
}
```

### Phase 3: Post-processing - Prepare for Rendering

**Purpose**: Transform generated widgets for the rendering system.

```bash
node libs/js/synthesis/postprocess/prepare-render.js [options]
```

**Transformations:**
- Unwraps from `widgetDSL` wrapper to `{widget: {...}}`
- Changes Image `url` → `src`
- Replaces MapImage URLs with configured map images
- Replaces Icon `name` props with configured icons
- Adjusts padding to 12-20 range

**Options:**
```bash
--test, --dry-run    # Preview changes without writing
--flat               # Output all files to single directory
```

**Output:** `output/batch-render-ready/`

## Configuration

### Prompt Presets

`config/prompt-presets.json` defines system prompt modifiers:

```json
{
  "presets": {
    "apple-style": {
      "name": "Apple iOS Style",
      "systemPromptModifier": "\n\nSTYLE REQUIREMENTS:\n- Use SF Symbols icons\n- Follow iOS design guidelines..."
    }
  }
}
```

### Runner Configs

`config/runner-configs/*.json` define parallel generation jobs:
- Multiple runners on different ports
- Different domains per runner
- Different presets per runner
- Prevents conflicts and speeds up generation

## Data Files

### Description Libraries

**Static Descriptions** (`data/descriptions/{domain}-descriptions.json`):
```json
{
  "domain": "health",
  "descriptions": [
    {
      "id": "health-001",
      "prompt": "A widget showing current heart rate",
      "complexity": "simple"
    }
  ]
}
```

**Dynamic Variations** (`data/descriptions/dynamic/{domain}-dynamic.json`):
```json
{
  "domain": "health",
  "variations": [
    {
      "id": "health-dyn-001",
      "prompt": "A widget showing heart rate with line chart",
      "template": "metric-chart",
      "complexity": "medium"
    }
  ]
}
```

**Image Descriptions** (`data/descriptions/with-images/{domain}-with-images.json`):
```json
{
  "domain": "media",
  "descriptions": [
    {
      "id": "media-img-001",
      "prompt": "A music player widget showing album art...",
      "requiresImage": true,
      "imageContext": "album cover or music artwork",
      "imagePlacement": "top-large",
      "complexity": "medium"
    }
  ]
}
```

### Image URLs

`data/descriptions/image-urls/image-urls-{domain}.txt`:
- Plain text files with one URL per line
- Domain-specific image URLs for image-focused widgets
- Falls back to `image-urls-all.txt` if domain file not found

## Advanced Usage

### Custom Description Libraries

Create custom descriptions in `data/descriptions/`:

```javascript
{
  "domain": "custom",
  "descriptions": [
    {
      "id": "custom-001",
      "prompt": "Your widget description",
      "complexity": "medium"
    }
  ]
}
```

### Custom Prompt Presets

Add presets to `config/prompt-presets.json`:

```json
{
  "custom-preset": {
    "name": "Custom Style",
    "systemPromptModifier": "\n\nYour custom requirements..."
  }
}
```

### Programmatic Usage

```javascript
import { generateDescriptionLibraries } from './description-generators/index.js';

await generateDescriptionLibraries();
```

## Troubleshooting

### "Description file not found"
- Ensure Phase 1 (setup) has been run
- Check that description files exist in `data/descriptions/`

### "Domain prompt not found"
- Run `generate-domain-prompts.js` to create prompts
- Check `libs/python/generator/prompts/prompt2dsl/domains/`

### "API error (Connection refused)"
- Ensure backend server is running on specified port
- Default port is 8010, change with `--port=` flag

### Parallel generation conflicts
- Ensure each runner uses a unique port
- Check runner configs for port conflicts
- Verify backend instances are running on all ports

## Output

### Batch Generated Widgets

`output/batch-generated/{domain}/{widget-id}.json`:
```json
{
  "widgetDSL": {
    "widget": { ... },
    "metadata": { ... }
  },
  "_metadata": {
    "descriptionId": "health-001",
    "originalPrompt": "...",
    "complexity": "simple",
    "generatedAt": "2025-11-17T..."
  }
}
```

### Render-Ready Widgets

`output/batch-render-ready/{widget-id}.json`:
```json
{
  "widget": {
    "type": "container",
    "padding": 16,
    "children": [ ... ]
  }
}
```

## See Also

- [Component System](../components/README.md)
- [Generator Documentation](../../python/generator/README.md)
- [Rendering System](../../../renderer/README.md)
