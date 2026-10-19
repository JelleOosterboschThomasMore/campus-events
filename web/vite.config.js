import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // Every call to /api/... is forwarded to the Express API.
    // The browser only talks to one origin, so no CORS needed in development.
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  test: {
    environment: 'happy-dom'
  }
});
