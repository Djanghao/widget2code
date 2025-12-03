/**
 * @file batch-generator.js
 * @description Batch generation utilities for VQA datasets
 */

import { generateAllVQA } from './vqa-generator.js';
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
 * Write VQA pairs to JSON array file
 */
async function writeJSON(filePath, vqaPairs) {
  await fs.writeFile(filePath, JSON.stringify(vqaPairs, null, 2), 'utf-8');
}

/**
 * Count items in a JSON array file
 */
async function countJSONItems(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Create a hash for a VQA pair to detect duplicates
 * Hash is based on question + answer content (excluding image path)
 */
function hashVQAPair(vqaPair) {
  // Extract question and answer from messages
  const question = vqaPair.messages[0]?.content || '';
  const answer = vqaPair.messages[1]?.content || '';

  // Create a stable string representation
  const hashInput = JSON.stringify({ question, answer });

  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Load existing VQA dataset and build a hash set for deduplication
 * @param {string} avoidFilePath - Path to existing combined.json to avoid
 * @returns {Set<string>} Set of hashes from existing dataset
 */
async function loadExistingHashes(avoidFilePath) {
  const hashes = new Set();

  try {
    const content = await fs.readFile(avoidFilePath, 'utf-8');
    const existingData = JSON.parse(content);

    if (!Array.isArray(existingData)) {
      console.warn(`⚠️  Avoid file ${avoidFilePath} is not a valid JSON array`);
      return hashes;
    }

    for (const item of existingData) {
      const hash = hashVQAPair(item);
      hashes.add(hash);
    }

    console.log(`📋 Loaded ${hashes.size.toLocaleString()} hashes from existing dataset`);
  } catch (error) {
    console.warn(`⚠️  Could not load avoid file ${avoidFilePath}: ${error.message}`);
  }

  return hashes;
}

/**
 * Filter out VQA pairs that already exist in the avoid set
 * @param {Array} vqaPairs - Array of VQA pairs to filter
 * @param {Set<string>} avoidHashes - Set of hashes to avoid
 * @returns {Object} { filtered, duplicateCount }
 */
function filterDuplicates(vqaPairs, avoidHashes) {
  if (avoidHashes.size === 0) {
    return { filtered: vqaPairs, duplicateCount: 0 };
  }

  const filtered = [];
  let duplicateCount = 0;

  for (const pair of vqaPairs) {
    const hash = hashVQAPair(pair);
    if (!avoidHashes.has(hash)) {
      filtered.push(pair);
    } else {
      duplicateCount++;
    }
  }

  return { filtered, duplicateCount };
}

/**
 * Sample VQA pairs with a 4:3:2 ratio (referring:grounding:layout)
 * WITHOUT repeating any pairs - uses the smallest category as the limiting factor
 * Optionally limits the total combined size
 * @param {Array} referring - Referring VQA pairs
 * @param {Array} grounding - Grounding VQA pairs
 * @param {Array} layout - Layout VQA pairs
 * @param {number} targetSize - Optional target size for combined dataset
 * @returns {Array} Randomly sampled combined array
 */
function sampleWithRatio(referring, grounding, layout, targetSize = null) {
  // Randomly sample from each array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Handle case where layout is empty - use 1:1 ratio instead
  if (layout.length === 0) {
    console.log('⚠️  No layout pairs available, using 1:1 ratio (referring:grounding)');

    let limitingFactor;
    if (targetSize !== null && targetSize > 0) {
      // For 1:1 ratio, split target evenly
      limitingFactor = Math.floor(targetSize / 2);
      // But don't exceed available data
      limitingFactor = Math.min(limitingFactor, referring.length, grounding.length);
    } else {
      // Use minimum of available data
      limitingFactor = Math.min(referring.length, grounding.length);
    }

    const sampledReferring = shuffleArray(referring).slice(0, limitingFactor);
    const sampledGrounding = shuffleArray(grounding).slice(0, limitingFactor);

    const combined = [...sampledReferring, ...sampledGrounding];
    return shuffleArray(combined);
  }

  // 4:3:2 ratio logic - use ALL categories as limiting factors (no repetition)
  const referringLimit = referring.length / 4;
  const groundingLimit = grounding.length / 3;
  const layoutLimit = layout.length / 2;

  // Find the minimum limiting factor (considering all three)
  let limitingFactor = Math.min(referringLimit, groundingLimit, layoutLimit);

  // If targetSize is specified, adjust limiting factor
  if (targetSize !== null && targetSize > 0) {
    const targetLimitingFactor = targetSize / 9; // 4+3+2 = 9
    limitingFactor = Math.min(limitingFactor, targetLimitingFactor);
  }

  // Calculate how many samples to take from each (without repetition)
  const referringCount = Math.floor(limitingFactor * 4);
  const groundingCount = Math.floor(limitingFactor * 3);
  const layoutCount = Math.floor(limitingFactor * 2);

  const sampledReferring = shuffleArray(referring).slice(0, referringCount);
  const sampledGrounding = shuffleArray(grounding).slice(0, groundingCount);
  const sampledLayout = shuffleArray(layout).slice(0, layoutCount);

  console.log(`📊 Sampling: ${referringCount} referring + ${groundingCount} grounding + ${layoutCount} layout`);

  // Combine and shuffle the result
  const combined = [...sampledReferring, ...sampledGrounding, ...sampledLayout];
  return shuffleArray(combined);
}

/**
 * Main batch VQA generation function
 * @param {string} inputPath - Directory containing widget subdirectories
 * @param {Object} options - Configuration options
 * @param {string} options.outputDir - Output directory for VQA dataset files
 * @param {string} options.datasetRoot - Root directory for calculating relative image paths
 * @param {string} options.continueFrom - Widget ID to continue from (for resuming)
 * @param {string} options.avoidFile - Path to existing dataset to avoid duplicates
 * @param {number} options.targetSize - Target size for combined dataset
 * @param {string} options.widgetListPath - Path to file containing widget IDs to process
 * @returns {Promise<Object>} { processedCount, failedCount, totalDuplicates }
 */
export async function batchGenerateVQA(inputPath, options = {}) {
  const {
    outputDir = path.join(inputPath, 'vqa-dataset'),
    datasetRoot = inputPath,
    continueFrom = null,
    avoidFile = null,
    targetSize = null,
    widgetListPath = null
  } = options;

  console.log('🎯 Widget Factory - VQA Dataset Generator');
  console.log('==========================================\n');

  // Load existing hashes if avoidFile is specified
  let avoidHashes = new Set();
  if (avoidFile) {
    console.log(`🔍 Loading existing dataset to avoid duplicates: ${avoidFile}\n`);
    avoidHashes = await loadExistingHashes(avoidFile);
  }

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

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Output file paths
  const referringFile = path.join(outputDir, 'referring.json');
  const groundingFile = path.join(outputDir, 'grounding.json');
  const layoutFile = path.join(outputDir, 'layout.json');
  const combinedFile = path.join(outputDir, 'combined.json');

  // Initialize files (or count existing items if continuing)
  let startIndex = 0;
  if (continueFrom) {
    const existingItems = await countJSONItems(combinedFile);
    console.log(`📝 Continuing from item ${existingItems}, starting at widget ${continueFrom}`);
    startIndex = widgets.findIndex(w => w.widgetId === continueFrom);
    if (startIndex === -1) {
      console.error(`❌ Widget ${continueFrom} not found`);
      return { processedCount: 0, failedCount: 1 };
    }
  } else {
    // Clear existing files
    await writeJSON(referringFile, []);
    await writeJSON(groundingFile, []);
    await writeJSON(layoutFile, []);
    await writeJSON(combinedFile, []);
  }

  // Process widgets - collect all VQA pairs first
  let processedCount = 0;
  let failedCount = 0;
  let allReferring = [];
  let allGrounding = [];
  let allLayout = [];
  let totalDuplicates = 0;

  for (let i = startIndex; i < widgets.length; i++) {
    const widget = widgets[i];
    const widgetNum = i + 1;

    try {
      console.log(`[${widgetNum}/${widgets.length}] Processing ${widget.widgetId}...`);

      // Load widget data
      const data = await loadWidgetData(widget);

      // Generate VQA pairs
      const vqaData = generateAllVQA({
        boundingBoxData: data.boundingBoxData,
        dsl: data.dsl,
        layoutCode: data.layoutCode,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        imagePath: widget.imagePath
      });

      // Filter duplicates if avoidFile is specified
      const referringResult = filterDuplicates(vqaData.referring, avoidHashes);
      const groundingResult = filterDuplicates(vqaData.grounding, avoidHashes);
      const layoutResult = filterDuplicates(vqaData.layout, avoidHashes);

      const widgetDuplicates = referringResult.duplicateCount +
                               groundingResult.duplicateCount +
                               layoutResult.duplicateCount;
      totalDuplicates += widgetDuplicates;

      // Collect filtered pairs
      allReferring.push(...referringResult.filtered);
      allGrounding.push(...groundingResult.filtered);
      allLayout.push(...layoutResult.filtered);

      const logMsg = `  ✓ Generated ${referringResult.filtered.length} referring + ${groundingResult.filtered.length} grounding + ${layoutResult.filtered.length} layout`;
      if (widgetDuplicates > 0) {
        console.log(logMsg + ` (${widgetDuplicates} duplicates filtered)`);
      } else {
        console.log(logMsg);
      }

      processedCount++;

    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
      failedCount++;
    }
  }

  // Write individual files
  await writeJSON(referringFile, allReferring);
  await writeJSON(groundingFile, allGrounding);
  await writeJSON(layoutFile, allLayout);

  // Sample with 4:3:2 ratio and write combined file
  const sampledCombined = sampleWithRatio(allReferring, allGrounding, allLayout, targetSize);
  await writeJSON(combinedFile, sampledCombined);

  // Print summary
  console.log('\n==========================================');
  console.log('📊 Generation Summary');
  console.log('==========================================');
  console.log(`✅ Successfully processed: ${processedCount}/${widgets.length} widgets`);
  if (failedCount > 0) {
    console.log(`❌ Failed: ${failedCount} widgets`);
  }

  if (totalDuplicates > 0) {
    console.log(`🔄 Duplicates filtered: ${totalDuplicates.toLocaleString()} pairs`);
  }

  console.log(`\n📝 Total VQA pairs generated (after filtering):`);
  console.log(`   Referring:  ${allReferring.length.toLocaleString()}`);
  console.log(`   Grounding:  ${allGrounding.length.toLocaleString()}`);
  console.log(`   Layout:     ${allLayout.length.toLocaleString()}`);
  console.log(`   Total:      ${(allReferring.length + allGrounding.length + allLayout.length).toLocaleString()}`);

  const ratioUsed = allLayout.length === 0 ? '1:1 (referring:grounding)' : '4:3:2 (referring:grounding:layout)';
  console.log(`\n📝 Combined dataset (${ratioUsed}):`);
  console.log(`   Total:      ${sampledCombined.length.toLocaleString()} pairs`);
  if (targetSize) {
    console.log(`   Target:     ${targetSize.toLocaleString()} pairs`);
  }
  console.log(`\n📁 Output files:`);
  console.log(`   ${referringFile}`);
  console.log(`   ${groundingFile}`);
  console.log(`   ${layoutFile}`);
  console.log(`   ${combinedFile}`);

  return { processedCount, failedCount, totalDuplicates };
}
