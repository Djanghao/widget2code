import React from 'react';
import { createRoot } from 'react-dom/client';
import BatchRenderer from './BatchRenderer.jsx';

const container = document.getElementById('widget-container');
const root = createRoot(container);

root.render(<BatchRenderer />);
