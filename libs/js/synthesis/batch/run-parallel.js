import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG = path.join(__dirname, "../config/runner-config.example.json");

/**
 * Parallel Batch Widget Generation Runner
 * Orchestrates multiple batch-generate-widgets.js instances running in parallel
 */

/**
 * Load runner configuration from JSON file
 */
function loadRunnerConfig(configPath) {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Validate config
    if (!data.runners || !Array.isArray(data.runners)) {
      throw new Error("Config must contain 'runners' array");
    }

    if (data.runners.length === 0) {
      throw new Error("Config must contain at least one runner");
    }

    // Validate each runner
    data.runners.forEach((runner, index) => {
      if (!runner.name) {
        throw new Error(`Runner ${index} missing 'name' field`);
      }
      if (!runner.port) {
        throw new Error(`Runner ${runner.name} missing 'port' field`);
      }
      if (!runner.domains || !Array.isArray(runner.domains)) {
        throw new Error(
          `Runner ${runner.name} missing 'domains' array or invalid format`
        );
      }
      if (runner.domains.length === 0) {
        throw new Error(`Runner ${runner.name} has empty domains array`);
      }
    });

    // Check for duplicate ports
    const ports = data.runners.map((r) => r.port);
    const duplicates = ports.filter((p, i) => ports.indexOf(p) !== i);
    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate ports found in config: ${duplicates.join(", ")}`
      );
    }

    // Check for duplicate runner names
    const names = data.runners.map((r) => r.name);
    const duplicateNames = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicateNames.length > 0) {
      throw new Error(
        `Duplicate runner names found in config: ${duplicateNames.join(", ")}`
      );
    }

    return data;
  } catch (error) {
    console.error(`Failed to load config: ${error.message}`);
    throw error;
  }
}

/**
 * Build command line arguments for a runner
 */
function buildCommandArgs(runner, globalOptions = {}) {
  const args = [];

  // Add domains
  args.push(`--domains=${runner.domains.join(",")}`);

  // Add port
  args.push(`--port=${runner.port}`);

  // Add prompt preset if specified
  if (runner.promptPreset) {
    args.push(`--prompt-preset=${runner.promptPreset}`);
  }

  // Add runner-specific options
  if (runner.options) {
    if (runner.options.limit) {
      args.push(`--limit=${runner.options.limit}`);
    }

    // Handle mode flags
    const useStatic = runner.options.useStatic ?? true;
    const useDynamic = runner.options.useDynamic ?? false;
    const useWithImages = runner.options.useWithImages ?? false;

    if (useStatic && useDynamic && useWithImages) {
      args.push("--all");
    } else if (useStatic && useDynamic) {
      args.push("--both");
    } else if (useDynamic) {
      args.push("--dynamic");
    } else if (useWithImages) {
      args.push("--with-images");
    }
    // If only useStatic is true, no flag needed (it's the default)
  }

  // Add global options
  if (globalOptions.referenceImagesDir) {
    args.push(`--reference-images-dir=${globalOptions.referenceImagesDir}`);
  }

  if (globalOptions.imageUrlsDir) {
    args.push(`--image-urls-dir=${globalOptions.imageUrlsDir}`);
  }

  if (globalOptions.referencesPerDescription) {
    args.push(
      `--references-per-description=${globalOptions.referencesPerDescription}`
    );
  }

  return args;
}

/**
 * Spawn a single runner process
 */
function spawnRunner(runner, globalOptions) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "batch-generate-widgets.js");
    const args = buildCommandArgs(runner, globalOptions);

    console.log(`\n${"=".repeat(70)}`);
    console.log(`🚀 Starting runner: ${runner.name}`);
    console.log(`   Port: ${runner.port}`);
    console.log(`   Preset: ${runner.promptPreset || "default"}`);
    console.log(`   Domains: ${runner.domains.join(", ")}`);
    console.log(`   Command: node batch-generate-widgets.js ${args.join(" ")}`);
    console.log(`${"=".repeat(70)}\n`);

    const startTime = Date.now();

    const child = spawn("node", [scriptPath, ...args], {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      // Prefix output with runner name for clarity
      process.stdout.write(`[${runner.name}] ${output}`);
    });

    child.stderr.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(`[${runner.name}] ${output}`);
    });

    child.on("error", (error) => {
      console.error(`\n❌ Runner ${runner.name} failed to start:`, error);
      reject({
        runner: runner.name,
        error: error.message,
        duration: ((Date.now() - startTime) / 1000).toFixed(2),
      });
    });

    child.on("close", (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(
          `\n✅ Runner ${runner.name} completed successfully in ${duration}s\n`
        );
        resolve({
          runner: runner.name,
          success: true,
          duration,
          port: runner.port,
          domains: runner.domains,
        });
      } else {
        console.error(
          `\n❌ Runner ${runner.name} exited with code ${code} after ${duration}s\n`
        );
        reject({
          runner: runner.name,
          exitCode: code,
          duration,
          stderr: stderr.slice(-500), // Last 500 chars of stderr
        });
      }
    });
  });
}

/**
 * Run all runners in parallel
 */
async function runAllParallel(config) {
  const startTime = Date.now();

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║       PARALLEL BATCH WIDGET GENERATION SYSTEM             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`📊 Total runners: ${config.runners.length}`);
  console.log(
    `🌍 Total domains: ${[
      ...new Set(config.runners.flatMap((r) => r.domains)),
    ].join(", ")}`
  );
  console.log();

  // Create promises for all runners
  const runnerPromises = config.runners.map((runner) =>
    spawnRunner(runner, config.globalOptions || {})
  );

  // Wait for all runners to complete
  const results = await Promise.allSettled(runnerPromises);

  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 PARALLEL EXECUTION SUMMARY");
  console.log("=".repeat(70));

  const successful = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  console.log(`\n✅ Successful: ${successful.length}/${config.runners.length}`);
  successful.forEach((result) => {
    const data = result.value;
    console.log(
      `   ${data.runner.padEnd(25)} Port: ${data.port}  Duration: ${
        data.duration
      }s  Domains: ${data.domains.join(", ")}`
    );
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${config.runners.length}`);
    failed.forEach((result) => {
      const error = result.reason;
      console.log(
        `   ${error.runner.padEnd(25)} Duration: ${error.duration}s  Error: ${
          error.error || `Exit code ${error.exitCode}`
        }`
      );
      if (error.stderr) {
        console.log(`   Last error: ${error.stderr.trim()}`);
      }
    });
  }

  console.log(`\n⏱️  Total execution time: ${totalDuration}s`);
  console.log("=".repeat(70));

  // Exit with error if any runner failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  let configPath = DEFAULT_CONFIG;

  args.forEach((arg) => {
    if (arg.startsWith("--config=")) {
      configPath = arg.split("=")[1];
    }
  });

  return { configPath };
}

// Main execution
try {
  const { configPath } = parseArgs();

  console.log(`📄 Loading config from: ${configPath}\n`);

  const config = loadRunnerConfig(configPath);

  runAllParallel(config).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Failed to start:", error.message);
  console.log();
  console.log("Usage:");
  console.log("  node run-batch-in-parallel.js [--config=PATH]");
  console.log();
  console.log("Options:");
  console.log(
    "  --config=PATH    Path to runner config JSON (default: runner-config.example.json)"
  );
  console.log();
  console.log("Example:");
  console.log("  node run-batch-in-parallel.js --config=./my-config.json");
  console.log();
  process.exit(1);
}
