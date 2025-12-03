# DSL Mutator

This directory contains the DSL Diversity Mutator system for creating synthetic widget DSL examples.

## Files Overview

- **`dsl-generator.js`** - Main mutator class with mutation logic and validation
- **`generate-dsl-diversity.js`** - CLI script for running the mutator
- **`dsl-mutation-palette.json`** - Palette of valid values for mutations (colors, sizes, components, etc.)
- **`dsl-validation-rulebook.json`** - Fast validation rules for ensuring DSL validity

## Quick Start

```bash
# Generate 10,000 random DSL variations (default)
node libs/js/mutator/generate-dsl-diversity.js

# Generate 1,000 DSLs
node libs/js/mutator/generate-dsl-diversity.js -n 1000

# Show all options
node libs/js/mutator/generate-dsl-diversity.js --help
```

## Usage

### Command Line Options

```bash
# Basic generation
node libs/js/mutator/generate-dsl-diversity.js --count 1000

# Theme transformations
node libs/js/mutator/generate-dsl-diversity.js -n 100 --theme dark --mode controlled

# Size transformations
node libs/js/mutator/generate-dsl-diversity.js -n 100 --size compact --mode controlled

# Combined transformations
node libs/js/mutator/generate-dsl-diversity.js -n 100 --theme dark --size large --mode hybrid

# Generate all theme variants (100 × 5 themes = 500 total)
node libs/js/mutator/generate-dsl-diversity.js -n 100 --all-themes --mode hybrid

# Matrix mode: all theme × size combinations (100 × 5 × 3 = 1,500 total)
node libs/js/mutator/generate-dsl-diversity.js -n 100 --matrix
```

### Available Options

| Option | Description | Values |
|--------|-------------|---------|
| `-n, --count` | Number of DSLs to generate | Number (default: 10000) |
| `--theme` | Apply theme transformation | `light`, `dark`, `colorful`, `glassmorphism`, `minimal` |
| `--size` | Apply size variant | `compact`, `medium`, `large` |
| `--mode` | Mutation mode | `random`, `controlled`, `hybrid` |
| `--matrix` | Generate all theme × size combinations | Flag |
| `--all-themes` | Generate all theme variants | Flag |
| `--all-sizes` | Generate all size variants | Flag |
| `-h, --help` | Show help message | Flag |

### Mutation Modes

**`random`** (default)
- Only random mutations
- Maximum diversity
- Use for training data

**`controlled`**
- Only theme/size transformations
- No random mutations
- Use for testing consistency

**`hybrid`**
- Theme/size transformations + random mutations
- Best of both worlds
- Use for themed diversity

### Examples

```bash
# Generate 10,000 random DSLs
node libs/js/mutator/generate-dsl-diversity.js

# Generate 100 dark mode variants (controlled)
node libs/js/mutator/generate-dsl-diversity.js --count 100 --theme dark --mode controlled

# Generate 100 dark + large with random mutations (hybrid)
node libs/js/mutator/generate-dsl-diversity.js --count 100 --theme dark --size large --mode hybrid

# Generate all theme variants (5 themes × 100 = 500 DSLs)
node libs/js/mutator/generate-dsl-diversity.js --count 100 --all-themes --mode hybrid

# Matrix generation: all combinations (5 themes × 3 sizes × 100 = 1,500 DSLs)
node libs/js/mutator/generate-dsl-diversity.js --count 100 --matrix
```

### Programmatic Usage

```javascript
import DSLDiversityGenerator from './libs/js/mutator/dsl-generator.js';

const generator = new DSLDiversityGenerator();
await generator.initialize();

// Random generation
await generator.generate(5000);

// Controlled generation with theme/size
await generator.generateWithControlled(100, {
  themes: ['dark', 'light'],
  sizes: ['compact', 'large'],
  mode: 'hybrid'
});

await generator.generateReport();
```

## Output

Generated DSLs are saved to `libs/js/mutator/results/[RUN-ID]/` with unique batch files and full tracking:

```
libs/js/mutator/results/
└── run-2025-10-30T20-35-30-abc123/    # Unique run ID (timestamp + random)
    ├── generation-report.json            # Statistics and metadata
    ├── run-2025-10-30T20-35-30-abc123-batch-001.json  # First 100 DSLs
    ├── run-2025-10-30T20-35-30-abc123-batch-002.json  # Second 100 DSLs
    └── ...                                 # Additional batches
```

### Enhanced DSL Tracking

Each generated DSL now includes:

- **`runId`**: Unique identifier for the generation session
- **`seedHash`**: Hash of the original seed DSL
- **`seedDSL`**: Complete original seed DSL used
- **`mutations`**: Step-by-step mutation history with descriptions
- **`resultDSL`**: Final mutated DSL
- **`hash`**: Hash of the result DSL (for duplicate detection)
- **`generatedAt`**: Timestamp of generation

### Example Generated DSL Entry

```json
{
  "id": 1,
  "runId": "run-2025-10-30T20-35-30-abc123",
  "seedHash": "9cec0d6ad88aeb15a94da4da83a9bf62",
  "seedDSL": { /* Original seed DSL */ },
  "mutations": [
    {
      "step": 1,
      "mutation": "mutateBackgroundColor",
      "type": "colorMutations",
      "description": "Changed background color"
    },
    {
      "step": 2,
      "mutation": "addNode",
      "type": "structureMutations",
      "description": "Added new component"
    }
  ],
  "resultDSL": { /* Final mutated DSL */ },
  "hash": "a1b2c3d4e5f6789",
  "generatedAt": "2025-10-30T20:35:30.123Z"
}
```

