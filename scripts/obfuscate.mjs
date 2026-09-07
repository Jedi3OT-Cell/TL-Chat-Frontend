// scripts/obfuscate.mjs — optional post-build hardening step.
//
// Runs javascript-obfuscator over the application chunks in dist/assets.
// Vendor chunks (react, signalr) are left alone: obfuscating them adds size
// and risk for no protective value, since their source is public anyway.
//
// Usage:  OBFUSCATE=1 npm run build      (or: npm run build:hardened)
//
// Obfuscation raises the cost of casual reverse-engineering; it is NOT a
// security control. Never rely on it to hide secrets — anything shipped to
// the browser must be assumed readable. See docs/THREAT-MODEL.md.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const ASSETS = join(process.cwd(), 'dist', 'assets');
const SKIP = /^(vendor|signalr)-/;

if (process.env.OBFUSCATE !== '1') {
  console.log('[obfuscate] OBFUSCATE!=1 — skipping');
  process.exit(0);
}

const options = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  // Keep the bundle debuggable by the build system: no domain lock, no source map
  sourceMap: false,
  target: 'browser',
};

let processed = 0;
for (const file of readdirSync(ASSETS)) {
  if (!file.endsWith('.js') || SKIP.test(file)) continue;
  const path = join(ASSETS, file);
  // Read once and derive the size from the content — no stat-then-use (TOCTOU).
  const source = readFileSync(path, 'utf8');
  const out = JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode();
  writeFileSync(path, out);
  console.log(`[obfuscate] ${file}: ${source.length} -> ${out.length} bytes`);
  processed++;
}
if (processed === 0) {
  console.error('[obfuscate] no application chunks found in dist/assets');
  process.exit(1);
}
