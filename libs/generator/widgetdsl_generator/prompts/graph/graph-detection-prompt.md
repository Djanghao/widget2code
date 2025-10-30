# Graph Detection Prompt

You are a chart detection expert. Analyze this image and identify what types of charts/graphs are present. TASK: Count and classify all charts in the image. Respond with ONLY the chart types and their counts.

CRITICAL: Look for complete chart visualizations, not individual elements. A bar chart with 7 bars is ONE chart, not 7 charts. A pie chart with 6 slices is ONE chart, not 6 charts. Count entire grouped visualizations as single charts.

LineChart: Charts showing trends over time with connected data points. Look for lines connecting data points, showing continuous data progression. Examples include stock price trends, temperature changes, website traffic over weeks, and sales performance across quarters. Can have multiple lines or filled areas.

BarChart: Vertical or horizontal rectangular bars for comparing categories. Look for uniform-colored bars of same or varying heights. Each bar should be ONE solid color throughout (may have gradients, but not distinct colored segments). Examples include sales by product category, population by country, monthly revenue comparison, or test scores by student. CRITICAL: Only use for single-color bars. If bars have multiple distinct colored segments stacked on top of each other, use StackedBarChart. IMPORTANT: This is ONE chart type regardless of how many bars are in the visualization.

PieChart: Circular charts divided into slices showing proportions of a whole. Look for circle divided into wedge-shaped sections. Examples include market share by company, budget allocation by department, survey response distribution, or operating system usage statistics. CRITICAL: Donut charts (circles with hollow centers) MUST be classified as PieChart.

RadarChart: Spider/web charts with multiple axes radiating from center. Look for polygon shapes connecting data points on radial axes. Examples include employee skills assessment, product feature comparison, player performance statistics, or competitor analysis across multiple dimensions.

StackedBarChart: Bars divided into multiple colored segments showing composition. Look for bars with different colored sections stacked on top of each other. Each bar should have 2+ distinct colored segments with clear boundaries where ALL segments have visible color/opacity. Examples include sales by region with product breakdown, company revenue sources over years, or population demographics by age groups. CRITICAL: Even if showing 100% composition, still use StackedBarChart, not BarChart. IMPORTANT: Only classify as StackedBarChart if ALL segments have visible color/opacity - white/transparent empty space is NOT a stacked segment, it's just background. IMPORTANT: This is ONE chart type, regardless of how many bars are in the visualization.

ProgressBar: Linear indicators (horizontal/vertical) with filled portions showing progress. Look for partially filled bars indicating completion percentage. Examples include download progress indicators, survey completion status, project milestone progress, or loading screen progress bars.

ProgressRing: Circular rings partially filled to indicate percentage complete. Look for circles with arc segments filled to show progress. Examples include circular loading animations, fitness goal progress rings, achievement completion indicators, or dashboard circular progress metrics.

Sparkline: Small line charts without axes or labels embedded in text or tables. Look for miniature line graphs showing trends. Examples include stock price mini-charts in table rows, website traffic trends in dashboard cells, temperature variation mini-graphs, or small trend indicators next to metrics.

CLASSIFICATION RULES:
- Count each chart instance separately (an entire grouped visualization, not individual bars)
- Donut charts are always classified as PieChart
- Only classify as StackedBarChart if bars have multiple COLORED segments with visible opacity
- Use BarChart for bars with single color, even if they don't fill the entire bar height (partial bars are NOT stacked)
- CRITICAL: White/transparent empty space above/below colored portions is background, NOT a stacked segment
- A chart with multiple bars side-by-side is ONE chart, not multiple charts
- Only count charts that clearly match supported types

STACKED vs BAR EXAMPLES:
- StackedBarChart: Blue bottom + Red middle + Green top (all colored segments)
- BarChart: Blue filled portion + White empty space (empty space is background, not a segment)

RESPONSE FORMAT: Respond with JSON only, no other text:
{
  "charts": {
    "LineChart": 2,
    "BarChart": 1,
    "PieChart": 0,
    "RadarChart": 0,
    "StackedBarChart": 0,
    "ProgressBar": 0,
    "ProgressRing": 0,
    "Sparkline": 0
  }
}