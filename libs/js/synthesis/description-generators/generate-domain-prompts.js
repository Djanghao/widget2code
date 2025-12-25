import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const COMPONENTS_DIR = path.join(__dirname, '../../components/src/domains');
const BASE_PROMPT_PATH = path.join(__dirname, '../../../python/generator/prompts/prompt2dsl/prompt2dsl.md');
const OUTPUT_DIR = path.join(__dirname, '../../../python/generator/prompts/prompt2dsl/domains');

// Domain files
const DOMAINS = [
  'health',
  'finance',
  'weather',
  'productivity',
  'media',
  'communication',
  'smart-home',
  'navigation',
  'utilities',
  'sports',
  'travel',
  'food',
  'shopping',
  'social',
];

/**
 * Format a component into markdown documentation
 */
function formatComponent(component) {
  const { id, category, node, metadata } = component;

  let markdown = `#### ${id}\n`;
  markdown += `- **Category**: ${category}\n`;
  markdown += `- **Component Type**: ${node.component}\n`;

  // Add props
  if (node.props && Object.keys(node.props).length > 0) {
    markdown += `- **Props**: ${JSON.stringify(node.props, null, 2)}\n`;
  }

  // Add content if exists
  if (node.content) {
    markdown += `- **Content**: "${node.content}"\n`;
  }

  // Add dimensions if exists
  if (node.width || node.height) {
    markdown += `- **Dimensions**: `;
    if (node.width) markdown += `width: ${node.width}`;
    if (node.width && node.height) markdown += `, `;
    if (node.height) markdown += `height: ${node.height}`;
    markdown += `\n`;
  }

  // Add metadata
  if (metadata) {
    if (metadata.tags && metadata.tags.length > 0) {
      markdown += `- **Tags**: ${metadata.tags.join(', ')}\n`;
    }
    if (metadata.semanticFit) {
      markdown += `- **Semantic Fit**: ${metadata.semanticFit}\n`;
    }
  }

  markdown += '\n';
  return markdown;
}

/**
 * Group components by category
 */
function groupByCategory(components) {
  const grouped = {};

  components.forEach(component => {
    const category = component.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(component);
  });

  return grouped;
}

/**
 * Generate markdown documentation for a domain
 */
function generateDomainDocumentation(domain, components) {
  let markdown = `\n\n---\n\n`;
  markdown += `## ${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain Component Library\n\n`;
  markdown += `The following pre-built components are available for ${domain} widgets. You can reference these components by their exact ID to ensure consistent styling and behavior.\n\n`;

  // Group by category
  const grouped = groupByCategory(components);
  const categories = Object.keys(grouped).sort();

  // Generate documentation for each category
  categories.forEach(category => {
    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Components\n\n`;

    grouped[category].forEach(component => {
      markdown += formatComponent(component);
    });
  });

  markdown += `\n## Using Domain Components\n\n`;
  markdown += `To use a component from this library:\n\n`;
  markdown += `1. **Reference by ID**: Use the exact component ID in your generated DSL\n`;
  markdown += `2. **Copy the node structure**: Include the component type, props, and any content\n`;
  markdown += `3. **Customize as needed**: You can modify colors, sizes, and content while keeping the structure\n\n`;
  markdown += `Example:\n`;
  markdown += `\`\`\`json\n`;
  markdown += `{\n`;
  markdown += `  "type": "leaf",\n`;
  markdown += `  "component": "Icon",\n`;
  markdown += `  "flex": "none",\n`;
  markdown += `  "props": {\n`;
  markdown += `    "name": "sf:heart.fill",\n`;
  markdown += `    "size": 24,\n`;
  markdown += `    "color": "#FF3B30"\n`;
  markdown += `  }\n`;
  markdown += `}\n`;
  markdown += `\`\`\`\n\n`;

  return markdown;
}

/**
 * Convert kebab-case to camelCase
 */
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Load components from a domain file
 */
async function loadDomainComponents(domain) {
  const domainPath = path.join(COMPONENTS_DIR, `${domain}.js`);

  try {
    // Dynamic import - convert to file:// URL for Windows compatibility
    const fileUrl = new URL(`file:///${domainPath.replace(/\\/g, '/')}`);
    const module = await import(fileUrl.href);

    // Convert domain to camelCase and append Components
    // e.g., "smart-home" -> "smartHomeComponents"
    const camelDomain = toCamelCase(domain);
    const exportName = `${camelDomain}Components`;

    return module[exportName] || module.components || [];
  } catch (error) {
    console.error(`Error loading domain ${domain}:`, error.message);
    return [];
  }
}

/**
 * Generate all domain-specific prompts
 */
async function generateDomainPrompts(domainsToProcess = DOMAINS) {
  // Read base prompt
  const basePrompt = fs.readFileSync(BASE_PROMPT_PATH, 'utf-8');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating domain-specific prompts...\n');
  console.log(`Domains to process: ${domainsToProcess.join(', ')}\n`);

  for (const domain of domainsToProcess) {
    console.log(`Processing ${domain} domain...`);

    // Load components
    const components = await loadDomainComponents(domain);

    if (components.length === 0) {
      console.log(`  ⚠️  No components found for ${domain}`);
      continue;
    }

    console.log(`  ✓ Loaded ${components.length} components`);

    // Generate documentation
    const domainDocs = generateDomainDocumentation(domain, components);

    // Combine with base prompt
    const fullPrompt = basePrompt + domainDocs;

    // Write to file
    const outputPath = path.join(OUTPUT_DIR, `prompt2dsl-${domain}.md`);
    fs.writeFileSync(outputPath, fullPrompt, 'utf-8');

    console.log(`  ✓ Generated prompt: ${path.basename(outputPath)}`);
  }

  console.log(`\n✅ Generated ${domainsToProcess.length} domain-specific prompts in ${OUTPUT_DIR}`);
}

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let domains = DOMAINS;

  args.forEach(arg => {
    if (arg.startsWith('--domains=')) {
      domains = arg.split('=')[1].split(',');
    }
  });

  return { domains };
}

// Run the script
const { domains } = parseArgs();
generateDomainPrompts(domains).catch(error => {
  console.error('Error generating prompts:', error);
  process.exit(1);
});
