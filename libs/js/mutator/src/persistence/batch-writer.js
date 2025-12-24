import fs from "fs";
import path from "path";
import os from "os";

export function saveDSL(dslData, projectRoot, runId) {
  const resultsDir = path.join(
    projectRoot,
    "output/2-mutator/batch-generated",
    runId
  );

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const batchIndex = Math.ceil(dslData.id / 100);
  const filename = `${runId}-batch-${batchIndex.toString().padStart(3, "0")}.json`;
  const filepath = path.join(resultsDir, filename);

  try {
    let existingData = [];
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, "utf8");
      existingData = JSON.parse(content);
    }

    existingData.push(dslData);

    const tempFilepath = path.join(
      resultsDir,
      `.tmp-${process.pid}-${Date.now()}-${filename}`
    );
    fs.writeFileSync(tempFilepath, JSON.stringify(existingData, null, 2));
    fs.renameSync(tempFilepath, filepath);
  } catch (error) {
    console.error(`Failed to save DSL ${dslData.id}: ${error.message}`);
  }
}

export function generateReport(stats, palette, rulebook, projectRoot, runId) {
  const report = {
    timestamp: new Date().toISOString(),
    stats: stats,
    paletteInfo: {
      totalComponents:
        palette.components.basic.length + palette.components.charts.length,
      totalMutations: palette.mutationOperations.length,
      totalColors: palette.containerValues.backgroundColor.length,
      totalIcons:
        palette.iconProps.sfNames.length + palette.iconProps.lucideNames.length,
    },
    rulebookInfo: {
      maxDepth: rulebook.globalConstraints.maxDepth,
      maxChildren: rulebook.globalConstraints.maxChildrenPerContainer,
      validationRules: Object.keys(rulebook.componentSpecificRules).length,
    },
  };

  const resultsDir = path.join(
    projectRoot,
    "output/2-mutator/batch-generated",
    runId
  );
  const reportPath = path.join(resultsDir, "generation-report.json");

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Generation report saved to: ${reportPath}`);
  console.log(`Results folder: ${resultsDir}`);
  return report;
}
