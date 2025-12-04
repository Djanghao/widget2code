/**
 * @file batch-generator-split.js
 * @description Batch VQA generation with train/val/test split (7:1:2)
 * Generates VQA pairs with specific task distribution:
 * - 60% General Grounding (all bboxes sorted by type)
 * - 10% Category-specific Grounding (specific component types)
 * - 20% Referring (box-to-text)
 * - 10% Layout (image-to-code)
 */

import {
  generateReferringVQA,
  generateGeneralGroundingVQA,
  generateCategoryGroundingVQA,
  generateLayoutVQA
} from './vqa-generator.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Load widget IDs from a text file (one per line, ignoring non-widget lines)
 */
async function loadWidgetList(widgetListPath) {
  const content = await fs.readFile(widgetListPath, 'utf-8');
  const lines = content.split('\n');
  const widgetIds = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    // Only include lines that look like widget IDs
    if (trimmed.startsWith('widget-')) {
      widgetIds.add(trimmed);
    }
  }

  console.log(`📋 Loaded ${widgetIds.size} widget IDs from ${widgetListPath}`);
  return widgetIds;
}

/**
 * Find widgets with complete rendering data (DSL, bounding boxes, images, layout)
 */
async function findWidgetsWithData(inputPath, options = {}) {
  const { datasetRoot, widgetListPath } = options;
  const stats = await fs.stat(inputPath);

  if (!stats.isDirectory()) {
    throw new Error('Input must be a directory containing widget subdirectories');
  }

  // Load widget list filter if provided
  let widgetFilter = null;
  if (widgetListPath) {
    widgetFilter = await loadWidgetList(widgetListPath);
  }

  const entries = await fs.readdir(inputPath, { withFileTypes: true });
  const widgets = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const widgetDir = path.join(inputPath, entry.name);
    const widgetId = entry.name;

    // Skip if not in widget filter list
    if (widgetFilter && !widgetFilter.has(widgetId)) {
      continue;
    }

    // Check for required files
    const dslFile = path.join(widgetDir, 'artifacts', '4-dsl', 'widget.json');
    const bboxFile = path.join(widgetDir, 'artifacts', '6-rendering', '6.4-bounding-boxes.json');
    const imageFile = path.join(widgetDir, 'output.png');
    const layoutFile = path.join(widgetDir, 'artifacts', '5-compilation', 'layout.jsx');

    const dslExists = await fs.access(dslFile).then(() => true).catch(() => false);
    const bboxExists = await fs.access(bboxFile).then(() => true).catch(() => false);
    const imageExists = await fs.access(imageFile).then(() => true).catch(() => false);
    const layoutExists = await fs.access(layoutFile).then(() => true).catch(() => false);

    if (dslExists && bboxExists && imageExists) {
      // Calculate relative image path from dataset root
      const relativePath = datasetRoot
        ? path.relative(datasetRoot, imageFile)
        : path.join(widgetId, 'output.png');

      widgets.push({
        widgetId,
        widgetDir,
        dslFile,
        bboxFile,
        imageFile,
        layoutFile: layoutExists ? layoutFile : null,
        imagePath: relativePath
      });
    }
  }

  return widgets;
}

/**
 * Load widget data (DSL, bounding boxes, layout code, image dimensions)
 */
async function loadWidgetData(widget) {
  const dsl = JSON.parse(await fs.readFile(widget.dslFile, 'utf-8'));
  const boundingBoxData = JSON.parse(await fs.readFile(widget.bboxFile, 'utf-8'));

  // Load layout.jsx if it exists
  let layoutCode = null;
  if (widget.layoutFile) {
    try {
      layoutCode = await fs.readFile(widget.layoutFile, 'utf-8');
    } catch (error) {
      // Layout file missing or unreadable
      layoutCode = null;
    }
  }

  // Get image dimensions from DSL
  const imageWidth = dsl.widget.width;
  const imageHeight = dsl.widget.height;

  if (!imageWidth || !imageHeight) {
    throw new Error(`Widget ${widget.widgetId}: Missing width/height in DSL`);
  }

  return {
    dsl,
    boundingBoxData,
    layoutCode,
    imageWidth,
    imageHeight
  };
}

/**
 * Split widgets into train/val/test sets (7:1:2)
 */
function splitWidgets(widgets, seed = 42) {
  // Shuffle widgets deterministically
  const shuffled = [...widgets];
  const rng = seedRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Calculate split points (7:1:2 = 70%:10%:20%)
  const total = shuffled.length;
  const trainCount = Math.floor(total * 0.7);
  const valCount = Math.floor(total * 0.1);

  return {
    train: shuffled.slice(0, trainCount),
    val: shuffled.slice(trainCount, trainCount + valCount),
    test: shuffled.slice(trainCount + valCount)
  };
}