## Algorithm (Mutate-and-Validate)

1. **Load** existing valid DSLs as seed data from `apps/playground/src/examples/`
2. **Pick** a random seed DSL
3. **Apply Transformations** (if using controlled/hybrid mode):
   - Apply theme transformations (colors, backgrounds, accents)
   - Apply size transformations (spacing, font sizes, icon sizes)
4. **Mutate** (if using random/hybrid mode):
   - Apply 2-6 random mutations from 20+ available operations
   - Mutations are weighted by category (color, size, layout, content, structure)
5. **Validate** using `@widget-factory/validator`:
   - Structural validation (containers, leaves, required props)
   - Component existence check against `@widget-factory/primitives`
   - Compilation check (can it be compiled to JSX?)
6. **Save** unique, valid DSLs; discard invalid or duplicate ones

## Mutation Categories

- **Color Mutations** (25%): Background, text, chart colors
- **Size Mutations** (20%): Font sizes, icon sizes, dimensions
- **Layout Mutations** (20%): Gap, padding, flex, direction, alignment
- **Content Mutations** (15%): Text content, chart data
- **Chart Mutations** (10%): Chart orientations
- **Structure Mutations** (10%): Add/remove/swap nodes, component types

## Performance

- **Generation Rate**: 50-200 DSLs/second
- **Success Rate**: 85-95% valid DSLs
- **Memory Efficient**: Batched output (1000 DSLs per file)
- **Scalable**: Can generate 10,000+ DSLs in minutes

## Configuration

The generator can be configured by editing the JSON configuration files:

- **Palette**: Add new colors, icons, text content, component types
- **Rulebook**: Adjust validation rules and constraints
- **Mutation Weights**: Change the distribution of mutation types

## Validation

The generator now uses the standardized `@widget-factory/validator` for all validation:

```javascript
import { validate } from '@widget-factory/validator';

// In the generator
isValid(dsl) {
  const result = validate(dsl);
  return result.canCompile;  // True if no critical errors
}
```

**Benefits:**
- ✅ Same validator used across the entire codebase
- ✅ Component registry check against `@widget-factory/primitives`
- ✅ Proper Icon/Image validation (requires `name`/`src`)
- ✅ Warnings don't prevent compilation
- ✅ Auto-fix capabilities available if needed

## Integration

### With Renderer

```javascript
import DSLDiversityGenerator from './libs/js/mutator/dsl-generator.js';
import {
  initializeRenderer,
  renderWidget,
  saveImage,
  closeRenderer
} from '@widget-factory/renderer';

// Generate DSLs
const generator = new DSLDiversityGenerator();
await generator.initialize();
await generator.generate(100);

// Render them
await initializeRenderer();

// Load and render generated DSLs
const batchPath = './libs/js/mutator/results/[RUN-ID]/batch-001.json';
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

for (const item of batch) {
  const result = await renderWidget(item.resultDSL);
  if (result.success) {
    await saveImage(result.imageBuffer, `output/${item.id}.png`);
  }
}

await closeRenderer();
```

### For ML Training

```javascript
// Load generated DSLs
import fs from 'fs';
import path from 'path';

const batchFiles = fs.readdirSync('./.artifacts/synthetic-dsls')
  .filter(f => f.startsWith('batch-') && f.endsWith('.json'));

const allDSLs = [];
for (const file of batchFiles) {
  const content = fs.readFileSync(path.join('./.artifacts/synthetic-dsls', file), 'utf8');
  const batch = JSON.parse(content);
  allDSLs.push(...batch.map(item => item.dsl));
}

console.log(`Loaded ${allDSLs.length} DSL examples for training`);
```

### For Validation Testing

```javascript
import { compileWidgetDSLToJSX } from './libs/packages/compiler/src/compiler.js';

let successCount = 0;
for (const dsl of allDSLs.slice(0, 100)) {
  try {
    const jsx = compileWidgetDSLToJSX(dsl);
    successCount++;
  } catch (error) {
    console.error('Compilation error:', error.message);
  }
}

console.log(`Compilation success rate: ${successCount}/${100}`);
```

## Troubleshooting

### Common Issues

1. **"none is not defined" error** - Fixed by using numeric flex values instead of string "none"
2. **Low success rate** - Check if seed DSLs are valid and palette constraints are reasonable
3. **Memory issues** - Generate in smaller batches or clear generated DSLs set periodically

### Debug Mode

Add logging to see detailed mutation process:

```javascript
// In dsl-generator.js, modify mutate() method:
console.log(`Applying ${numMutations} mutations to DSL...`);
for (let i = 0; i < numMutations; i++) {
  const mutation = this.selectMutation();
  console.log(`  Mutation ${i + 1}: ${mutation.operation}`);
  this.applyMutation(mutant, mutation);
}
```

## Architecture

```
libs/js/mutator/
├── dsl-generator.js              # Core mutator class
├── generate-dsl-diversity.js     # CLI interface
├── dsl-mutation-palette.json     # Mutation values
├── dsl-validation-rulebook.json  # Validation rules
└── README.md                     # This file

Input:
├── apps/playground/src/examples/ # Seed DSL examples
└── .artifacts/                  # Configuration files

Output:
└── libs/js/mutator/results/      # Generated DSL batches
```