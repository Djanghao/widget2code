/**
 * @file headless-main.jsx
 * @description Entry point for headless rendering mode.
 * Provides minimal React app for automated widget rendering.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import HeadlessRenderer from './HeadlessRenderer.jsx';

window.__headlessMode = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <HeadlessRenderer />
);
