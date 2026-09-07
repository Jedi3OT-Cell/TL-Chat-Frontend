# ThreatLocker Portal Integration — Design Notes

Goal: surface the LiveChat / E.D.I.T.H console inside the ThreatLocker portal (agent side) and as a
support entry point for customers, without weakening either application's trust model.

## Integration options
| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Iframe embed with token hand-off** (recommended first step) | Portal renders `<iframe src="https://chat.<env>/agent">`; portal posts a short-lived, audience-scoped JWT via `postMessage` with strict origin checks; frontend uses it as the agent token | No portal code changes beyond a page; frontend stays independently deployable; clear trust boundary | Needs `frame-ancestors` CSP, `postMessage` origin allow-list, token exchange endpoint on the chat backend |
| B. Micro-frontend (module federation / web component) | Build this app as a custom element `<tl-livechat>` and load it inside the portal SPA | Seamless UX, shared theme | Couples build pipelines; CSS/global leakage; portal CSP must allow the chat bundle host |
| C. Full merge into portal repo | Copy components into the portal codebase | Single auth context | Loses independent SDLC; largest blast radius |

## Auth hand-off contract (Option A)
1. Portal already holds a session for the logged-in ThreatLocker user.
2. Portal calls its own backend: `POST /api/livechat/token` → chat backend mints a JWT with
   `aud=tl-livechat`, `role=Agent`, `sub=<portal user id>`, `exp` ≤ 15 min.
3. Portal page embeds the iframe and, on `load`, sends `{ type: "tl.livechat.auth", token }` via
   `iframe.contentWindow.postMessage(msg, CHAT_ORIGIN)`.
4. Frontend (new `PortalBridge` component) accepts the message **only** if `event.origin` is in
   `VITE_PORTAL_ORIGINS`, then seeds `AgentFlow` state with the token, bypassing the login form.
5. Chat backend validates `aud` and `exp` exactly as for the login-issued token.

No token ever touches `localStorage`; the iframe reloads → portal re-posts a token.

## Required response headers on the chat frontend host
```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://chat-api.<env> wss://chat-api.<env>;
  script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  frame-ancestors https://portal.threatlocker.com https://*.threatlocker.com; base-uri 'none'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
`style-src 'unsafe-inline'` is required by the current inline-style convention; migrating styles to
CSS modules would let us drop it.

## Data-flow considerations
- Customer intake: `organizationName` should become the portal Organization ID when launched from
  the portal, so the backend can correlate with the org's Unified Audit.
- E.D.I.T.H summary `module` values (Application Control, Ringfencing, Storage, Network, Elevation,
  Configuration) already align with portal module names; keep that enum in a shared package.
- KB links must target the ThreatLocker knowledge base, not a public search engine.

## Environment variables introduced by this integration
| Var | Purpose |
|---|---|
| `VITE_PORTAL_ORIGINS` | Comma-separated allow-list of origins permitted to post auth messages |
| `VITE_EMBED_MODE` | `true` hides the standalone login/landing chrome when framed |
