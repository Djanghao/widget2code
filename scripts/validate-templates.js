#!/usr/bin/env node

/**
 * Validation script for generated templates
 * Checks that all templates are properly structured and valid
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const templatesDir = path.join(projectRoot, "libs/js/templates/templates");

// Validation rules
const validations = {
  errors: [],
  warnings: [],
  passed: 0,
  total: 0,
};

function validateTemplate(template, filePath) {
  const fileName = path.basename(filePath);
  validations.total++;

  // Required top-level fields
  const requiredFields = [
    "id",
    "name",
    "source",
    "pattern",
    "complexity",
    "aspectRatio",
    "containerCount",
    "widget",
  ];

  for (const field of requiredFields) {
    if (!(field in template)) {
      validations.errors.push(`${fileName}: Missing required field '${field}'`);
      return false;
    }
  }

  // Validate source
  if (!["basic", "extracted"].includes(template.source)) {
    validations.errors.push(
      `${fileName}: Invalid source '${template.source}' (must be 'basic' or 'extracted')`
    );
    return false;
  }

  // Validate pattern
  const validPatterns = [
    "single-col",
    "two-col",
    "grid",
    "header-content",
    "list",
    "complex",
    "simple",
  ];
  if (!validPatterns.includes(template.pattern)) {
    validations.errors.push(
      `${fileName}: Invalid pattern '${template.pattern}'`
    );
    return false;
  }

  // Validate complexity
  const validComplexities = ["simple", "medium", "complex"];
  if (!validComplexities.includes(template.complexity)) {
    validations.errors.push(
      `${fileName}: Invalid complexity '${template.complexity}'`
    );
    return false;
  }

  // Validate aspectRatio
  if (typeof template.aspectRatio !== "number" || template.aspectRatio <= 0) {
    validations.errors.push(
      `${fileName}: Invalid aspectRatio '${template.aspectRatio}' (must be positive number)`
    );
    return false;
  }

  // Validate containerCount
  if (
    typeof template.containerCount !== "number" ||
    template.containerCount < 1
  ) {
    validations.errors.push(
      `${fileName}: Invalid containerCount '${template.containerCount}' (must be >= 1)`
    );
    return false;
  }

  // Validate widget structure
  if (!template.widget || typeof template.widget !== "object") {
    validations.errors.push(`${fileName}: Missing or invalid 'widget' object`);
    return false;
  }

  const { widget } = template;

  // Widget required fields
  if (!widget.root || typeof widget.root !== "object") {
    validations.errors.push(`${fileName}: Missing or invalid 'widget.root'`);
    return false;
  }

  // Validate root is a container
  if (widget.root.type !== "container") {
    validations.errors.push(
      `${fileName}: widget.root must be a container, got '${widget.root.type}'`
    );
    return false;
  }

  // Recursively validate containers
  const containerCount = validateNode(widget.root, fileName, []);

  // Check container count matches
  if (containerCount !== template.containerCount) {
    validations.warnings.push(
      `${fileName}: containerCount mismatch (declared: ${template.containerCount}, actual: ${containerCount})`
    );
  }

  validations.passed++;
  return true;
}

function validateNode(node, fileName, path) {
  if (!node || typeof node !== "object") {
    validations.errors.push(
      `${fileName}: Invalid node at path ${path.join(".")}`
    );
    return 0;
  }

  if (node.type !== "container") {
    validations.errors.push(
      `${fileName}: Expected container at path ${path.join(".")}, got '${node.type}'`
    );
    return 0;
  }

  // Validate children is an array
  if (!Array.isArray(node.children)) {
    validations.errors.push(
      `${fileName}: Container at ${path.join(".")} missing children array`
    );
    return 0;
  }

  // Check for leaf nodes (should not exist in templates)
  const hasLeafChildren = node.children.some((child) => child.type === "leaf");
  if (hasLeafChildren) {
    validations.errors.push(
      `${fileName}: Container at ${path.join(".")} contains leaf nodes (templates should only have empty containers)`
    );
    return 0;
  }

  // Validate metadata if present
  if (node._meta) {
    if (typeof node._meta.maxChildren !== "number") {
      validations.warnings.push(
        `${fileName}: Container at ${path.join(".")} has invalid _meta.maxChildren`
      );
    }

    if (node._meta.semantic) {
      const validSemantics = ["header", "content", "footer", "sidebar"];
      if (!validSemantics.includes(node._meta.semantic)) {
        validations.warnings.push(
          `${fileName}: Container at ${path.join(".")} has invalid semantic '${node._meta.semantic}'`
        );
      }
    }

    if (!Array.isArray(node._meta.typical)) {
      validations.warnings.push(
        `${fileName}: Container at ${path.join(".")} has invalid _meta.typical (not an array)`
      );
    }
  }

  // Count this container
  let count = 1;

  // Recursively validate child containers
  node.children.forEach((child, idx) => {
    count += validateNode(child, fileName, [...path, `children[${idx}]`]);
  });

  return count;
}

function validateAllTemplates() {
  console.log("🔍 Validating templates...\n");

  // Validate basic templates
  const basicDir = path.join(templatesDir, "basic");
  if (fs.existsSync(basicDir)) {
    const basicFiles = fs.readdirSync(basicDir).filter((f) => f.endsWith(".json"));
    console.log(`📐 Basic templates: ${basicFiles.length}`);

    basicFiles.forEach((file) => {
      const filePath = path.join(basicDir, file);
      try {
        const template = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        validateTemplate(template, filePath);
      } catch (error) {
        validations.errors.push(`${file}: JSON parse error - ${error.message}`);
      }
    });
  }

  // Validate extracted templates
  const extractedDir = path.join(templatesDir, "extracted");
  if (fs.existsSync(extractedDir)) {
    const extractedFiles = fs
      .readdirSync(extractedDir)
      .filter((f) => f.endsWith(".json"));
    console.log(`🔍 Extracted templates: ${extractedFiles.length}`);

    extractedFiles.forEach((file) => {
      const filePath = path.join(extractedDir, file);
      try {
        const template = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        validateTemplate(template, filePath);
      } catch (error) {
        validations.errors.push(`${file}: JSON parse error - ${error.message}`);
      }
    });
  }

  // Print results
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(60));
  console.log(`Total templates validated: ${validations.total}`);
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
    console.log("✅ All templates passed validation!");
  } else {
    console.log(`❌ Validation failed with ${validations.errors.length} errors`);
    process.exit(1);
  }
}

// Run validation
validateAllTemplates();
