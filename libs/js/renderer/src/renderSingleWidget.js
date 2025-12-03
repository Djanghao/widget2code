/**
 * @file renderSingleWidget.js
 * @description Unified single widget rendering logic (DSL → JSX → PNG)
 * Core rendering business logic used by CLI commands
 * @author Houston Zhang
 * @date 2025-11-16
 */

import { PlaywrightRenderer } from "./PlaywrightRenderer.js";
import {
  compileWidgetDSLToJSX,
  generateContainerLayout,
} from "@widget-factory/compiler";
import { validateAndFix } from "@widget-factory/validator";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * Render a single widget with complete artifacts and debug information.
 *
 * This function handles the complete rendering pipeline:
 * 1. Load DSL from artifacts/4-dsl/widget.json
 * 2. Validate and compile to JSX
 * 3. Render multiple versions (raw, autoresize, resize)
 * 4. Save all artifacts and update debug.json
 * 5. Write logs
 *
 * @param {Object} renderer - PlaywrightRenderer instance
 * @param {string} widgetDir - Path to widget directory (e.g., results/tmp/image_0001)
 * @param {Object} options - Rendering options
 * @param {boolean} options.force - Force reprocess even if already completed
 * @returns {Object} Result with {success, widgetId, widgetDir, error}
 */
