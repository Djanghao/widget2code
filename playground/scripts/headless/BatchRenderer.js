/**
 * @file BatchRenderer.js
 * @description Batch orchestrator for parallel widget rendering.
 * Manages queue processing with configurable concurrency.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import { PlaywrightRenderer } from './PlaywrightRenderer.js';
import path from 'path';
import fs from 'fs/promises';

export class BatchRenderer {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      verbose: false,
      ...options
    };
    this.results = [];
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };
  }

  async processBatch() {
    console.log('\n========================================');
    console.log('📦 Batch Widget Rendering');
    console.log('========================================\n');

    this.stats.startTime = Date.now();
    this.stats.total = this.config.widgets.length;

    console.log(`Total widgets: ${this.stats.total}`);
    console.log(`Concurrency: ${this.config.concurrency || 1}`);
    console.log(`Output directory: ${this.config.outputDir}\n`);

    const concurrency = this.config.concurrency || 1;
    const renderers = [];

    for (let i = 0; i < concurrency; i++) {
      const renderer = new PlaywrightRenderer({
        devServerUrl: this.config.devServerUrl || 'http://localhost:5173',
        timeout: this.config.timeout || 30000,
        verbose: this.options.verbose
      });
      await renderer.initialize();
      renderers.push(renderer);
    }

    const queue = [...this.config.widgets];
    let completed = 0;

    const processWidget = async (renderer, widget, index) => {
      const widgetNum = index + 1;
      console.log(`\n[${widgetNum}/${this.stats.total}] Processing: ${widget.id || `widget-${widgetNum}`}`);

      try {
        let spec;

        if (widget.preset) {
          const examplesPath = path.resolve(process.cwd(), 'src/examples');
          const presetFile = await this.findPresetFile(examplesPath, widget.preset);

          if (!presetFile) {
            throw new Error(`Preset not found: ${widget.preset}`);
          }

          const presetData = await fs.readFile(presetFile, 'utf-8');
          spec = JSON.parse(presetData);
          console.log(`  ✓ Loaded preset: ${widget.preset}`);
        } else if (widget.spec) {
          spec = widget.spec;
          console.log(`  ✓ Using custom spec`);
        } else {
          throw new Error('Widget must have either "preset" or "spec"');
        }

        const result = await renderer.renderWidget(spec, {
          enableAutoResize: widget.enableAutoResize !== false,
          presetId: widget.id || widget.preset || `widget-${widgetNum}`
        });

        if (result.success) {
          const filename = PlaywrightRenderer.generateFilename(
            result.presetId,
            result.metadata
          );
          const outputPath = path.resolve(this.config.outputDir, filename);

          await PlaywrightRenderer.saveImage(result.imageBuffer, outputPath);

          console.log(`  ✓ Success: ${filename}`);
          console.log(`    Natural: ${result.naturalSize.width}×${result.naturalSize.height}`);
          console.log(`    Final: ${result.finalSize.width}×${result.finalSize.height}`);
          console.log(`    Ratio: ${result.metadata.aspectRatio}`);

          this.stats.success++;
          this.results.push({
            widget: widget.id || widget.preset,
            success: true,
            filename,
            outputPath,
            metadata: result.metadata,
            naturalSize: result.naturalSize,
            finalSize: result.finalSize,
            validation: result.validation
          });
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        this.stats.failed++;
        this.results.push({
          widget: widget.id || widget.preset,
          success: false,
          error: error.message
        });
      }

      completed++;
      console.log(`\nProgress: ${completed}/${this.stats.total} (${Math.round(completed/this.stats.total*100)}%)`);
    };

    const workers = renderers.map(async (renderer, rendererIndex) => {
      while (queue.length > 0) {
        const widget = queue.shift();
        if (widget) {
          const index = this.config.widgets.indexOf(widget);
          await processWidget(renderer, widget, index);
        }
      }
    });

    await Promise.all(workers);

    for (const renderer of renderers) {
      await renderer.close();
    }

    this.stats.endTime = Date.now();
    this.printSummary();

    return {
      stats: this.stats,
      results: this.results
    };
  }

  async findPresetFile(examplesDir, presetName) {
    const files = await fs.readdir(examplesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const basename = path.basename(file, '.json');
      const normalized = basename.replace(/-/g, '').toLowerCase();
      const targetNormalized = presetName.replace(/-/g, '').toLowerCase();

      if (normalized === targetNormalized) {
        return path.join(examplesDir, file);
      }
    }

    return null;
  }

  printSummary() {
    const duration = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);

    console.log('\n========================================');
    console.log('📊 Batch Rendering Summary');
    console.log('========================================\n');

    console.log(`Total:    ${this.stats.total}`);
    console.log(`Success:  ${this.stats.success} ✓`);
    console.log(`Failed:   ${this.stats.failed} ✗`);
    console.log(`Duration: ${duration}s`);
    console.log(`Average:  ${(parseFloat(duration) / this.stats.total).toFixed(2)}s per widget\n`);

    if (this.stats.failed > 0) {
      console.log('Failed widgets:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ✗ ${r.widget}: ${r.error}`);
        });
      console.log('');
    }

    console.log(`Output directory: ${path.resolve(this.config.outputDir)}\n`);
  }

  async saveReport(reportPath) {
    const report = {
      stats: this.stats,
      results: this.results,
      config: {
        outputDir: this.config.outputDir,
        concurrency: this.config.concurrency,
        timeout: this.config.timeout
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to ${reportPath}`);
  }
}
