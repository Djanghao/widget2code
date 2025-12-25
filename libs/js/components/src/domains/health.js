/**
 * Health domain component library
 * Components for health, fitness, and wellness widgets
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateImage,
  generateCheckbox,
  generateDivider,
  generateIndicator,
  generateSparkline,
  generateProgressBar,
  generateProgressRing,
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateRadarChart,
  generateComposite,
} from "../generators.js";

const domain = "health";

// ============================================================================
// ICONS (10 components)
// ============================================================================

export const healthIcons = [
  generateIcon({
    id: "health-icon-heart-red-20",
    domain,
    iconName: "sf:heart.fill",
    size: 20,
    color: "#FF3B30",
    tags: ["heart", "cardio"],
  }),
  generateIcon({
    id: "health-icon-heart-red-32",
    domain,
    iconName: "sf:heart.fill",
    size: 32,
    color: "#FF3B30",
    tags: ["heart", "cardio"],
  }),
  generateIcon({
    id: "health-icon-figure-run-pink",
    domain,
    iconName: "sf:figure.run",
    size: 20,
    color: "#FA114F",
    tags: ["exercise", "activity"],
  }),
  generateIcon({
    id: "health-icon-flame-green",
    domain,
    iconName: "sf:flame.fill",
    size: 20,
    color: "#92E82D",
    tags: ["calories", "energy"],
  }),
  generateIcon({
    id: "health-icon-figure-walk-green",
    domain,
    iconName: "sf:figure.walk",
    size: 20,
    color: "#34C759",
    tags: ["steps", "walking"],
  }),
  generateIcon({
    id: "health-icon-bed-orange",
    domain,
    iconName: "sf:bed.double.fill",
    size: 20,
    color: "#FF9500",
    tags: ["sleep", "rest"],
  }),
  generateIcon({
    id: "health-icon-lungs-blue",
    domain,
    iconName: "sf:lungs.fill",
    size: 24,
    color: "#00D9FF",
    tags: ["breathing", "respiratory"],
  }),
  generateIcon({
    id: "health-icon-drop-blue",
    domain,
    iconName: "sf:drop.fill",
    size: 18,
    color: "#007AFF",
    tags: ["water", "hydration"],
  }),
  generateIcon({
    id: "health-icon-fork-knife",
    domain,
    iconName: "sf:fork.knife",
    size: 20,
    color: "#FF9500",
    tags: ["nutrition", "food"],
  }),
  generateIcon({
    id: "health-icon-figure-stairs",
    domain,
    iconName: "sf:figure.stairs",
    size: 20,
    color: "#5856D6",
    tags: ["stairs", "activity"],
  }),
];

// ============================================================================
// TEXT ELEMENTS (12 components)
// ============================================================================

export const healthText = [
  // Titles
  generateText({
    id: "health-text-title-activity",
    domain,
    content: "Activity",
    fontSize: 16,
    fontWeight: 600,
    color: "#000000",
    tags: ["title", "header"],
  }),
  generateText({
    id: "health-text-title-heart-rate",
    domain,
    content: "Heart Rate",
    fontSize: 15,
    fontWeight: 600,
    color: "#000000",
    tags: ["title", "header"],
  }),
  generateText({
    id: "health-text-title-sleep",
    domain,
    content: "Sleep",
    fontSize: 16,
    fontWeight: 600,
    color: "#000000",
    tags: ["title", "header"],
  }),

  // Labels
  generateText({
    id: "health-text-label-bpm",
    domain,
    content: "BPM",
    fontSize: 12,
    fontWeight: 600,
    color: "#8E8E93",
    tags: ["label", "unit"],
  }),
  generateText({
    id: "health-text-label-move",
    domain,
    content: "MOVE",
    fontSize: 11,
    fontWeight: 700,
    color: "#8E8E93",
    tags: ["label"],
  }),
  generateText({
    id: "health-text-label-exercise",
    domain,
    content: "EXERCISE",
    fontSize: 11,
    fontWeight: 700,
    color: "#8E8E93",
    tags: ["label"],
  }),
  generateText({
    id: "health-text-label-stand",
    domain,
    content: "STAND",
    fontSize: 11,
    fontWeight: 700,
    color: "#8E8E93",
    tags: ["label"],
  }),
  generateText({
    id: "health-text-label-steps",
    domain,
    content: "Steps",
    fontSize: 13,
    fontWeight: 500,
    color: "#8E8E93",
    tags: ["label"],
  }),

  // Values/Metrics
  generateText({
    id: "health-text-value-72-large",
    domain,
    content: "72",
    fontSize: 48,
    fontWeight: 200,
    color: "#FF3B30",
    tags: ["value", "metric", "heart-rate"],
  }),
  generateText({
    id: "health-text-value-8432",
    domain,
    content: "8,432",
    fontSize: 32,
    fontWeight: 600,
    color: "#000000",
    tags: ["value", "metric", "steps"],
  }),
  generateText({
    id: "health-text-value-350-cal",
    domain,
    content: "350",
    fontSize: 28,
    fontWeight: 600,
    color: "#FA114F",
    tags: ["value", "metric", "calories"],
  }),
  generateText({
    id: "health-text-goal-500",
    domain,
    content: "/ 500 CAL",
    fontSize: 12,
    fontWeight: 400,
    color: "#8E8E93",
    tags: ["goal", "target"],
  }),
];

// ============================================================================
// BUTTONS (3 components)
// ============================================================================

export const healthButtons = [
  generateButton({
    id: "health-button-log-workout",
    domain,
    label: "Log Workout",
    variant: "primary",
    size: "medium",
    tags: ["action", "workout"],
  }),
  generateButton({
    id: "health-button-view-details",
    domain,
    label: "View Details",
    variant: "secondary",
    size: "small",
    tags: ["action", "navigation"],
  }),
  generateButton({
    id: "health-button-start-timer",
    domain,
    label: "Start",
    variant: "primary",
    size: "small",
    tags: ["action", "timer"],
  }),
];

// ============================================================================
// IMAGES (2 components)
// ============================================================================

export const healthImages = [
  generateImage({
    id: "health-image-profile-small",
    domain,
    width: 40,
    height: 40,
    borderRadius: 20,
    tags: ["profile", "avatar"],
  }),
  generateImage({
    id: "health-image-activity-photo",
    domain,
    width: 120,
    height: 80,
    borderRadius: 8,
    tags: ["photo", "activity"],
  }),
];

// ============================================================================
// CHECKBOXES (2 components)
// ============================================================================

export const healthCheckboxes = [
  generateCheckbox({
    id: "health-checkbox-goal-complete",
    domain,
    checked: true,
    size: 20,
    tags: ["goal", "complete"],
  }),
  generateCheckbox({
    id: "health-checkbox-goal-incomplete",
    domain,
    checked: false,
    size: 20,
    tags: ["goal", "incomplete"],
  }),
];

// ============================================================================
// DIVIDERS (2 components)
// ============================================================================

export const healthDividers = [
  generateDivider({
    id: "health-divider-horizontal",
    domain,
    orientation: "horizontal",
    color: "#E5E5EA",
    thickness: 1,
    tags: ["separator"],
  }),
  generateDivider({
    id: "health-divider-vertical",
    domain,
    orientation: "vertical",
    color: "#E5E5EA",
    thickness: 1,
    tags: ["separator"],
  }),
];

// ============================================================================
// INDICATORS (3 components)
// ============================================================================

export const healthIndicators = [
  generateIndicator({
    id: "health-indicator-move-red",
    domain,
    color: "#FA114F",
    width: 4,
    height: 40,
    tags: ["move", "status"],
  }),
  generateIndicator({
    id: "health-indicator-exercise-green",
    domain,
    color: "#92E82D",
    width: 4,
    height: 40,
    tags: ["exercise", "status"],
  }),
  generateIndicator({
    id: "health-indicator-stand-blue",
    domain,
    color: "#00D9FF",
    width: 4,
    height: 40,
    tags: ["stand", "status"],
  }),
];

// ============================================================================
// SPARKLINES (3 components)
// ============================================================================

export const healthSparklines = [
  generateSparkline({
    id: "health-sparkline-heart-rate",
    domain,
    data: [68, 70, 72, 75, 73, 70, 68, 71, 72],
    width: 120,
    height: 40,
    color: "#FF3B30",
    lineWidth: 2,
    tags: ["heart-rate", "trend"],
  }),
  generateSparkline({
    id: "health-sparkline-steps",
    domain,
    data: [5000, 7200, 8400, 6800, 9200, 8100, 7500],
    width: 100,
    height: 30,
    color: "#34C759",
    lineWidth: 2,
    tags: ["steps", "trend"],
  }),
  generateSparkline({
    id: "health-sparkline-calories",
    domain,
    data: [280, 320, 350, 310, 380, 360, 340],
    width: 100,
    height: 30,
    color: "#FA114F",
    lineWidth: 2,
    tags: ["calories", "trend"],
  }),
];

// ============================================================================
// PROGRESS BARS (3 components)
// ============================================================================

export const healthProgressBars = [
  generateProgressBar({
    id: "health-progress-bar-steps",
    domain,
    progress: 0.68,
    width: 200,
    height: 8,
    color: "#34C759",
    backgroundColor: "#E5E5EA",
    tags: ["steps", "progress"],
  }),
  generateProgressBar({
    id: "health-progress-bar-calories",
    domain,
    progress: 0.85,
    width: 150,
    height: 6,
    color: "#FA114F",
    backgroundColor: "#E5E5EA",
    tags: ["calories", "progress"],
  }),
  generateProgressBar({
    id: "health-progress-bar-water",
    domain,
    progress: 0.5,
    width: 180,
    height: 8,
    color: "#007AFF",
    backgroundColor: "#E5E5EA",
    tags: ["water", "hydration", "progress"],
  }),
];

// ============================================================================
// PROGRESS RINGS (4 components)
// ============================================================================

export const healthProgressRings = [
  generateProgressRing({
    id: "health-progress-ring-move",
    domain,
    value: 350,
    goal: 500,
    size: 120,
    color: "#FA114F",
    ringWidth: 12,
    tags: ["move", "calories", "activity-ring"],
  }),
  generateProgressRing({
    id: "health-progress-ring-exercise",
    domain,
    value: 18,
    goal: 30,
    size: 100,
    color: "#92E82D",
    ringWidth: 10,
    tags: ["exercise", "activity-ring"],
  }),
  generateProgressRing({
    id: "health-progress-ring-stand",
    domain,
    value: 8,
    goal: 12,
    size: 80,
    color: "#00D9FF",
    ringWidth: 8,
    tags: ["stand", "activity-ring"],
  }),
  generateProgressRing({
    id: "health-progress-ring-sleep",
    domain,
    value: 7.5,
    goal: 8,
    size: 100,
    color: "#FF9500",
    ringWidth: 10,
    tags: ["sleep", "rest"],
  }),
];

// ============================================================================
// CHARTS (8 components)
// ============================================================================

export const healthCharts = [
  // Line Charts
  generateLineChart({
    id: "health-chart-heart-rate-line",
    domain,
    data: [65, 68, 72, 70, 75, 78, 73, 70, 68, 72, 75, 77],
    width: 200,
    height: 100,
    color: "#FF3B30",
    lineWidth: 2,
    smooth: true,
    tags: ["heart-rate", "time-series"],
  }),
  generateLineChart({
    id: "health-chart-weight-trend",
    domain,
    data: [175, 174, 173, 172, 171, 170, 170, 169],
    width: 180,
    height: 90,
    color: "#007AFF",
    lineWidth: 2,
    smooth: true,
    tags: ["weight", "trend"],
  }),

  // Bar Charts
  generateBarChart({
    id: "health-chart-steps-weekly",
    domain,
    data: [6200, 8400, 7300, 9100, 8800, 12500, 10200],
    width: 200,
    height: 100,
    color: "#34C759",
    tags: ["steps", "weekly"],
  }),
  generateBarChart({
    id: "health-chart-calories-daily",
    domain,
    data: [280, 320, 350, 310, 380, 360, 340, 370],
    width: 180,
    height: 90,
    color: "#FA114F",
    tags: ["calories", "daily"],
  }),

  // Pie Charts
  generatePieChart({
    id: "health-chart-activity-breakdown",
    domain,
    data: [350, 45, 8],
    labels: ["Move", "Exercise", "Stand"],
    size: 100,
    colors: ["#FA114F", "#92E82D", "#00D9FF"],
    tags: ["activity", "breakdown"],
  }),
  generatePieChart({
    id: "health-chart-sleep-phases",
    domain,
    data: [2.5, 3.5, 1.5],
    labels: ["Deep", "REM", "Light"],
    size: 90,
    colors: ["#5856D6", "#FF9500", "#FFCC00"],
    tags: ["sleep", "phases"],
  }),

  // Radar Chart
  generateRadarChart({
    id: "health-chart-wellness-radar",
    domain,
    data: [85, 70, 90, 65, 80, 75],
    labels: ["Activity", "Sleep", "Nutrition", "Hydration", "Mood", "Energy"],
    size: 150,
    color: "#007AFF",
    tags: ["wellness", "multi-dimensional"],
  }),

  // Line Chart for sleep
  generateLineChart({
    id: "health-chart-sleep-quality",
    domain,
    data: [7.2, 6.8, 7.5, 8.0, 7.3, 6.5, 7.8],
    width: 180,
    height: 80,
    color: "#FF9500",
    lineWidth: 2,
    smooth: true,
    tags: ["sleep", "quality"],
  }),
];

// ============================================================================
// COMPOSITE COMPONENTS (12 components)
// ============================================================================

export const healthComposites = [
  // Icon + Text combinations
  generateComposite({
    id: "health-composite-heart-rate-row",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:heart.fill", size: 16, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, color: "#000000", fontWeight: 500 }, content: "72 BPM" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["heart-rate", "metric-row"],
  }),

  generateComposite({
    id: "health-composite-steps-row",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:figure.walk", size: 16, color: "#34C759" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, color: "#000000", fontWeight: 500 }, content: "8,432 steps" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["steps", "metric-row"],
  }),

  generateComposite({
    id: "health-composite-calories-row",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:flame.fill", size: 16, color: "#FA114F" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, color: "#000000", fontWeight: 500 }, content: "350 cal" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["calories", "metric-row"],
  }),

  // Metric cards (label + value)
  generateComposite({
    id: "health-composite-move-card",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 11, color: "#8E8E93", fontWeight: 700 }, content: "MOVE" },
      { type: "leaf", component: "Text", props: { fontSize: 28, color: "#FA114F", fontWeight: 600 }, content: "350" },
      { type: "leaf", component: "Text", props: { fontSize: 12, color: "#8E8E93" }, content: "/ 500 CAL" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["move", "metric-card"],
  }),

  generateComposite({
    id: "health-composite-exercise-card",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 11, color: "#8E8E93", fontWeight: 700 }, content: "EXERCISE" },
      { type: "leaf", component: "Text", props: { fontSize: 28, color: "#92E82D", fontWeight: 600 }, content: "18" },
      { type: "leaf", component: "Text", props: { fontSize: 12, color: "#8E8E93" }, content: "/ 30 MIN" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["exercise", "metric-card"],
  }),

  generateComposite({
    id: "health-composite-stand-card",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 11, color: "#8E8E93", fontWeight: 700 }, content: "STAND" },
      { type: "leaf", component: "Text", props: { fontSize: 28, color: "#00D9FF", fontWeight: 600 }, content: "8" },
      { type: "leaf", component: "Text", props: { fontSize: 12, color: "#8E8E93" }, content: "/ 12 HRS" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["stand", "metric-card"],
  }),

  // Indicator + text combinations
  generateComposite({
    id: "health-composite-indicator-move",
    domain,
    nodes: [
      { type: "leaf", component: "Indicator", width: 4, height: 40, props: { color: "#FA114F" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, color: "#000000" }, content: "Move Goal" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["indicator", "move"],
  }),

  // Progress bar + label
  generateComposite({
    id: "health-composite-progress-steps",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 13, color: "#8E8E93", fontWeight: 500 }, content: "Steps" },
      { type: "leaf", component: "ProgressBar", width: 150, height: 6, props: { progress: 0.68, color: "#34C759", backgroundColor: "#E5E5EA" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, color: "#000000", fontWeight: 600 }, content: "8,432" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["progress", "steps"],
  }),

  generateComposite({
    id: "health-composite-progress-water",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 13, color: "#8E8E93", fontWeight: 500 }, content: "Water" },
      { type: "leaf", component: "ProgressBar", width: 150, height: 6, props: { progress: 0.5, color: "#007AFF", backgroundColor: "#E5E5EA" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, color: "#000000", fontWeight: 600 }, content: "4 / 8 cups" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["progress", "water", "hydration"],
  }),

  // Checkbox + text
  generateComposite({
    id: "health-composite-goal-complete",
    domain,
    nodes: [
      { type: "leaf", component: "Checkbox", props: { checked: true, size: 20 }},
      { type: "leaf", component: "Text", props: { fontSize: 15, color: "#000000" }, content: "Daily goal achieved" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["checkbox", "goal"],
  }),

  // Icon + value + sparkline
  generateComposite({
    id: "health-composite-heart-rate-trend",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:heart.fill", size: 20, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 32, color: "#FF3B30", fontWeight: 200 }, content: "72" },
      { type: "leaf", component: "Sparkline", width: 100, height: 30, props: { data: [68, 70, 72, 75, 73, 70, 68], color: "#FF3B30", lineWidth: 2 }},
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["heart-rate", "trend", "sparkline"],
  }),

  // Button + text
  generateComposite({
    id: "health-composite-workout-action",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, color: "#8E8E93" }, content: "Ready to start?" },
      { type: "leaf", component: "Button", props: { variant: "primary", size: "small" }, content: "Log Workout" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["button", "action", "workout"],
  }),
];

// ============================================================================
// EXPORT ALL HEALTH COMPONENTS
// ============================================================================

export const healthComponents = [
  ...healthIcons,
  ...healthText,
  ...healthButtons,
  ...healthImages,
  ...healthCheckboxes,
  ...healthDividers,
  ...healthIndicators,
  ...healthSparklines,
  ...healthProgressBars,
  ...healthProgressRings,
  ...healthCharts,
  ...healthComposites,
];

export const healthComponentStats = {
  domain: "health",
  total: healthComponents.length,
  byCategory: {
    icon: healthIcons.length,
    text: healthText.length,
    button: healthButtons.length,
    image: healthImages.length,
    checkbox: healthCheckboxes.length,
    divider: healthDividers.length,
    indicator: healthIndicators.length,
    chart: healthSparklines.length + healthCharts.length,
    progress: healthProgressBars.length + healthProgressRings.length,
    composite: healthComposites.length,
  },
};
