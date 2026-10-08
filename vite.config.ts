import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Its own port, so it doesn't collide with other projects' dev servers on the default 5173.
  server: { port: 5190 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
