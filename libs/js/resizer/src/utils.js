/**
 * @file utils.js
 * @description Utility functions for widget resizing operations
 */

import { measureOverflow } from './measureOverflow.js';

const CHART_COMPONENTS = [
  'PieChart',
  'BarChart',
  'LineChart',
  'RadarChart',
  'StackedBarChart',
  'Sparkline',
];

/**
 * Waits for layout to stabilize using requestAnimationFrame
 * @returns {Promise<void>}
 */
export async function waitForLayoutStable() {
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
}

/**
 * Updates chart component dimensions to allow them to fill available space
 * and triggers ECharts resize
 * @param {HTMLElement} element - The widget container element
 */
function updateChartDimensions(element) {
  const selector = CHART_COMPONENTS.map(c => `[data-component="${c}"]`).join(', ');
  const chartWrappers = element.querySelectorAll(selector);

  console.log(`[updateChartDimensions] Found ${chartWrappers.length} chart wrappers`);

  chartWrappers.forEach((wrapper, i) => {
    wrapper.style.flex = '1';
    wrapper.style.display = 'flex';
    wrapper.style.minWidth = '0';
    wrapper.style.minHeight = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    const chartDiv = wrapper.querySelector(':scope > div');
    console.log(`[updateChartDimensions] Chart ${i}: wrapper found, chartDiv:`, chartDiv);
    if (chartDiv) {
      const beforeMax = chartDiv.style.maxWidth;
      chartDiv.style.maxWidth = 'none';
      chartDiv.style.maxHeight = 'none';
      console.log(`[updateChartDimensions] Chart ${i}: maxWidth ${beforeMax} -> none`);
    }
  });

  window.dispatchEvent(new Event('resize'));
}

/**
 * Applies size to element and measures overflow after layout stabilizes
 * @param {HTMLElement} element - The element to resize and measure
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {Promise<Object>} Measurement result from measureOverflow
 */
export async function applySizeAndMeasure(element, width, height) {
  if (!element) return { fits: false };

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  updateChartDimensions(element);

  await waitForLayoutStable();
  const m = measureOverflow(element);
  return m;
}