/**
 * Simple seeded random number generator
 */
function seedRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Write VQA pairs to JSON array file
 */
async function writeJSON(filePath, vqaPairs) {
  await fs.writeFile(filePath, JSON.stringify(vqaPairs, null, 2), 'utf-8');
}

/**
 * Add task type and origin metadata to VQA pairs
 */
function addMetadata(pairs, taskType, widgetId) {
  return pairs.map(pair => ({
    ...pair,
    task: taskType,
    origin: widgetId
  }));
}

/**
 * Sample VQA pairs to achieve target distribution
 * Target: 60% general grounding, 10% category grounding, 20% referring, 10% layout
 */
function sampleWithDistribution(generalGrounding, categoryGrounding, referring, layout) {
  // Shuffle arrays
  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Calculate limiting factor based on target ratios
  // If we want 60% general, 10% category, 20% referring, 10% layout
  // Total = 100%, so if we have G general grounding pairs:
  // - general: G pairs (60%)
  // - category: G * (10/60) pairs (10%)
  // - referring: G * (20/60) pairs (20%)
  // - layout: G * (10/60) pairs (10%)

  const generalLimit = generalGrounding.length;
  const categoryLimit = categoryGrounding.length / (10/60);
  const referringLimit = referring.length / (20/60);
  const layoutLimit = layout.length > 0 ? layout.length / (10/60) : Infinity;

  const limitingFactor = Math.min(generalLimit, categoryLimit, referringLimit, layoutLimit);

  // Calculate counts for each type
  const generalCount = Math.floor(limitingFactor);
  const categoryCount = Math.floor(limitingFactor * (10/60));
  const referringCount = Math.floor(limitingFactor * (20/60));
  const layoutCount = layout.length > 0 ? Math.floor(limitingFactor * (10/60)) : 0;

  // Sample from each array
  const sampledGeneral = shuffle(generalGrounding).slice(0, generalCount);
  const sampledCategory = shuffle(categoryGrounding).slice(0, categoryCount);
  const sampledReferring = shuffle(referring).slice(0, referringCount);
  const sampledLayout = shuffle(layout).slice(0, layoutCount);

  console.log(`📊 Sampled: ${generalCount} general + ${categoryCount} category + ${referringCount} referring + ${layoutCount} layout`);

  // Combine and shuffle
  const combined = [...sampledGeneral, ...sampledCategory, ...sampledReferring, ...sampledLayout];
  return shuffle(combined);
}

/**
 * Process a single split (train/val/test)
 */
