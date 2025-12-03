import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.join(__dirname, "../../../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

loadEnv();

const OUTPUT_DIR = path.join(__dirname, "../data/descriptions/llm-generated");
const BACKEND_PORT = process.env.BACKEND_PORT || "8010";
const API_KEY = process.env.DASHSCOPE_API_KEY;

const DOMAINS = [
  "health",
  "finance",
  "weather",
  "productivity",
  "media",
  "communication",
  "smart-home",
  "navigation",
  "utilities",
  "sports",
  "travel",
  "food",
  "shopping",
  "social",
];

const COMPLEXITY_LEVELS = ["simple", "medium", "complex"];

const ASPECT_RATIOS = [
  { value: 0.5, description: "tall (1:2)" },
  { value: 0.67, description: "portrait (2:3)" },
  { value: 0.75, description: "slightly tall (3:4)" },
  { value: 1.0, description: "square (1:1)" },
  { value: 1.33, description: "slightly wide (4:3)" },
  { value: 1.5, description: "landscape (3:2)" },
  { value: 2.0, description: "wide (2:1)" },
  { value: 2.5, description: "very wide (5:2)" },
  { value: 3.0, description: "ultra-wide (3:1)" },
];

function getDomainContext(domain) {
  const contexts = {
    health: "fitness tracking, health metrics, workouts, nutrition, sleep, medical data, wellness",
    finance: "stock prices, portfolios, accounts, transactions, budgets, crypto, savings, investments",
    weather: "temperature, forecasts, precipitation, wind, UV index, air quality, severe weather alerts",
    productivity: "tasks, calendars, notes, reminders, time tracking, focus timers, project management",
    media: "music players, podcasts, streaming, albums, playlists, radio, audio controls",
    communication: "email, messages, calls, contacts, notifications, video calls, chat",
    "smart-home": "devices, thermostats, locks, lighting, cameras, automation, energy monitoring",
    navigation: "maps, directions, travel time, traffic, landmarks, routes, location",
    utilities: "calculator, notes, lists, timers, stopwatch, settings, tools",
    sports: "scores, stats, teams, leagues, players, matches, standings, live updates",
    travel: "flights, hotels, itineraries, bookings, attractions, reviews, travel plans",
    food: "recipes, restaurants, nutrition, meal plans, grocery lists, reviews, cooking",
    shopping: "products, deals, orders, wishlists, reviews, tracking, recommendations",
    social: "profiles, posts, stories, followers, events, photos, feeds, interactions",
  };
  return contexts[domain] || "general information";
}

const COMPONENT_LIBRARY = {
  primitives: {
    Text: "Display text (fontSize, fontWeight, color)",
    Icon: "Display icons (name, size, color)",
    Button: "Interactive button (variant, size, label)",
    Image: "Display images (src, width, height, borderRadius)",
    MapImage: "Display maps (latitude, longitude, zoom)",
    AppLogo: "Display app logo (letter, backgroundColor, textColor)",
    Checkbox: "Display checkbox (checked, size)",
    Divider: "Display separator (orientation, color, thickness)",
    Indicator: "Display status indicator (color, width, height)",
  },
  progress: {
    ProgressBar: "Linear progress bar (progress, color, width, height)",
    ProgressRing: "Circular progress ring (value, goal, size, color, ringWidth)",
  },
  charts: {
    Sparkline: "Mini trend chart (data, color, lineWidth) - for inline trends",
    LineChart: "Full line chart (data, color, lineWidth, smooth) - for time-series",
    BarChart: "Bar chart (data, color) - for comparisons",
    StackedBarChart: "Stacked bars (data, colors) - for composition/breakdown",
    RadarChart: "Radar/spider chart (data, labels, color) - for multi-dimensional metrics",
    PieChart: "Pie chart (data, labels, colors) - for proportions/percentages",
  },
};

function getComponentLibraryPrompt() {
  return `
**Available Component Library:**

You can reference these components when designing widgets:

**Basic Components:**
${Object.entries(COMPONENT_LIBRARY.primitives).map(([name, desc]) => `  - ${name}: ${desc}`).join('\n')}

**Progress Components:**
${Object.entries(COMPONENT_LIBRARY.progress).map(([name, desc]) => `  - ${name}: ${desc}`).join('\n')}

**Chart Components:**
${Object.entries(COMPONENT_LIBRARY.charts).map(([name, desc]) => `  - ${name}: ${desc}`).join('\n')}

Use these components when describing what elements should appear in widgets.
For example: "widget with Text showing title, ProgressRing for completion, and Sparkline for trend"`;
}

async function generateDescriptionsWithLLM(domain, count = 50) {
  const domainContext = getDomainContext(domain);
  const componentLibrary = getComponentLibraryPrompt();

  const systemPrompt = `You are an expert UI/UX designer specializing in mobile widget design.
Your task is to generate diverse, creative widget descriptions for the ${domain} domain.

Guidelines:
- Each widget should display relevant ${domainContext}
- Widgets can range from simple (1-3 elements) to complex (5+ elements with charts/graphs)
- Consider different layouts: compact, detailed, minimal, dashboard-style
- Reference available components when describing visualizations
- Be specific about what data is shown and how it's displayed
- Each description should be unique and creative
- Specify aspect ratios that make sense for the content

${componentLibrary}

Output format: JSON array of objects with:
{
  "id": "unique-id",
  "prompt": "description of the widget",
  "complexity": "simple|medium|complex",
  "aspectRatio": number between 0.5 and 3.0,
  "visualizationType": ["Text", "Icon", "LineChart", etc.] (use component names from library)
}`;

  const userPrompt = `Generate ${count} diverse widget descriptions for the ${domain} domain.

For each widget:
1. Create a clear, detailed description of what it displays and how
2. Assign appropriate complexity level (simple/medium/complex)
3. Choose an aspect ratio (0.5-3.0) that fits the content:
   - 0.5-0.75: Tall widgets (good for vertical lists, timelines)
   - 0.75-1.0: Portrait/square (balanced, versatile)
   - 1.0-1.5: Slightly wide (good for dashboards)
   - 1.5-2.5: Wide (good for charts, media players)
   - 2.5-3.0: Very wide (good for timelines, multiple metrics)
4. List visualization types used

Examples for ${domain}:
${domain === "health" ? `
- "Widget with Icon (heart), Text (BPM value), Text (label 'Heart Rate')" → complexity: simple, aspectRatio: 1.0, visualizationType: ["Icon", "Text"]
- "Widget with three ProgressRing components (steps/calories/exercise), Text labels, Text percentages" → complexity: medium, aspectRatio: 1.33, visualizationType: ["ProgressRing", "Text"]
- "Widget with LineChart (weekly heart rate), Text (current BPM), Text (resting/high/low values), Icon (heart)" → complexity: complex, aspectRatio: 1.5, visualizationType: ["LineChart", "Text", "Icon"]
` : domain === "finance" ? `
- "Widget with Icon (stock symbol), Text (company name), Text (price), Text (percent change with color)" → complexity: simple, aspectRatio: 0.75, visualizationType: ["Icon", "Text"]
- "Widget with 4 containers, each with Text (symbol), Text (price), Sparkline (trend)" → complexity: medium, aspectRatio: 1.5, visualizationType: ["Text", "Sparkline"]
- "Widget with Text (total value), LineChart (daily change), Text list (holdings), PieChart (allocation)" → complexity: complex, aspectRatio: 2.0, visualizationType: ["Text", "LineChart", "PieChart"]
` : `
- Simple: Icon + Text (key metric) → aspectRatio: 0.75-1.0, visualizationType: ["Icon", "Text"]
- Medium: Multiple Text fields, ProgressBar or Sparkline → aspectRatio: 1.0-1.5, visualizationType: ["Text", "ProgressBar", "Sparkline"]
- Complex: LineChart or BarChart with Text annotations → aspectRatio: 1.5-2.5, visualizationType: ["LineChart", "Text"]
`}

Return ONLY a valid JSON array, no additional text.`;

  try {
    console.log(`   Calling LLM API for ${domain}...`);
    const formData = new FormData();
    formData.append("system_prompt", systemPrompt);
    formData.append("user_prompt", userPrompt);
    if (API_KEY) {
      formData.append("api_key", API_KEY);
    }

    const response = await fetch(
      `http://localhost:${BACKEND_PORT}/api/generate-widget-text`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error || error.detail}`);
    }

    const result = await response.json();

    let descriptions;
    const content = result.widgetDSL?.widget?.content || result.content || result;

    if (typeof content === 'string') {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        descriptions = JSON.parse(jsonMatch[0]);
      } else {
        descriptions = JSON.parse(content);
      }
    } else if (Array.isArray(content)) {
      descriptions = content;
    } else {
      throw new Error("Unexpected response format from LLM");
    }

    if (!Array.isArray(descriptions)) {
      throw new Error("LLM did not return a JSON array");
    }

    const processedDescriptions = descriptions.map((desc, index) => {
      const id = desc.id || `${domain}-llm-${String(index + 1).padStart(3, "0")}`;

      let aspectRatio = desc.aspectRatio || 1.0;
      aspectRatio = Math.max(0.5, Math.min(3.0, aspectRatio));

      return {
        id,
        prompt: desc.prompt || desc.description || desc.text,
        complexity: desc.complexity || "medium",
        aspectRatio: parseFloat(aspectRatio.toFixed(2)),
        visualizationType: desc.visualizationType || ["text", "icon"],
        llmGenerated: true,
      };
    });

    console.log(`   Generated ${processedDescriptions.length} descriptions`);
    return processedDescriptions;
  } catch (error) {
    console.error(`   Failed to generate descriptions for ${domain}:`, error.message);
    return generateFallbackDescriptions(domain, count);
  }
}

function generateFallbackDescriptions(domain, count) {
  console.log(`   Using fallback: generating ${count} template-based descriptions`);
  const descriptions = [];
  const domainContext = getDomainContext(domain);
  const keywords = domainContext.split(", ");

  for (let i = 0; i < count; i++) {
    const complexity = COMPLEXITY_LEVELS[i % COMPLEXITY_LEVELS.length];
    const aspectRatio = ASPECT_RATIOS[i % ASPECT_RATIOS.length];
    const keyword = keywords[i % keywords.length];

    descriptions.push({
      id: `${domain}-llm-fallback-${String(i + 1).padStart(3, "0")}`,
      prompt: `A ${complexity} widget displaying ${keyword} information with ${aspectRatio.description} layout`,
      complexity,
      aspectRatio: aspectRatio.value,
      visualizationType: complexity === "simple" ? ["text", "icon"] :
                         complexity === "medium" ? ["text", "icon", "chart"] :
                         ["text", "icon", "chart", "progress", "graph"],
      llmGenerated: false,
      fallback: true,
    });
  }

  return descriptions;
}

async function generateAllDomains(options = {}) {
  const {
    domains = DOMAINS,
    count = 50,
    limit = null,
  } = options;

  console.log("Starting LLM-powered description generation...\n");
  console.log(`Domains: ${domains.join(", ")}`);
  console.log(`Descriptions per domain: ${count}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const selectedDomains = limit ? domains.slice(0, limit) : domains;

  for (const domain of selectedDomains) {
    console.log(`\nProcessing domain: ${domain}`);

    const descriptions = await generateDescriptionsWithLLM(domain, count);

    const outputFile = path.join(OUTPUT_DIR, `${domain}-llm-descriptions.json`);
    fs.writeFileSync(
      outputFile,
      JSON.stringify(
        {
          domain,
          generatedAt: new Date().toISOString(),
          count: descriptions.length,
          descriptions,
        },
        null,
        2
      ),
      "utf-8"
    );

    console.log(`   Saved to: ${outputFile}`);

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nLLM description generation complete!");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    domains: DOMAINS,
    count: 50,
    limit: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--domains" && i + 1 < args.length) {
      options.domains = args[i + 1].split(",").map((d) => d.trim());
      i++;
    } else if (arg === "--count" && i + 1 < args.length) {
      options.count = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === "--limit" && i + 1 < args.length) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: node generate-llm-descriptions.js [options]

Options:
  --domains=D1,D2   Comma-separated list of domains (default: all)
  --count=N         Number of descriptions per domain (default: 50)
  --limit=N         Limit number of domains to process (default: all)
  --help, -h        Show this help message

Examples:
  node generate-llm-descriptions.js
  node generate-llm-descriptions.js --domains=health,finance --count=100
  node generate-llm-descriptions.js --limit=3
`);
      process.exit(0);
    }
  }

  return options;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const options = parseArgs();
  generateAllDomains(options);
}

export { generateDescriptionsWithLLM, generateAllDomains };
