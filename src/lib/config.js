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

/**
 * Refuse to talk to a plaintext backend from a production bundle unless the
 * operator has explicitly opted in (local Docker demos, etc.).
 */
if (IS_PRODUCTION && BACKEND.startsWith("http://") && import.meta.env.VITE_ALLOW_INSECURE_BACKEND !== "true") {
  throw new Error("Production builds require an https:// VITE_BACKEND_URL (or VITE_ALLOW_INSECURE_BACKEND=true)");
}

/** Standard headers for authenticated JSON calls. */
export function authHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export { normalizeUrl };
