// Standardized API - recommended for most use cases
export {
  initializeRenderer,
  renderWidget,
  renderWidgetFromJSX,
  closeRenderer,
  getRendererInstance,
  saveImage,
  generateFilename,
  renderAndSave,
  // batchRender
} from "./api.js";

// Advanced: Export class for cases requiring direct control (e.g., concurrent rendering)
export { PlaywrightRenderer } from "./PlaywrightRenderer.js";
export { renderSingleWidget } from "./renderSingleWidget.js";
export { batchRender } from "./batchRender.js";
