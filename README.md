# TL-Chat-Frontend · E.D.I.T.H Support Console

React 19 + Vite frontend for the ThreatLocker LiveChat supplementary product. Customers open a
support session through an intake form; agents authenticate, watch a live queue, receive the
E.D.I.T.H (Endpoint Defense Intelligence & Triage Hub) pre-analysis, and chat over SignalR.

Backend: `TL-Chat-Backend` (ASP.NET, REST + SignalR `/chathub`).

## Quick start
```bash
cp .env.example .env.local   # set VITE_BACKEND_URL
npm ci
npm run dev                  # http://127.0.0.1:5173
```

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (loopback only) |
| `npm run verify` | Lint + tests + build + audit — the CI gate |
| `npm test` / `npm run test:coverage` | Vitest unit/component tests |
| `npm run build` | Production build (no source maps, console stripped) |
| `npm run build:hardened` | Production build + JavaScript obfuscation of app chunks |
| `npm run preview` | Serve `dist/` locally |

## Project layout
```
src/
  App.jsx                 routes, landing, agent login, customer/agent flows
  lib/config.js           runtime config (backend URL, auth headers) — the only place URLs live
  components/             CustomerIntakeForm, AgentDashboard, ChatWindow, Analytics
  test/setup.js           Vitest setup
scripts/obfuscate.mjs     post-build hardening step
docs/                     SDLC.md · THREAT-MODEL.md · PORTAL-INTEGRATION.md
.github/                  CI (lint/test/build/audit), CodeQL, Dependabot, PR template, CODEOWNERS
```

## Process
- Development workflow and rules: [CONTRIBUTING.md](CONTRIBUTING.md)
- Life-cycle gates and roadmap: [docs/SDLC.md](docs/SDLC.md)
- Security posture and reporting: [SECURITY.md](SECURITY.md), [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md)
- Portal embedding design: [docs/PORTAL-INTEGRATION.md](docs/PORTAL-INTEGRATION.md)
