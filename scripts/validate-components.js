#!/usr/bin/env node

/**
 * Validation script for domain components
 * Validates component structure and prints statistics
 */

import { getAllComponents, getRegistryStats, printRegistryStats, componentRegistry } from "../libs/js/components/src/registry.js";
import { validateComponent } from "../libs/js/components/src/schema.js";

const validations = {
  errors: [],
  warnings: [],
  passed: 0,
  total: 0,
};

function validateAllComponents() {
  console.log("🔍 Validating components...\n");

  const allComponents = getAllComponents();
  validations.total = allComponents.length;

  allComponents.forEach((component) => {
    const result = validateComponent(component);

    if (result.valid) {
      validations.passed++;
    } else {
      result.errors.forEach((error) => {
        validations.errors.push(`${component.id || "unknown"}: ${error}`);
      });
    }

    // Additional warnings
    if (Array.isArray(component.node) && component.node.length === 0) {
      validations.warnings.push(`${component.id}: Composite component has empty node array`);
    }
  });

  // Print validation results
  console.log("=" .repeat(60));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(60));
  console.log(`Total components validated: ${validations.total}`);
  console.log(`Passed: ${validations.passed}`);
  console.log(`Errors: ${validations.errors.length}`);
  console.log(`Warnings: ${validations.warnings.length}`);
  console.log("=".repeat(60) + "\n");

  if (validations.errors.length > 0) {
    console.log("❌ ERRORS:");
    validations.errors.forEach((error) => {
      console.log(`   ${error}`);
    });
    console.log();
  }

  if (validations.warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    validations.warnings.forEach((warning) => {
      console.log(`   ${warning}`);
    });
    console.log();
  }

  if (validations.errors.length === 0) {
    console.log("✅ All components passed validation!");
    console.log();

    // Print registry statistics
    printRegistryStats();

    // Print domain details
    console.log("\n=== Domain Details ===");
    Object.keys(componentRegistry).forEach((domain) => {
      const components = componentRegistry[domain];
      const categories = {};
      components.forEach((c) => {
        categories[c.category] = (categories[c.category] || 0) + 1;
      });

      console.log(`\n${domain}:`);
      console.log(`  Total: ${components.length}`);
      console.log(`  Categories:`);
      Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`    ${cat}: ${count}`);
      });
    });
    console.log("======================\n");
  } else {
    console.log(`❌ Validation failed with ${validations.errors.length} errors`);
    process.exit(1);
  }
}

// Run validation
validateAllComponents();
