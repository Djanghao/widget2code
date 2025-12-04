#!/usr/bin/env node

/**
 * @file index.js
 * @description Widget Factory CLI - Unified command-line interface
 * @author Houston Zhang
 * @date 2025-10-29
 */

import { compileToJSX } from "./commands/compile.js";
import { render } from "./commands/render.js";
import { batchRender } from "@widget-factory/renderer";
import { batchGenerateVQA } from "./commands/batch-generate-vqa.js";
import { batchGenerateVQAWithSplit } from "./commands/batch-generate-vqa-split.js";

function printHelp() {
  console.log(`
Widget Factory CLI - Unified tools for widget compilation and rendering

Usage: widget-factory <command> [options]

Commands:
  compile <dsl.json> [output.jsx]
    Compile WidgetDSL to React JSX code
    Output defaults to same directory with .jsx extension

  render <widget-directory>
    Render a single widget from its directory (DSL → JSX → PNG)
    Widget directory must contain a DSL file at artifacts/4-dsl/widget.json
    Output will be saved in the same directory

  batch-render <directory> [options]
    Batch render widgets from DSL specs in-place
    Directory must contain widget subdirectories with DSL files
    Options: --concurrency N, --force

  batch-generate-vqa <directory> [options]
    Generate VQA dataset for UI understanding tasks
    Requires widgets with DSL, bounding boxes, and rendered images
    Options:
      --output-dir <path>       Output directory (default: <directory>/vqa-dataset)
      --dataset-root <path>     Root path for image references (default: <directory>)
      --continue-from <widget>  Continue from specific widget ID
      --avoid <file>            Path to existing combined.json to avoid duplicates
      --target-size <number>    Target size for combined dataset
      --widget-list <file>      Process only widgets listed in file (one per line)

  batch-generate-vqa-split <directory> [options]
    Generate VQA dataset with train/val/test split (7:1:2)
    Distribution: 60% general grounding, 10% category grounding, 20% referring, 10% layout
    Options:
      --output-dir <path>       Output directory (default: ./results/vqa-dataset-v3)
      --dataset-root <path>     Root path for image references (default: <directory>)
      --widget-list <file>      Process only widgets listed in file (one per line)
      --seed <number>           Random seed for reproducible splits (default: 42)

Examples:
  widget-factory compile widget.json
  widget-factory compile widget.json custom.jsx
  widget-factory render ./results/tmp/image_0001
  widget-factory batch-render ./results/tmp
  widget-factory batch-render ./results/tmp --concurrency 5 --force
  widget-factory batch-generate-vqa-split ./widgets
  widget-factory batch-generate-vqa-split ./widgets --output-dir ./vqa-split --seed 123

Options:
  --help, -h    Show this help message
  --version, -v Show version number
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log("0.4.0");
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case "compile":
        if (commandArgs.length < 1) {
          console.error(
            "Error: compile requires <dsl-json-path> [output-jsx-path]"
          );
          process.exit(1);
        }
        await compileToJSX(commandArgs[0], commandArgs[1]);
        break;

      case "render":
        if (commandArgs.length < 1) {
          console.error("Error: render requires <widget-directory>");
          process.exit(1);
        }
        await render(commandArgs[0]);
        break;

      case "batch-render":
        if (commandArgs.length < 1) {
          console.error("Error: batch-render requires <directory> [options]");
          process.exit(1);
        }
        // Parse batch-render options
        let concurrency = 3;
        let force = false;
        let port = null;
        const directory = commandArgs[0];

        for (let i = 1; i < commandArgs.length; i++) {
          if (commandArgs[i] === "--concurrency" && commandArgs[i + 1]) {
            concurrency = parseInt(commandArgs[i + 1]);
            i++; // Skip next arg
          } else if (commandArgs[i] === "--port" && commandArgs[i + 1]) {
            port = parseInt(commandArgs[i + 1]);
            i++; // Skip next arg
          } else if (commandArgs[i] === "--force") {
            force = true;
          } else if (!commandArgs[i].startsWith("--")) {
            // Legacy support: bare number is concurrency
            concurrency = parseInt(commandArgs[i]) || 3;
          }
        }

        const devServerUrl = port ? `http://localhost:${port}` : undefined;
        const { failedCount } = await batchRender(directory, {
          concurrency,
          force,
          devServerUrl,
        });
        process.exit(failedCount > 0 ? 1 : 0);
        break;

      case "batch-generate-vqa":
        if (commandArgs.length < 1) {
          console.error(
            "Error: batch-generate-vqa requires <directory> [options]"
          );
          process.exit(1);
        }
        // Parse batch-generate-vqa options
        let vqaOutputDir = null;
        let vqaDatasetRoot = null;
        let vqaContinueFrom = null;
        let vqaAvoidFile = null;
        let vqaTargetSize = null;
        let vqaWidgetList = null;
        const vqaDirectory = commandArgs[0];

        for (let i = 1; i < commandArgs.length; i++) {
          if (commandArgs[i] === "--output-dir" && commandArgs[i + 1]) {
            vqaOutputDir = commandArgs[i + 1];
            i++;
          } else if (
            commandArgs[i] === "--dataset-root" &&
            commandArgs[i + 1]
          ) {
            vqaDatasetRoot = commandArgs[i + 1];
            i++;
          } else if (
            commandArgs[i] === "--continue-from" &&
            commandArgs[i + 1]
          ) {
            vqaContinueFrom = commandArgs[i + 1];
            i++;
          } else if (commandArgs[i] === "--avoid" && commandArgs[i + 1]) {
            vqaAvoidFile = commandArgs[i + 1];
            i++;
          } else if (commandArgs[i] === "--target-size" && commandArgs[i + 1]) {
            vqaTargetSize = parseInt(commandArgs[i + 1]);
            i++;
          } else if (commandArgs[i] === "--widget-list" && commandArgs[i + 1]) {
            vqaWidgetList = commandArgs[i + 1];
            i++;
          }
        }

        const vqaOptions = {};
        if (vqaOutputDir) vqaOptions.outputDir = vqaOutputDir;
        if (vqaDatasetRoot) vqaOptions.datasetRoot = vqaDatasetRoot;
        if (vqaContinueFrom) vqaOptions.continueFrom = vqaContinueFrom;
        if (vqaAvoidFile) vqaOptions.avoidFile = vqaAvoidFile;
        if (vqaTargetSize) vqaOptions.targetSize = vqaTargetSize;
        if (vqaWidgetList) vqaOptions.widgetListPath = vqaWidgetList;

        const { failedCount: vqaFailedCount } = await batchGenerateVQA(
          vqaDirectory,
          vqaOptions
        );
        process.exit(vqaFailedCount > 0 ? 1 : 0);
        break;

      case "batch-generate-vqa-split":
        if (commandArgs.length < 1) {
          console.error(
            "Error: batch-generate-vqa-split requires <directory> [options]"
          );
          process.exit(1);
        }
        // Parse batch-generate-vqa-split options
        let vqaSplitOutputDir = null;
        let vqaSplitDatasetRoot = null;
        let vqaSplitWidgetList = null;
        let vqaSplitSeed = 42;
        const vqaSplitDirectory = commandArgs[0];

        for (let i = 1; i < commandArgs.length; i++) {
          if (commandArgs[i] === "--output-dir" && commandArgs[i + 1]) {
            vqaSplitOutputDir = commandArgs[i + 1];
            i++;
          } else if (
            commandArgs[i] === "--dataset-root" &&
            commandArgs[i + 1]
          ) {
            vqaSplitDatasetRoot = commandArgs[i + 1];
            i++;
          } else if (commandArgs[i] === "--widget-list" && commandArgs[i + 1]) {
            vqaSplitWidgetList = commandArgs[i + 1];
            i++;
          } else if (commandArgs[i] === "--seed" && commandArgs[i + 1]) {
            vqaSplitSeed = parseInt(commandArgs[i + 1]);
            i++;
          }
        }

        const vqaSplitOptions = { seed: vqaSplitSeed };
        if (vqaSplitOutputDir) vqaSplitOptions.outputDir = vqaSplitOutputDir;
        if (vqaSplitDatasetRoot)
          vqaSplitOptions.datasetRoot = vqaSplitDatasetRoot;
        if (vqaSplitWidgetList)
          vqaSplitOptions.widgetListPath = vqaSplitWidgetList;

        await batchGenerateVQAWithSplit(vqaSplitDirectory, vqaSplitOptions);
        process.exit(0);
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error('Run "widget-factory --help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