export async function renderSingleWidget(renderer, widgetDir, options = {}) {
  const { force = false } = options;

  // Derive widgetId from directory name
  const widgetId = path.basename(widgetDir);

  // Define all paths
  const dslFile = path.join(widgetDir, "artifacts", "4-dsl", "widget.json");
  const debugPath = path.join(widgetDir, "log", "debug.json");
  const logFilePath = path.join(widgetDir, "log", "log");
  const compilationDir = path.join(widgetDir, "artifacts", "5-compilation");
  const renderingDir = path.join(widgetDir, "artifacts", "6-rendering");
  const jsxPath = path.join(compilationDir, "widget.jsx");
  const outputPngPath = path.join(widgetDir, "output.png");

  // Check if DSL file exists
  const dslExists = await fs
    .access(dslFile)
    .then(() => true)
    .catch(() => false);
  if (!dslExists) {
    const error = `DSL file not found: ${dslFile}`;
    console.error(`[${widgetId}] ✗ ${error}`);
    return { success: false, widgetId, widgetDir, error };
  }

  // Clean up all existing artifacts only if --force is enabled
  if (force) {
    try {
      // Delete output.png if exists
      await fs.unlink(outputPngPath).catch(() => {});

      // Delete compilation artifacts
      await fs
        .rm(compilationDir, { recursive: true, force: true })
        .catch(() => {});

      // Delete rendering artifacts
      await fs
        .rm(renderingDir, { recursive: true, force: true })
        .catch(() => {});
    } catch (error) {
      console.warn(
        `[${widgetId}] Warning: Failed to clean up artifacts: ${error.message}`
      );
    }
  }

  // Create directories
  await fs.mkdir(compilationDir, { recursive: true });
  await fs.mkdir(renderingDir, { recursive: true });

  // Load or initialize debug.json
  let debugData = {
    widgetId,
    steps: {},
    files: {},
    metadata: {
      version: "0.4.0",
      pipeline: "full",
    },
  };

  const debugExists = await fs
    .access(debugPath)
    .then(() => true)
    .catch(() => false);
  if (debugExists) {
    try {
      debugData = JSON.parse(await fs.readFile(debugPath, "utf-8"));
      if (!debugData.steps) debugData.steps = {};
      if (!debugData.files) debugData.files = {};
      if (!debugData.metadata) debugData.metadata = {};
      debugData.metadata.pipeline = "full";
    } catch (error) {
      console.warn(`[${widgetId}] Warning: Failed to read existing debug.json`);
    }
  }

  const compilationStartTime = new Date();

  try {
    console.log(`\n[${widgetId}] Starting compilation and rendering...`);

    // ========== Step 1: Load and Validate DSL ==========
    const spec = JSON.parse(await fs.readFile(dslFile, "utf-8"));

    // Save 1-raw: Original DSL from VLM
    const rawDslPath = path.join(compilationDir, "1-raw.json");
    await fs.writeFile(rawDslPath, JSON.stringify(spec, null, 2), "utf-8");

    const validation = validateAndFix(spec);

    // Save validation changes log
    if (validation.changes && validation.changes.length > 0) {
      const validationChangesPath = path.join(
        compilationDir,
        "validation-changes.json"
      );
      await fs.writeFile(
        validationChangesPath,
        JSON.stringify(
          {
            changes: validation.changes,
            warnings: validation.warnings || [],
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf-8"
      );

      console.log(
        `[${widgetId}] ⚠️  Auto-fixed ${validation.changes.length} issue(s):`
      );
      validation.changes.forEach((change) => console.log(`  - ${change}`));
    }
    if (validation.warnings && validation.warnings.length > 0) {
      console.log(`[${widgetId}] ⚠️  Warnings:`);
      validation.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }
    if (!validation.canCompile) {
      throw new Error(`DSL validation failed: ${validation.errors.join(", ")}`);
    }

    // Save 2-after-validation: DSL after validator fixes
    const afterValidationSpec = validation.fixed || spec;
    const afterValidationPath = path.join(
      compilationDir,
      "2-after-validation.json"
    );
    await fs.writeFile(
      afterValidationPath,
      JSON.stringify(afterValidationSpec, null, 2),
      "utf-8"
    );

    // Create final spec for compilation (deep copy to avoid modifying afterValidationSpec)
    const finalSpec = JSON.parse(JSON.stringify(afterValidationSpec));

    // Remove width/height from widget root to allow autoresize to calculate them
    if (finalSpec.widget) {
      delete finalSpec.widget.width;
      delete finalSpec.widget.height;
    }

    // Save 3-final: DSL actually used for compilation
    const finalDslPath = path.join(compilationDir, "3-final.json");
    await fs.writeFile(
      finalDslPath,
      JSON.stringify(finalSpec, null, 2),
      "utf-8"
    );

    // ========== Step 2: Compile DSL to JSX ==========
    console.log(`[${widgetId}] Compiling DSL to JSX...`);
    const jsx = compileWidgetDSLToJSX(finalSpec);
    await fs.writeFile(jsxPath, jsx, "utf-8");

    const layoutPath = path.join(compilationDir, "layout.jsx");
    const layout = generateContainerLayout(finalSpec);
    await fs.writeFile(layoutPath, layout, "utf-8");
    console.log(`[${widgetId}] Generated container layout`);

    const compilationEndTime = new Date();
    const compilationDuration =
      (compilationEndTime - compilationStartTime) / 1000;

    debugData.steps.compilation = {
      status: "success",
      startTime: compilationStartTime.toISOString(),
      endTime: compilationEndTime.toISOString(),
      duration: compilationDuration,
      output: {
        jsxFile: "artifacts/5-compilation/widget.jsx",
        validation: {
          changes: validation.changes || [],
          warnings: validation.warnings || [],
        },
      },
      error: null,
    };

    // ========== Step 3: Render Multiple Versions ==========
    console.log(`[${widgetId}] Rendering JSX to PNG (multiple versions)...`);
    const renderingStartTime = new Date();

    // Step 3.1: Render RAW version (natural layout, no autoresize)
    console.log(`[${widgetId}] - Rendering RAW (natural layout)...`);
    const rawResult = await renderer.renderWidgetFromJSX(jsx, {
      enableAutoResize: false,
      presetId: widgetId,
      spec: finalSpec,
    });

    if (!rawResult.success) {
      throw new Error(`RAW render failed: ${rawResult.error}`);
    }

    const rawPath = path.join(renderingDir, "6.1-raw.png");
    await PlaywrightRenderer.saveImage(rawResult.imageBuffer, rawPath);
    console.log(
      `[${widgetId}] ✓ RAW: ${rawResult.metadata.width}×${rawResult.metadata.height}`
    );

    // Step 3.2: Get original image dimensions for target size
    const originalPath = path.join(
      widgetDir,
      "artifacts",
      "1-preprocess",
      "1.1-original.png"
    );
    const originalExists = await fs
      .access(originalPath)
      .then(() => true)
      .catch(() => false);
    let targetDimensions = null;

    if (originalExists) {
      const originalMeta = await sharp(originalPath).metadata();
      targetDimensions = {
        width: originalMeta.width,
        height: originalMeta.height,
      };
      console.log(
        `[${widgetId}] 🎯 Target dimensions from input: ${targetDimensions.width}×${targetDimensions.height}`
      );
    }

    // Step 3.3: Render AUTORESIZE version (with calculated scale for target dimensions)
    console.log(
      `[${widgetId}] - Rendering AUTORESIZE${
        targetDimensions ? " with calculated scale" : ""
      }...`
    );

    // Use input image's aspect ratio for autoresize instead of DSL's aspect ratio
    const autoresizeSpec = { ...finalSpec };
    if (targetDimensions && autoresizeSpec.widget) {
      const inputAspectRatio = targetDimensions.width / targetDimensions.height;
      console.log(
        `[${widgetId}] 📐 Using input aspect ratio: ${inputAspectRatio.toFixed(
          4
        )} (was: ${
          autoresizeSpec.widget.aspectRatio?.toFixed(4) || "undefined"
        })`
      );
      autoresizeSpec.widget = {
        ...autoresizeSpec.widget,
        aspectRatio: inputAspectRatio,
      };
    }

    const result = await renderer.renderWidgetFromJSX(jsx, {
      enableAutoResize: true,
      presetId: widgetId,
      spec: autoresizeSpec,
      captureOptions: targetDimensions
        ? {
            targetWidth: targetDimensions.width,
            targetHeight: targetDimensions.height,
            autoResizeOnly: true, // Only scale, don't exact resize yet
          }
        : undefined,
    });

    if (!result.success) {
      throw new Error(`AUTORESIZE render failed: ${result.error}`);
    }

    const autoresizePath = path.join(renderingDir, "6.2-autoresize.png");
    await PlaywrightRenderer.saveImage(result.imageBuffer, autoresizePath);
    console.log(
      `[${widgetId}] ✓ AUTORESIZE: ${result.metadata.width}×${result.metadata.height}`
    );

    if (result.boundingBoxes) {
      const boundingBoxPath = path.join(
        renderingDir,
        "6.4-bounding-boxes.json"
      );
      await fs.writeFile(
        boundingBoxPath,
        JSON.stringify(result.boundingBoxes, null, 2),
        "utf-8"
      );
      const elementCount = result.boundingBoxes.elements
        ? Object.keys(result.boundingBoxes.elements).length
        : Object.keys(result.boundingBoxes).length;
      console.log(
        `[${widgetId}] ✓ BOUNDING BOXES: ${elementCount} elements captured (scale: ${
          result.boundingBoxes.scale || "unknown"
        })`
      );
    }

    // Update DSL file with corrected spec
    await fs.writeFile(dslFile, JSON.stringify(result.spec, null, 2), "utf-8");

    // Step 3.4: Create RESIZE version (exact resize to match input dimensions)
    const resizePath = path.join(renderingDir, "6.3-resize.png");
    let resizeSuccess = false;
    try {
      if (originalExists && targetDimensions) {
        // Resize autoresize PNG to exact target dimensions
        await sharp(autoresizePath)
          .resize(targetDimensions.width, targetDimensions.height, {
            fit: "fill",
            kernel: sharp.kernel.lanczos3,
          })
          .png()
          .toFile(resizePath);

        console.log(
          `[${widgetId}] ✓ RESIZE: ${targetDimensions.width}×${targetDimensions.height}`
        );
        resizeSuccess = true;
      } else {
        console.warn(
          `[${widgetId}] ⚠️  Original image not found, skipping resize`
        );
      }
    } catch (resizeError) {
      console.warn(
        `[${widgetId}] ⚠️  Failed to create resized image: ${resizeError.message}`
      );
    }

    // Step 3.5: Save output.png (prefer resize, fallback to autoresize)
    if (resizeSuccess) {
      await fs.copyFile(resizePath, outputPngPath);
      console.log(`[${widgetId}] ✓ OUTPUT: saved resize version`);
    } else {
      await PlaywrightRenderer.saveImage(result.imageBuffer, outputPngPath);
      console.log(
        `[${widgetId}] ✓ OUTPUT: saved autoresize version (resize unavailable)`
      );
    }

    const renderingEndTime = new Date();
    const renderingDuration = (renderingEndTime - renderingStartTime) / 1000;

    // ========== Step 4: Validate Aspect Ratio ==========
    // Use input image's aspect ratio for validation if available, otherwise use original DSL
    const expectedAspectRatio = targetDimensions
      ? targetDimensions.width / targetDimensions.height
      : spec.widget?.aspectRatio;
    const actualAspectRatio = result.metadata.aspectRatio;

    let aspectRatioValid = true;
    let aspectRatioError = null;

    if (
      expectedAspectRatio &&
      typeof expectedAspectRatio === "number" &&
      isFinite(expectedAspectRatio)
    ) {
      const deviation =
        Math.abs(actualAspectRatio - expectedAspectRatio) / expectedAspectRatio;
      if (deviation > 0.05) {
        aspectRatioValid = false;
        aspectRatioError = `Aspect ratio mismatch: expected ${expectedAspectRatio.toFixed(
          4
        )}, got ${actualAspectRatio.toFixed(4)} (${(deviation * 100).toFixed(
          2
        )}% deviation)`;
      }
    }

    // ========== Step 5: Update debug.json and logs ==========
    debugData.steps.rendering = {
      status: aspectRatioValid ? "success" : "failed",
      startTime: renderingStartTime.toISOString(),
      endTime: renderingEndTime.toISOString(),
      duration: renderingDuration,
      output: {
        naturalSize: result.naturalSize,
        finalSize: result.finalSize,
        aspectRatio: {
          expected: expectedAspectRatio || null,
          actual: actualAspectRatio,
          valid: aspectRatioValid,
          error: aspectRatioError,
        },
        validation: result.validation,
      },
      error: aspectRatioError
        ? { message: aspectRatioError, type: "AspectRatioError" }
        : null,
    };

    // Update files section in debug.json
    if (!debugData.files.artifacts) debugData.files.artifacts = {};
    debugData.files.artifacts["5_compilation"] = {
      jsx: "artifacts/5-compilation/widget.jsx",
      layout: "artifacts/5-compilation/layout.jsx",
    };
    debugData.files.artifacts["6_rendering"] = {
      raw: "artifacts/6-rendering/6.1-raw.png",
      autoresize: "artifacts/6-rendering/6.2-autoresize.png",
      resize: "artifacts/6-rendering/6.3-resize.png",
      boundingBoxes: "artifacts/6-rendering/6.4-bounding-boxes.json",
    };
    debugData.files.output = "output.png";

    await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), "utf-8");

    // Append to log file
    const logTimestamp = new Date().toISOString();
    const logEntry = `[${logTimestamp}] [${widgetId}] Compilation: ${compilationDuration.toFixed(
      2
    )}s | Rendering: ${renderingDuration.toFixed(2)}s | Status: ${
      aspectRatioValid ? "SUCCESS" : "FAILED"
    }\n`;
    await fs.appendFile(logFilePath, logEntry, "utf-8");

    if (!aspectRatioValid) {
      throw new Error(aspectRatioError);
    }

    console.log(`[${widgetId}] ✓ Success`);
    if (result.naturalSize) {
      console.log(
        `  Natural: ${result.naturalSize.width}×${result.naturalSize.height}`
      );
    }
    if (result.finalSize) {
      console.log(
        `  Final: ${result.finalSize.width}×${result.finalSize.height}`
      );
    }
    console.log(
      `  Rendered: ${result.metadata.width}×${result.metadata.height}`
    );
    console.log(`  Ratio: ${actualAspectRatio.toFixed(4)}`);

    return { success: true, widgetId, widgetDir };
  } catch (error) {
    console.error(`[${widgetId}] ✗ Failed: ${error.message}`);

    const errorEndTime = new Date();
    const errorPath = path.join(widgetDir, "log", "error.txt");

    // Update debug.json with error information
    if (!debugData.steps.compilation) {
      const compilationDuration = (errorEndTime - compilationStartTime) / 1000;
      debugData.steps.compilation = {
        status: "failed",
        startTime: compilationStartTime.toISOString(),
        endTime: errorEndTime.toISOString(),
        duration: compilationDuration,
        error: {
          message: error.message,
          type: error.constructor.name,
        },
      };
    } else if (!debugData.steps.rendering) {
      const renderingDuration =
        (errorEndTime - new Date(debugData.steps.compilation.endTime)) / 1000;
      debugData.steps.rendering = {
        status: "failed",
        startTime: debugData.steps.compilation.endTime,
        endTime: errorEndTime.toISOString(),
        duration: renderingDuration,
        error: {
          message: error.message,
          type: error.constructor.name,
        },
      };
    }

    await fs.writeFile(debugPath, JSON.stringify(debugData, null, 2), "utf-8");
    await fs.writeFile(
      errorPath,
      `Error: ${error.message}\n\n${error.stack || ""}`,
      "utf-8"
    );

    // Append error to log file
    const logTimestamp = new Date().toISOString();
    const logEntry = `[${logTimestamp}] [${widgetId}] ERROR: ${error.message}\n`;
    await fs.appendFile(logFilePath, logEntry, "utf-8").catch(() => {});

    return { success: false, widgetId, widgetDir, error: error.message };
  }
}
