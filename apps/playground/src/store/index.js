/**
 * @file index.js
 * @description Zustand store configuration for playground state management.
 * Combines rendering slice with devtools middleware for debugging.
 * Provides centralized state for widget compilation and rendering pipeline.
 * @author Houston Zhang
 * @date 2025-10-17
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import createRenderingSlice from './slices/renderingSlice.js';

const usePlaygroundStore = create(
  devtools((set, get) => ({
    ...createRenderingSlice(set, get)
  }), {
    name: 'PlaygroundStore'
  })
);

export default usePlaygroundStore;
