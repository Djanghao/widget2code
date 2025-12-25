/**
 * Finance domain component library
 * Components for stocks, portfolios, transactions, and financial data
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateImage,
  generateDivider,
  generateIndicator,
  generateSparkline,
  generateProgressBar,
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateComposite,
} from "../generators.js";

const domain = "finance";

// ============================================================================
// ICONS (10 components)
// ============================================================================

export const financeIcons = [
  generateIcon({
    id: "finance-icon-chart-up-green",
    domain,
    iconName: "sf:chart.line.uptrend.xyaxis",
    size: 20,
    color: "#34C759",
    tags: ["chart", "growth"],
  }),
  generateIcon({
    id: "finance-icon-chart-down-red",
    domain,
    iconName: "sf:chart.line.downtrend.xyaxis",
    size: 20,
    color: "#FF3B30",
    tags: ["chart", "decline"],
  }),
  generateIcon({
    id: "finance-icon-dollarsign-green",
    domain,
    iconName: "sf:dollarsign.circle.fill",
    size: 24,
    color: "#34C759",
    tags: ["money", "currency"],
  }),
  generateIcon({
    id: "finance-icon-creditcard",
    domain,
    iconName: "sf:creditcard.fill",
    size: 20,
    color: "#007AFF",
    tags: ["payment", "card"],
  }),
  generateIcon({
    id: "finance-icon-banknote",
    domain,
    iconName: "sf:banknote.fill",
    size: 20,
    color: "#34C759",
    tags: ["cash", "money"],
  }),
  generateIcon({
    id: "finance-icon-arrow-up-green",
    domain,
    iconName: "sf:arrow.up",
    size: 16,
    color: "#34C759",
    tags: ["increase", "positive"],
  }),
  generateIcon({
    id: "finance-icon-arrow-down-red",
    domain,
    iconName: "sf:arrow.down",
    size: 16,
    color: "#FF3B30",
    tags: ["decrease", "negative"],
  }),
  generateIcon({
    id: "finance-icon-building-columns",
    domain,
    iconName: "sf:building.columns.fill",
    size: 20,
    color: "#5856D6",
    tags: ["bank", "institution"],
  }),
  generateIcon({
    id: "finance-icon-chart-pie",
    domain,
    iconName: "sf:chart.pie.fill",
    size: 20,
    color: "#FF9500",
    tags: ["portfolio", "distribution"],
  }),
  generateIcon({
    id: "finance-icon-wallet",
    domain,
    iconName: "sf:wallet.pass.fill",
    size: 20,
    color: "#007AFF",
    tags: ["wallet", "payment"],
  }),
];

// ============================================================================
// TEXT ELEMENTS (15 components)
// ============================================================================

export const financeText = [
  // Titles
  generateText({
    id: "finance-text-title-stocks",
    domain,
    content: "Stocks",
    fontSize: 16,
    fontWeight: 600,
    color: "#000000",
    tags: ["title", "header"],
  }),
  generateText({
    id: "finance-text-title-portfolio",
    domain,
    content: "Portfolio",
    fontSize: 16,
    fontWeight: 600,
    color: "#000000",
    tags: ["title", "header"],
  }),
  generateText({
    id: "finance-text-title-wallet",
    domain,
    content: "Wallet",
    fontSize: 15,
    fontWeight: 600,
    color: "#000000",
    tags: ["title", "header"],
  }),

  // Stock symbols
  generateText({
    id: "finance-text-symbol-aapl",
    domain,
    content: "AAPL",
    fontSize: 18,
    fontWeight: 700,
    color: "#000000",
    tags: ["symbol", "ticker"],
  }),
  generateText({
    id: "finance-text-symbol-googl",
    domain,
    content: "GOOGL",
    fontSize: 18,
    fontWeight: 700,
    color: "#000000",
    tags: ["symbol", "ticker"],
  }),
  generateText({
    id: "finance-text-symbol-tsla",
    domain,
    content: "TSLA",
    fontSize: 18,
    fontWeight: 700,
    color: "#000000",
    tags: ["symbol", "ticker"],
  }),

  // Stock prices
  generateText({
    id: "finance-text-price-142-50",
    domain,
    content: "$142.50",
    fontSize: 32,
    fontWeight: 600,
    color: "#000000",
    tags: ["price", "value"],
  }),
  generateText({
    id: "finance-text-price-2847-35",
    domain,
    content: "$2,847.35",
    fontSize: 28,
    fontWeight: 600,
    color: "#000000",
    tags: ["price", "value"],
  }),

  // Changes (positive/negative)
  generateText({
    id: "finance-text-change-positive",
    domain,
    content: "+$2.50 (1.79%)",
    fontSize: 14,
    fontWeight: 500,
    color: "#34C759",
    tags: ["change", "positive", "percentage"],
  }),
  generateText({
    id: "finance-text-change-negative",
    domain,
    content: "-$1.25 (0.87%)",
    fontSize: 14,
    fontWeight: 500,
    color: "#FF3B30",
    tags: ["change", "negative", "percentage"],
  }),

  // Labels
  generateText({
    id: "finance-text-label-total-value",
    domain,
    content: "Total Value",
    fontSize: 13,
    fontWeight: 500,
    color: "#8E8E93",
    tags: ["label"],
  }),
  generateText({
    id: "finance-text-label-daily-change",
    domain,
    content: "Today",
    fontSize: 12,
    fontWeight: 600,
    color: "#8E8E93",
    tags: ["label", "timeframe"],
  }),
  generateText({
    id: "finance-text-label-market-cap",
    domain,
    content: "Market Cap",
    fontSize: 12,
    fontWeight: 500,
    color: "#8E8E93",
    tags: ["label"],
  }),

  // Company names
  generateText({
    id: "finance-text-company-apple",
    domain,
    content: "Apple Inc.",
    fontSize: 14,
    fontWeight: 400,
    color: "#8E8E93",
    tags: ["company", "name"],
  }),
  generateText({
    id: "finance-text-company-alphabet",
    domain,
    content: "Alphabet Inc.",
    fontSize: 14,
    fontWeight: 400,
    color: "#8E8E93",
    tags: ["company", "name"],
  }),
];

// ============================================================================
// BUTTONS (3 components)
// ============================================================================

export const financeButtons = [
  generateButton({
    id: "finance-button-buy",
    domain,
    label: "Buy",
    variant: "primary",
    size: "small",
    tags: ["action", "trade"],
  }),
  generateButton({
    id: "finance-button-sell",
    domain,
    label: "Sell",
    variant: "secondary",
    size: "small",
    tags: ["action", "trade"],
  }),
  generateButton({
    id: "finance-button-view-details",
    domain,
    label: "View Details",
    variant: "secondary",
    size: "small",
    tags: ["action", "navigation"],
  }),
];

// ============================================================================
// IMAGES (2 components)
// ============================================================================

export const financeImages = [
  generateImage({
    id: "finance-image-company-logo",
    domain,
    width: 40,
    height: 40,
    borderRadius: 8,
    tags: ["logo", "company"],
  }),
  generateImage({
    id: "finance-image-card",
    domain,
    width: 150,
    height: 95,
    borderRadius: 12,
    tags: ["card", "payment"],
  }),
];

// ============================================================================
// DIVIDERS (2 components)
// ============================================================================

export const financeDividers = [
  generateDivider({
    id: "finance-divider-horizontal",
    domain,
    orientation: "horizontal",
    color: "#E5E5EA",
    thickness: 1,
    tags: ["separator"],
  }),
  generateDivider({
    id: "finance-divider-thin",
    domain,
    orientation: "horizontal",
    color: "#F2F2F7",
    thickness: 0.5,
    tags: ["separator", "subtle"],
  }),
];

// ============================================================================
// INDICATORS (3 components)
// ============================================================================

export const financeIndicators = [
  generateIndicator({
    id: "finance-indicator-positive-green",
    domain,
    color: "#34C759",
    width: 4,
    height: 40,
    tags: ["positive", "status"],
  }),
  generateIndicator({
    id: "finance-indicator-negative-red",
    domain,
    color: "#FF3B30",
    width: 4,
    height: 40,
    tags: ["negative", "status"],
  }),
  generateIndicator({
    id: "finance-indicator-neutral-blue",
    domain,
    color: "#007AFF",
    width: 4,
    height: 40,
    tags: ["neutral", "status"],
  }),
];

// ============================================================================
// SPARKLINES (4 components)
// ============================================================================

export const financeSparklines = [
  generateSparkline({
    id: "finance-sparkline-stock-up",
    domain,
    data: [138, 140, 139, 142, 144, 143, 145, 148],
    width: 100,
    height: 30,
    color: "#34C759",
    lineWidth: 2,
    tags: ["stock", "trend", "positive"],
  }),
  generateSparkline({
    id: "finance-sparkline-stock-down",
    domain,
    data: [152, 150, 148, 145, 147, 143, 140, 138],
    width: 100,
    height: 30,
    color: "#FF3B30",
    lineWidth: 2,
    tags: ["stock", "trend", "negative"],
  }),
  generateSparkline({
    id: "finance-sparkline-portfolio",
    domain,
    data: [48200, 48500, 49100, 48800, 50200, 51000, 50800],
    width: 120,
    height: 40,
    color: "#007AFF",
    lineWidth: 2,
    tags: ["portfolio", "trend"],
  }),
  generateSparkline({
    id: "finance-sparkline-crypto",
    domain,
    data: [42000, 43500, 42800, 44200, 45100, 44500, 46000],
    width: 100,
    height: 30,
    color: "#FF9500",
    lineWidth: 2,
    tags: ["crypto", "trend"],
  }),
];

// ============================================================================
// PROGRESS BARS (2 components)
// ============================================================================

export const financeProgressBars = [
  generateProgressBar({
    id: "finance-progress-bar-goal",
    domain,
    progress: 0.75,
    width: 200,
    height: 8,
    color: "#34C759",
    backgroundColor: "#E5E5EA",
    tags: ["goal", "savings"],
  }),
  generateProgressBar({
    id: "finance-progress-bar-allocation",
    domain,
    progress: 0.6,
    width: 150,
    height: 6,
    color: "#007AFF",
    backgroundColor: "#E5E5EA",
    tags: ["allocation", "distribution"],
  }),
];

// ============================================================================
// CHARTS (10 components)
// ============================================================================

export const financeCharts = [
  // Line Charts
  generateLineChart({
    id: "finance-chart-stock-price-line",
    domain,
    data: [138, 140, 142, 141, 144, 147, 145, 148, 150, 149, 152, 151],
    width: 250,
    height: 120,
    color: "#34C759",
    lineWidth: 2,
    smooth: true,
    tags: ["stock", "price", "time-series"],
  }),
  generateLineChart({
    id: "finance-chart-portfolio-value",
    domain,
    data: [45000, 46200, 47500, 47000, 48200, 50100, 51500, 52000],
    width: 220,
    height: 100,
    color: "#007AFF",
    lineWidth: 2,
    smooth: true,
    tags: ["portfolio", "value", "time-series"],
  }),
  generateLineChart({
    id: "finance-chart-crypto-price",
    domain,
    data: [42000, 43500, 42800, 44200, 45100, 44500, 46000, 47200],
    width: 200,
    height: 100,
    color: "#FF9500",
    lineWidth: 2,
    smooth: false,
    tags: ["crypto", "price", "volatile"],
  }),

  // Bar Charts
  generateBarChart({
    id: "finance-chart-monthly-spending",
    domain,
    data: [2400, 2800, 2200, 3100, 2700, 2500, 2900],
    width: 200,
    height: 100,
    color: "#FF3B30",
    tags: ["spending", "monthly"],
  }),
  generateBarChart({
    id: "finance-chart-quarterly-revenue",
    domain,
    data: [125000, 138000, 142000, 156000],
    width: 180,
    height: 90,
    color: "#34C759",
    tags: ["revenue", "quarterly"],
  }),
  generateBarChart({
    id: "finance-chart-weekly-transactions",
    domain,
    data: [15, 22, 18, 25, 20, 19, 23],
    width: 150,
    height: 80,
    color: "#007AFF",
    tags: ["transactions", "weekly"],
  }),

  // Pie Charts
  generatePieChart({
    id: "finance-chart-portfolio-allocation",
    domain,
    data: [45, 30, 15, 10],
    labels: ["Stocks", "Bonds", "Crypto", "Cash"],
    size: 120,
    colors: ["#007AFF", "#34C759", "#FF9500", "#8E8E93"],
    tags: ["portfolio", "allocation", "distribution"],
  }),
  generatePieChart({
    id: "finance-chart-expense-breakdown",
    domain,
    data: [1200, 800, 600, 400, 500],
    labels: ["Housing", "Food", "Transport", "Entertainment", "Other"],
    size: 110,
    colors: ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#8E8E93"],
    tags: ["expenses", "breakdown"],
  }),
  generatePieChart({
    id: "finance-chart-asset-distribution",
    domain,
    data: [60, 25, 15],
    labels: ["Equity", "Fixed Income", "Alternatives"],
    size: 100,
    colors: ["#007AFF", "#34C759", "#5856D6"],
    tags: ["assets", "distribution"],
  }),

  // Line chart for comparison
  generateLineChart({
    id: "finance-chart-market-comparison",
    domain,
    data: [100, 102, 105, 104, 108, 112, 110, 115],
    width: 200,
    height: 90,
    color: "#5856D6",
    lineWidth: 2,
    smooth: true,
    tags: ["market", "index", "comparison"],
  }),
];

// ============================================================================
// COMPOSITE COMPONENTS (14 components)
// ============================================================================

export const financeComposites = [
  // Stock ticker rows
  generateComposite({
    id: "finance-composite-stock-row-aapl",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 700, color: "#000000" }, content: "AAPL" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "$142.50" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "+1.79%" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["stock", "ticker-row"],
  }),

  generateComposite({
    id: "finance-composite-stock-row-tsla",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 700, color: "#000000" }, content: "TSLA" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "$238.45" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#FF3B30" }, content: "-0.87%" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["stock", "ticker-row"],
  }),

  // Icon + change
  generateComposite({
    id: "finance-composite-change-positive",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:arrow.up", size: 14, color: "#34C759" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "+$2.50 (1.79%)" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["change", "positive"],
  }),

  generateComposite({
    id: "finance-composite-change-negative",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:arrow.down", size: 14, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#FF3B30" }, content: "-$1.25 (0.87%)" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["change", "negative"],
  }),

  // Price + sparkline
  generateComposite({
    id: "finance-composite-price-sparkline",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 28, fontWeight: 600, color: "#000000" }, content: "$142.50" },
      { type: "leaf", component: "Sparkline", width: 100, height: 30, props: { data: [138, 140, 139, 142, 144, 143, 145], color: "#34C759", lineWidth: 2 }},
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["price", "sparkline", "trend"],
  }),

  // Symbol + company + price
  generateComposite({
    id: "finance-composite-stock-detail",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 700, color: "#000000" }, content: "AAPL" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "Apple Inc." },
      { type: "leaf", component: "Text", props: { fontSize: 24, fontWeight: 600, color: "#000000" }, content: "$142.50" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "+$2.50 (1.79%)" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["stock", "detail-card"],
  }),

  // Indicator + stock info
  generateComposite({
    id: "finance-composite-indicator-stock",
    domain,
    nodes: [
      { type: "leaf", component: "Indicator", width: 4, height: 50, props: { color: "#34C759" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "AAPL" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "+1.79%" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["indicator", "stock"],
  }),

  // Portfolio summary
  generateComposite({
    id: "finance-composite-portfolio-summary",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "Total Value" },
      { type: "leaf", component: "Text", props: { fontSize: 32, fontWeight: 600, color: "#000000" }, content: "$52,847" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "+$1,247 (2.41%)" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["portfolio", "summary"],
  }),

  // Transaction item
  generateComposite({
    id: "finance-composite-transaction-item",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:creditcard.fill", size: 20, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "Amazon Purchase" },
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#FF3B30" }, content: "-$89.99" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["transaction", "item"],
  }),

  // Balance card
  generateComposite({
    id: "finance-composite-balance-card",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:dollarsign.circle.fill", size: 24, color: "#34C759" }},
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 500, color: "#8E8E93" }, content: "Available Balance" },
      { type: "leaf", component: "Text", props: { fontSize: 28, fontWeight: 600, color: "#000000" }, content: "$12,450.00" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["balance", "account"],
  }),

  // Goal progress
  generateComposite({
    id: "finance-composite-savings-goal",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#000000" }, content: "Savings Goal" },
      { type: "leaf", component: "ProgressBar", width: 180, height: 8, props: { progress: 0.75, color: "#34C759", backgroundColor: "#E5E5EA" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "$7,500 / $10,000" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["savings", "goal", "progress"],
  }),

  // Action buttons
  generateComposite({
    id: "finance-composite-trade-buttons",
    domain,
    nodes: [
      { type: "leaf", component: "Button", props: { variant: "primary", size: "small" }, content: "Buy" },
      { type: "leaf", component: "Button", props: { variant: "secondary", size: "small" }, content: "Sell" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["button", "trade", "action"],
  }),

  // Market cap
  generateComposite({
    id: "finance-composite-market-cap",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 500, color: "#8E8E93" }, content: "Market Cap" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "$2.8T" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["market-cap", "metric"],
  }),

  // Dividend info
  generateComposite({
    id: "finance-composite-dividend",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:banknote.fill", size: 18, color: "#34C759" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "Dividend" },
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#34C759" }, content: "$0.24" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["dividend", "income"],
  }),
];

// ============================================================================
// EXPORT ALL FINANCE COMPONENTS
// ============================================================================

export const financeComponents = [
  ...financeIcons,
  ...financeText,
  ...financeButtons,
  ...financeImages,
  ...financeDividers,
  ...financeIndicators,
  ...financeSparklines,
  ...financeProgressBars,
  ...financeCharts,
  ...financeComposites,
];

export const financeComponentStats = {
  domain: "finance",
  total: financeComponents.length,
  byCategory: {
    icon: financeIcons.length,
    text: financeText.length,
    button: financeButtons.length,
    image: financeImages.length,
    divider: financeDividers.length,
    indicator: financeIndicators.length,
    chart: financeSparklines.length + financeCharts.length,
    progress: financeProgressBars.length,
    composite: financeComposites.length,
  },
};
