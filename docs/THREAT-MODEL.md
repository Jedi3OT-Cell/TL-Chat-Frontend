# Threat Model — TL-Chat-Frontend

## Assets
| Asset | Sensitivity | Where it lives |
|---|---|---|
| Agent JWT | High — grants agent role on the hub and queue API | React state only (`AgentFlow` → `AgentDashboard` prop) |
| Customer intake data (name, org, OS, issue text) | Medium — PII + environment detail | In transit to backend; not stored client-side |
| Chat transcript | Medium | React state for the session lifetime |
| E.D.I.T.H summary / threat score | Medium — reveals triage heuristics | React state |
| Backend hostname | Low, but must not be hardcoded | Build-time env (`VITE_BACKEND_URL`) |

## Trust boundaries
1. **Browser ↔ Backend (REST + SignalR)** — the only network boundary. Everything crossing it is
   attacker-controllable from the client side; the backend must re-validate roles and session
   membership on every hub method. The frontend sends the JWT via `Authorization: Bearer` (REST) and
   `access_token` (SignalR `accessTokenFactory`), and must never be the sole enforcement point.
2. **Customer ↔ Agent within a session** — both sides' messages are rendered on the other's screen.
   React text-node rendering escapes them; `dangerouslySetInnerHTML` is banned.
3. **Build pipeline ↔ deployed bundle** — CI is the only producer of production artifacts.

## Threats & mitigations (STRIDE)
| Threat | Vector | Mitigation | Residual |
|---|---|---|---|
| Spoofing agent identity | `RegisterAsAgent(agentName)` is a free-text hub call | JWT now sent on the hub connection; **backend must derive identity from the token, not the argument** | Open until backend enforces |
| Tampering with queue/session | Direct hub invocation with another `sessionId` | Backend authorization per session | Backend-owned |
| Repudiation | No client-side audit | Backend logs hub calls with connection ID + principal | Backend-owned |
| Information disclosure — token theft via XSS | Injected script reading storage | Token never persisted; no HTML sinks; CSP recommended in deployment | CSP not yet enforced by hosting |
| Information disclosure — bundle analysis | Reading shipped JS | No source maps; console stripped; optional obfuscation | Obfuscation is deterrence only |
| Information disclosure — KB search leakage | Knowledge-base links currently go to `google.com/search?q=ThreatLocker+…` | **Replace with the ThreatLocker KB / portal URL** before any external deployment | Open |
| Denial of service | Queue polling every 5 s per agent | Acceptable at current scale; move to hub push + backoff when >50 agents | Low |
| Elevation of privilege — analytics | `/analytics` route has no auth guard | Route guard (roadmap item 2); today it shows mock data only | Open |
| Downgrade to plaintext | Misconfigured `VITE_BACKEND_URL=http://` in prod | `config.js` throws at load in production builds | — |

## What obfuscation does and does not do
`npm run build:hardened` runs `javascript-obfuscator` (control-flow flattening, RC4 string array,
dead-code injection, self-defending) over the application chunks. It raises the effort needed to
read the triage UI logic and internal endpoint names from the bundle. It does **not**:
- hide anything from a debugger attached to the running page,
- protect the JWT or any data in memory,
- substitute for backend authorization.
Treat it as tamper-deterrence for a public-facing widget, never as a control.

## Assumptions to verify against the backend
- CORS allows the `Authorization` header from the frontend origin (preflight now occurs on queue fetches).
- SignalR hub reads `access_token` from the query string for WebSocket transport (ASP.NET default with
  `JwtBearerEvents.OnMessageReceived` wired for `/chathub`).
- Hub methods `RegisterAsAgent`, `JoinSession`, `CloseSession` are `[Authorize(Roles="Agent")]`.
