# DSL Mutator

This directory contains the DSL Diversity Mutator system for creating synthetic widget DSL examples.

## Files Overview

```
libs/js/mutator/
  src/
    index.js                     # Public API exports
    orchestrator.js              # DSLMutator class (main coordinator)
    mutators/
      random-mutator.js          # Random mutations (40+ methods)
      theme-mutator.js           # Theme/size transformations
    config/
      index.js                   # Config loader
    utils/
      helpers.js                 # selectFromArray, adjustColor, hashDSL
      tree-traversal.js          # traverseDSL, collect* methods
      node-finders.js            # find* target methods
      node-generators.js         # generate* methods
    persistence/
      batch-writer.js            # saveDSL, generateReport
  config/
    dsl-mutation-palette.json    # Palette of valid values for mutations
    dsl-validation-rulebook.json # Fast validation rules
  generate-dsl-diversity.js      # CLI script for running the mutator
```

## Quick Start

```bash
# Generate 10,000 random DSL variations (default)
node libs/js/mutator/generate-dsl-diversity.js

# Generate 100 random DSLs
node libs/js/mutator/generate-dsl-diversity.js 100

# Generate 100 DSLs with all 5 theme variants (500 total)
node libs/js/mutator/generate-dsl-diversity.js 100 --vary themes

# Show help
node libs/js/mutator/generate-dsl-diversity.js --help
```

## Usage

```
Usage: node generate-dsl-diversity.js [count] [options]

Arguments:
  count                    Number of base DSLs to generate (default: 10000)

Options:
  --vary [type]            Generate theme/size variants
                           themes  - 5 theme variants per DSL
                           sizes   - 3 size variants per DSL
                           all     - 15 variants (5 themes x 3 sizes) per DSL
  -n, --count <number>     Alias for count argument
  -h, --help               Show this help message
```

### Examples

```bash
node generate-dsl-diversity.js 100                 # 100 random DSLs
node generate-dsl-diversity.js 100 --vary themes   # 500 DSLs (100 x 5 themes)
node generate-dsl-diversity.js 100 --vary sizes    # 300 DSLs (100 x 3 sizes)
node generate-dsl-diversity.js 100 --vary all      # 1500 DSLs (100 x 5 x 3)
node generate-dsl-diversity.js 100 --vary          # same as --vary all
```

### Programmatic Usage

```javascript
import { DSLMutator } from '@widget-factory/mutator';

const mutator = new DSLMutator();
await mutator.initialize();

// Random generation
await mutator.generate(5000);

// Controlled generation with theme/size
await mutator.generateWithControlled(100, {
  themes: ['dark', 'light'],
  sizes: ['compact', 'large'],
  mode: 'hybrid'
});

await mutator.generateReport();
```

## Output

Generated DSLs are saved to `output/2-mutator/batch-generated/[RUN-ID]/` with unique batch files and full tracking:

```
output/2-mutator/batch-generated/
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

1. **Load** existing valid DSLs as seed data from `output/2-mutator/seeds/`
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
import { DSLMutator } from '@widget-factory/mutator';
import {
  initializeRenderer,
  renderWidget,
  saveImage,
  closeRenderer
} from '@widget-factory/renderer';

// Generate DSLs
const mutator = new DSLMutator();
await mutator.initialize();
await mutator.generate(100);

// Render them
await initializeRenderer();

// Load and render generated DSLs
const batchPath = './output/2-mutator/batch-generated/[RUN-ID]/[RUN-ID]-batch-001.json';
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
import fs from 'fs';
import path from 'path';

const runDir = './output/2-mutator/batch-generated/[RUN-ID]';
const batchFiles = fs.readdirSync(runDir)
  .filter(f => f.includes('-batch-') && f.endsWith('.json'));

const allDSLs = [];
for (const file of batchFiles) {
  const content = fs.readFileSync(path.join(runDir, file), 'utf8');
  const batch = JSON.parse(content);
  allDSLs.push(...batch.map(item => item.resultDSL));
}

console.log(`Loaded ${allDSLs.length} DSL examples for training`);
```

### For Validation Testing

```javascript
import { compileWidgetDSLToJSX } from './libs/js/compiler/src/compiler.js';

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
// In src/mutators/random-mutator.js, modify mutate() method:
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
├── src/
│   ├── index.js                  # Public API exports
│   ├── orchestrator.js           # DSLMutator class (main coordinator)
│   ├── mutators/
│   │   ├── random-mutator.js     # Random mutations (40+ methods)
│   │   └── theme-mutator.js      # Theme/size transformations
│   ├── config/
│   │   └── index.js              # Config loader
│   ├── utils/
│   │   ├── helpers.js            # selectFromArray, adjustColor, hashDSL
│   │   ├── tree-traversal.js     # traverseDSL, collect* methods
│   │   ├── node-finders.js       # find* target methods
│   │   └── node-generators.js    # generate* methods
│   └── persistence/
│       └── batch-writer.js       # saveDSL, generateReport
├── config/
│   ├── dsl-mutation-palette.json # Mutation values
│   └── dsl-validation-rulebook.json # Validation rules
├── generate-dsl-diversity.js     # CLI interface
└── README.md                     # This file

Input:
├── output/2-mutator/seeds/       # Seed DSL examples

Output:
└── output/2-mutator/batch-generated/ # Generated DSL batches
```