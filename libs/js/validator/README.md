# @widget-factory/validator

Widget DSL validation and auto-fix utilities.

## Installation

This is an internal package. Import it using the workspace protocol:

```json
{
  "dependencies": {
    "@widget-factory/validator": "*"
  }
}
```

## Basic Usage

### Simple Validation

```javascript
import { validate } from '@widget-factory/validator';

const widgetSpec = {
  widget: {
    backgroundColor: '#ffffff',
    root: {
      type: 'container',
      children: [
        {
          type: 'leaf',
          component: 'Text',
          content: 'Hello World'
        }
      ]
    }
  }
};

const result = validate(widgetSpec);

if (result.canCompile) {
  console.log('✓ Widget is valid and can be compiled');
} else {
  console.error('✗ Validation failed:');
  console.error('Errors:', result.errors);
  console.error('Warnings:', result.warnings);
}
```

### Validation with Auto-Fix

```javascript
import { validateAndFixDSL } from '@widget-factory/validator';

const result = validateAndFixDSL(widgetSpec);

if (result.canCompile) {
  console.log('✓ Widget is valid (or was fixed)');

  if (result.changes && result.changes.length > 0) {
    console.log('Applied fixes:');
    result.changes.forEach(change => console.log('-', change));
  }

  // Use the fixed spec
  const fixedSpec = result.fixed;
} else {
  console.error('✗ Could not fix widget:');
  console.error('Errors:', result.errors);
}
```

## API Reference

### Core Functions

#### `validate(spec)`

Validate a widget DSL specification.

**Parameters:**
- `spec` (Object): Widget DSL specification

**Returns:** `Object` with:
- `valid` (boolean): Whether the spec is fully valid
- `canCompile` (boolean): Whether the spec can be compiled (no critical errors)
- `errors` (Array<string>): List of validation errors
- `warnings` (Array<string>): List of validation warnings

#### `fix(spec)`

Attempt to fix validation issues in a widget DSL specification.

**Parameters:**
- `spec` (Object): Widget DSL specification

**Returns:** `Object` with:
- `fixed` (Object): Fixed widget specification
- `changes` (Array<string>): List of changes made

#### `validateAndFixDSL(spec)`

Validate and fix a widget DSL specification in one call.

**Parameters:**
- `spec` (Object): Widget DSL specification

**Returns:** `Object` with:
- `original` (Object): Original validation result
- `fixed` (Object): Fixed widget specification
- `changes` (Array<string>): List of changes made
- `canCompile` (boolean): Whether the fixed spec can be compiled
- `errors` (Array<string>): Remaining validation errors
- `warnings` (Array<string>): Validation warnings

### Utility Functions

#### `canCompile(spec)`

Check if a DSL spec can be compiled.

**Parameters:**
- `spec` (Object): Widget DSL specification

**Returns:** `boolean` - True if the spec can be compiled

#### `getValidationReport(spec)`

Get a detailed validation report.

**Parameters:**
- `spec` (Object): Widget DSL specification

**Returns:** `Object` with:
- `timestamp` (string): ISO timestamp
- `spec` (Object): The validated spec
- `validation` (Object): Validation result
- `summary` (Object): Summary with counts

#### `validateWithSuggestions(spec)`

Validate and get suggestions for fixing issues.

**Parameters:**
- `spec` (Object): Widget DSL specification

**Returns:** `Object` with validation result plus:
- `suggestions` (Array<Object>): List of suggestions for fixing issues

### Batch Operations

#### `batchValidate(specs)`

Validate multiple DSL specifications.

**Parameters:**
- `specs` (Array<Object>): Array of widget DSL specifications

**Returns:** `Array<Object>` - Array of validation results with index

#### `batchValidateAndFix(specs)`

Validate and fix multiple DSL specifications.

**Parameters:**
- `specs` (Array<Object>): Array of widget DSL specifications

**Returns:** `Array<Object>` - Array of validation and fix results with index

## Advanced Usage

### Runtime Widget Validation

```javascript
import { validateRenderedWidget } from '@widget-factory/validator';

// Validate a widget object at runtime (not DSL)
const widgetObject = /* rendered widget */;
const result = validateRenderedWidget(widgetObject);
```

## Example: DSL Mutator Integration

```javascript
import DSLDiversityGenerator from './libs/js/mutator/dsl-generator.js';
import { validate, batchValidate } from '@widget-factory/validator';

const generator = new DSLDiversityGenerator();
await generator.initialize();

// The generator now uses validateWidgetDSL internally
await generator.generate(1000);

// You can also validate generated DSLs manually
const generatedDSLs = /* get from generator results */;
const validationResults = batchValidate(generatedDSLs);

const validCount = validationResults.filter(r => r.canCompile).length;
console.log(`${validCount}/${validationResults.length} DSLs are valid`);
```

## Example: Validation Pipeline

```javascript
import {
  validate,
  validateWithSuggestions,
  validateAndFixDSL
} from '@widget-factory/validator';

function processWidget(spec) {
  // 1. First, try basic validation
  const validation = validate(spec);

  if (validation.canCompile) {
    return { success: true, spec };
  }

  // 2. Get suggestions for manual review
  const withSuggestions = validateWithSuggestions(spec);
  console.log('Validation failed, here are some suggestions:');
  withSuggestions.suggestions.forEach(s => {
    console.log(`- ${s.type}: ${s.message}`);
    console.log(`  Suggestion: ${s.suggestion}`);
  });

  // 3. Try auto-fix
  const fixed = validateAndFixDSL(spec);

  if (fixed.canCompile) {
    console.log('Widget was auto-fixed:');
    fixed.changes.forEach(change => console.log(`- ${change}`));
    return { success: true, spec: fixed.fixed, wasFixed: true };
  }

  // 4. Failed to fix
  return {
    success: false,
    errors: fixed.errors,
    suggestions: withSuggestions.suggestions
  };
}
```

## Validation Rules

The validator checks for:

1. **Structure:**
   - Spec must be an object with `widget` field
   - Widget must have `root` field
   - All nodes must have `type` field ('container' or 'leaf')

2. **Containers:**
   - Must have `children` array
   - All children must be valid nodes

3. **Leaves:**
   - Must have `component` field
   - Component must be from `@widget-factory/primitives` or a valid Icon/Image
   - Icon components must have `props.name`
   - Image components must have `props.src`

4. **Auto-Fix:**
   - Unknown components → replaced with `Placeholder`
   - Missing `children` on containers → empty array added
   - Missing component on leaf → replaced with Text placeholder
   - Invalid Icon/Image → replaced with Placeholder

## Notes

- Validation is structural and component-based, not visual
- Auto-fix preserves visual properties when replacing components
- The validator uses the actual component registry from `@widget-factory/primitives`
- Warnings don't prevent compilation, but errors do
- Use `canCompile` to check if a spec is usable, not just `valid`
