import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    // Never ship source maps to production — they defeat minification/obfuscation
    // and expose internal structure. Enable locally with `vite build --mode debug`.
    sourcemap: mode === 'debug',
    minify: true, // oxc minifier (Vite 8 / rolldown default)
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Deterministic vendor split keeps app code (the part we obfuscate) small.
        // Vite 8 (rolldown) requires the function form.
        manualChunks(id) {
          if (id.includes('node_modules/@microsoft/signalr')) return 'signalr'
          if (id.includes('node_modules')) return 'vendor'
          return undefined
        },
      },
    },
  },
  // Vite 8 transpiles with oxc (esbuild options are ignored).
  // Strip console/debugger from production bundles so no diagnostic strings leak.
  oxc: {
    ...(mode === 'production' ? { compress: { dropConsole: true, dropDebugger: true } } : {}),
  },
  server: {
    // Dev server: bind to loopback only; do not expose HMR on the LAN by default.
    host: '127.0.0.1',
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'], reportsDirectory: 'coverage' },
  },
}))
