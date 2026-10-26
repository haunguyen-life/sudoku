import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Gộp three và RoomEnvironment vào cùng một bản bundle để tránh hai instance của Three.js.
    include: ['three', 'three/examples/jsm/environments/RoomEnvironment.js'],
  },
});
