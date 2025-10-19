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