async function processSplit(widgets, splitName, outputDir) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing ${splitName.toUpperCase()} split (${widgets.length} widgets)`);
  console.log('='.repeat(60));

  let processedCount = 0;
  let failedCount = 0;

  // Collect all VQA pairs
  let allGeneralGrounding = [];
  let allCategoryGrounding = [];
  let allReferring = [];
  let allLayout = [];

  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i];
    const widgetNum = i + 1;

    try {
      console.log(`[${widgetNum}/${widgets.length}] Processing ${widget.widgetId}...`);

      // Load widget data
      const data = await loadWidgetData(widget);

      // Generate VQA pairs
      const generalGrounding = generateGeneralGroundingVQA({
        boundingBoxData: data.boundingBoxData,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        imagePath: widget.imagePath
      });

      const categoryGrounding = generateCategoryGroundingVQA({
        boundingBoxData: data.boundingBoxData,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        imagePath: widget.imagePath
      });

      const referring = generateReferringVQA({
        boundingBoxData: data.boundingBoxData,
        dsl: data.dsl,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        imagePath: widget.imagePath
      });

      const layout = data.layoutCode ? generateLayoutVQA({
        layoutCode: data.layoutCode,
        imagePath: widget.imagePath
      }) : [];

      // Add metadata with task type and origin
      allGeneralGrounding.push(...addMetadata(generalGrounding, 'general_grounding', widget.widgetId));
      allCategoryGrounding.push(...addMetadata(categoryGrounding, 'category_grounding', widget.widgetId));
      allReferring.push(...addMetadata(referring, 'referring', widget.widgetId));
      allLayout.push(...addMetadata(layout, 'layout', widget.widgetId));

      console.log(`  ✓ Generated ${generalGrounding.length} general + ${categoryGrounding.length} category + ${referring.length} referring + ${layout.length} layout`);

      processedCount++;

    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
      failedCount++;
    }
  }

  // Write individual task files
  const generalFile = path.join(outputDir, `general_grounding_${splitName}.json`);
  const categoryFile = path.join(outputDir, `category_grounding_${splitName}.json`);
  const referringFile = path.join(outputDir, `referring_${splitName}.json`);
  const layoutFile = path.join(outputDir, `layout_${splitName}.json`);
  const combinedFile = path.join(outputDir, `combined_${splitName}.json`);

  await writeJSON(generalFile, allGeneralGrounding);
  await writeJSON(categoryFile, allCategoryGrounding);
  await writeJSON(referringFile, allReferring);
  await writeJSON(layoutFile, allLayout);

  // Sample with distribution and write combined file
  const combined = sampleWithDistribution(
    allGeneralGrounding,
    allCategoryGrounding,
    allReferring,
    allLayout
  );
  await writeJSON(combinedFile, combined);

  // Print summary
  console.log(`\n📊 ${splitName.toUpperCase()} Summary:`);
  console.log(`✅ Successfully processed: ${processedCount}/${widgets.length} widgets`);
  if (failedCount > 0) {
    console.log(`❌ Failed: ${failedCount} widgets`);
  }
  console.log(`\n📝 Total VQA pairs generated:`);
  console.log(`   General Grounding:  ${allGeneralGrounding.length.toLocaleString()}`);
  console.log(`   Category Grounding: ${allCategoryGrounding.length.toLocaleString()}`);
  console.log(`   Referring:          ${allReferring.length.toLocaleString()}`);
  console.log(`   Layout:             ${allLayout.length.toLocaleString()}`);
  console.log(`   Total:              ${(allGeneralGrounding.length + allCategoryGrounding.length + allReferring.length + allLayout.length).toLocaleString()}`);
  console.log(`\n📝 Combined dataset (60%:10%:20%:10%):`);
  console.log(`   Total:              ${combined.length.toLocaleString()} pairs`);

  return {
    processedCount,
    failedCount,
    stats: {
      generalGrounding: allGeneralGrounding.length,
      categoryGrounding: allCategoryGrounding.length,
      referring: allReferring.length,
      layout: allLayout.length,
      combined: combined.length
    }
  };
}

/**
 * Main batch VQA generation function with train/val/test split
 */
export async function batchGenerateVQAWithSplit(inputPath, options = {}) {
  const {
    outputDir = './results/vqa-dataset-v3',
    datasetRoot = inputPath,
    widgetListPath = null,
    seed = 42
  } = options;

  console.log('🎯 Widget Factory - VQA Dataset Generator (Split Mode)');
  console.log('='.repeat(60));
  console.log('Distribution: 60% general grounding, 10% category grounding, 20% referring, 10% layout');
  console.log('Split: 7:1:2 (train:val:test)');
  console.log('='.repeat(60) + '\n');

  // Find widgets
  console.log(`📂 Scanning for widgets in: ${inputPath}`);
  if (widgetListPath) {
    console.log(`📝 Filtering by widget list: ${widgetListPath}`);
  }
  const widgets = await findWidgetsWithData(inputPath, { datasetRoot, widgetListPath });

  if (widgets.length === 0) {
    console.log('⚠️  No widgets found with complete rendering data (DSL + bounding boxes + image)');
    console.log('   Run batch-render first to generate required data');
    return { processedCount: 0, failedCount: 0 };
  }

  console.log(`✅ Found ${widgets.length} widget(s) with complete data\n`);

  // Split widgets into train/val/test
  console.log('📊 Splitting widgets...');
  const splits = splitWidgets(widgets, seed);
  console.log(`   Train: ${splits.train.length} widgets (${(splits.train.length/widgets.length*100).toFixed(1)}%)`);
  console.log(`   Val:   ${splits.val.length} widgets (${(splits.val.length/widgets.length*100).toFixed(1)}%)`);
  console.log(`   Test:  ${splits.test.length} widgets (${(splits.test.length/widgets.length*100).toFixed(1)}%)`);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Process each split
  const results = {};
  for (const [splitName, splitWidgets] of Object.entries(splits)) {
    results[splitName] = await processSplit(splitWidgets, splitName, outputDir);
  }

  // Print final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total widgets processed: ${widgets.length}`);
  console.log(`\nDataset split:`);
  console.log(`   Train: ${splits.train.length} widgets → ${results.train.stats.combined} combined pairs`);
  console.log(`   Val:   ${splits.val.length} widgets → ${results.val.stats.combined} combined pairs`);
  console.log(`   Test:  ${splits.test.length} widgets → ${results.test.stats.combined} combined pairs`);
  console.log(`\n📁 Output directory: ${outputDir}`);
  console.log('\nGenerated files:');
  for (const split of ['train', 'val', 'test']) {
    console.log(`   general_grounding_${split}.json`);
    console.log(`   category_grounding_${split}.json`);
    console.log(`   referring_${split}.json`);
    console.log(`   layout_${split}.json`);
    console.log(`   combined_${split}.json`);
  }

  return results;
}
