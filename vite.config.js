import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Fail the BUILD (not the running page) if a production bundle would ship pointed at a
// plaintext http:// backend. Runtime only warns; this is the hard guarantee, caught in CI.
function enforceSecureBackend() {
  return {
    name: 'enforce-secure-backend',
    apply: 'build',
    configResolved(cfg) {
      if (!cfg.isProduction) return
      const env = loadEnv(cfg.mode, cfg.root, '')
      // Demo mode must never ship in a production bundle — it swaps the real hub for a
      // scripted in-memory one. config.js also forces IS_DEMO off in prod; fail loud here too.
      if (env.VITE_DEMO_MODE === 'true') {
        throw new Error(
          '[enforce-secure-backend] Refusing to build a production bundle with VITE_DEMO_MODE=true. ' +
          'Demo mode is for local/dev use only; unset it for production builds.'
        )
      }
      // Mirror config.js: an unset (or whitespace-only) VITE_BACKEND_URL defaults to
      // http://localhost:5000. Trim FIRST, then fall back, so "   " does not slip through as an
      // empty string that fails the http:// test. Compare case-insensitively.
      const backend = (env.VITE_BACKEND_URL || '').trim() || 'http://localhost:5000'
      // `vite build` is always a production build (NODE_ENV=production), so this rejects a
      // plaintext or unset backend for EVERY build — there is no override and no plaintext bundle
      // can be produced. For local development against an http backend, use the dev server
      // (`npm run dev`), which is not a build and is not subject to this guard.
      if (backend.toLowerCase().startsWith('http://')) {
        throw new Error(
          '[enforce-secure-backend] Refusing to build a production bundle pointed at a plaintext ' +
          'http:// backend (VITE_BACKEND_URL=' + (env.VITE_BACKEND_URL || '<unset, defaults to http://localhost:5000>') + '). ' +
          'Builds require an https:// VITE_BACKEND_URL. For local development against an http ' +
          'backend, use the dev server (`npm run dev`) instead of a build.'
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), enforceSecureBackend()],
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
