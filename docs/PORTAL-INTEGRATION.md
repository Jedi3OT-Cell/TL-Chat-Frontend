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
4. Frontend (new `PortalBridge` component) accepts the message **only** when **all** of the
   following hold, then seeds `AgentFlow` state with the token, bypassing the login form:
   - `event.source === window.parent` — the message came from the framing portal window, not
     from any other window that merely obtained a reference to the iframe;
   - `event.origin` is in the `VITE_PORTAL_ORIGINS` allow-list (exact origin match);
   - `event.data.type === "tl.livechat.auth"` (exact string) and `typeof event.data.token === "string"`.
   Reject and ignore anything else. Origin alone is not sufficient: another frame from an allowed
   origin could otherwise post an attacker-chosen token.
5. Chat backend validates `aud` and `exp` exactly as for the login-issued token.

No token ever touches `localStorage`; the iframe reloads → portal re-posts a token.

## Required response headers on the chat frontend host
```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://chat-api.<env> wss://chat-api.<env>;
  script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  frame-ancestors https://portal.threatlocker.com; base-uri 'none'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
- `frame-ancestors` lists only the **exact** portal origin(s) that embed the console. Do not use a
  `https://*.threatlocker.com` wildcard — it would let any subdomain (including a compromised or
  user-content one) frame the app. Add further exact origins only if more portal hosts embed it.
- `connect-src` must be substituted at deploy time so both the `https://` and `wss://` entries match
  the single backend origin the app actually uses — i.e. the origin of `VITE_BACKEND_URL` consumed by
  `src/lib/config.js` (`BACKEND` for REST, `${BACKEND}/chathub` upgraded to `wss://` for SignalR).
- `style-src 'unsafe-inline'` is required by the current inline-style convention; migrating styles to
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
