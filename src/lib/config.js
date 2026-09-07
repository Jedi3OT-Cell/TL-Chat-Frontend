// config.js — single source of truth for runtime configuration.
// Values come from Vite env vars (VITE_* prefix) so that no environment-specific
// host, port or secret is ever committed to source. See .env.example.

const DEFAULT_BACKEND = "http://localhost:5000";

function normalizeUrl(raw) {
  if (!raw) return DEFAULT_BACKEND;
  const trimmed = String(raw).trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("VITE_BACKEND_URL must be an absolute http(s) URL");
  }
  return trimmed;
}

/** Base URL of the E.D.I.T.H chat backend (REST + SignalR hub). */
export const BACKEND = normalizeUrl(import.meta.env.VITE_BACKEND_URL);

/** SignalR hub endpoint. */
export const CHAT_HUB_URL = `${BACKEND}/chathub`;

/** True when the bundle was built with `vite build` (production). */
export const IS_PRODUCTION = import.meta.env.PROD === true;

/** Standalone demo mode: an in-memory scripted hub + REST stub, no backend required. */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

/**
 * Warn (do NOT throw — throwing at module load white-screens the whole SPA) when a
 * production bundle points at a plaintext backend. The hard guarantee is enforced at
 * BUILD time by the enforceSecureBackend plugin in vite.config.js, which fails the
 * build so a misconfiguration is caught in CI/deploy rather than in the user's browser.
 */
export const INSECURE_BACKEND =
  IS_PRODUCTION &&
  BACKEND.startsWith("http://") &&
  import.meta.env.VITE_ALLOW_INSECURE_BACKEND !== "true";

if (INSECURE_BACKEND && typeof console !== "undefined") {
  console.warn(
    "[config] Production bundle is pointed at a plaintext http:// backend. " +
    "Use https:// for real deployments (see docs/THREAT-MODEL.md)."
  );
}

/** Standard headers for authenticated JSON calls. */
export function authHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export { normalizeUrl };
