# Software Development Life Cycle — TL-Chat-Frontend

This document maps the classic SDLC phases to the concrete gates in this repository so that every
change, from a one-line fix to a portal integration, follows the same path.

## 1. Requirements
- Every change starts as a GitHub Issue using the labels `feature`, `bug`, `security`, `tech-debt`.
- Security-relevant requests (anything touching auth, data flow, external links, dependencies) get
  the `security` label and a threat-model note before design starts.
- Acceptance criteria are written in the issue; the PR links back with `Closes #n`.

## 2. Design
- Trust boundaries are recorded in `docs/THREAT-MODEL.md`. Changing one is a design decision that
  must be reviewed there first.
- Portal-facing work follows `docs/PORTAL-INTEGRATION.md` (auth hand-off, embedding, CSP).
- Larger designs get a short ADR in `docs/adr/NNNN-title.md` (create the folder on first use).

## 3. Implementation
- Feature branches off `main`; see CONTRIBUTING.md for naming and commit conventions.
- Local gate: `npm run verify`.
- Hard rules: config through `src/lib/config.js`; no HTML sinks; token in memory only.

## 4. Verification
| Gate | Tool | Where |
|---|---|---|
| Static lint incl. React purity rules | ESLint 9 + react-hooks v7 | `npm run lint`, CI |
| Unit / component tests | Vitest + Testing Library (jsdom) | `npm test`, CI |
| Dependency vulnerabilities | `npm audit --audit-level=high` | CI, Dependabot |
| Static application security testing | CodeQL `security-extended` | CI (PR + weekly) |
| Bundle hygiene | CI grep for source maps, localhost, key material | CI |
| Manual security review | PR template checklist + CODEOWNERS | PR |
| End-to-end | Playwright against a staging backend (planned — see roadmap) | — |

## 5. Release
- Semantic version tags on `main` (`npm version`).
- CI produces the immutable `dist-<sha>` artifact; that artifact is what gets deployed.
- Hardened builds (`build:hardened`) are used for any externally reachable deployment.

## 6. Deployment
- Static hosting behind TLS. Required response headers are listed in `docs/PORTAL-INTEGRATION.md`
  (CSP, HSTS, frame-ancestors).
- Environment is injected at build time via `VITE_*` variables (see `.env.example`):

  | Var | Scope | Notes |
  |---|---|---|
  | `VITE_BACKEND_URL` | deployment-specific | REST + SignalR origin; **must be `https://` in production** (build fails otherwise) |
  | `VITE_PORTAL_ORIGINS` | deployment-specific | allow-list of exact origins permitted to post the auth token when embedded |
  | `VITE_EMBED_MODE` | deployment-specific | `true` hides standalone login/landing chrome when framed by the portal |
  | `VITE_DEMO_MODE` | dev/local only | scripted in-memory hub; **forced off and rejected in production builds** |
  | `VITE_ALLOW_INSECURE_BACKEND` | dev/local only | escape hatch to allow an `http://` backend in a non-prod build |

  Only the deployment-specific variables differ between dev / staging / prod; the dev-only variables
  must never be set for a production build.

## 7. Operations & maintenance
- Dependabot PRs weekly; merge minor/patch after CI passes, review majors.
- CodeQL weekly scheduled scan.
- Vulnerability intake per `SECURITY.md`.

## Roadmap (ordered)
1. **TypeScript migration** — the codebase is small enough (~1.4k lines) to convert in one PR; this
   unlocks type-aware lint rules and catches the class of bug fixed in this setup (undefined `BACKEND`).
2. **Route guards** — `/analytics` is reachable unauthenticated and currently renders mock data.
   Gate it behind the agent session and swap mock data for the backend endpoint.
3. **Playwright E2E** — customer intake → agent pickup → chat → rating, against a seeded backend.
4. **Backend contract tests** — freeze the REST/SignalR contract (`/api/auth/login`, `/api/chat/session`,
   `/api/chat/queue`, hub methods) in a shared OpenAPI/JSON schema consumed by both repos.
5. **Portal integration spike** — see `docs/PORTAL-INTEGRATION.md`.
