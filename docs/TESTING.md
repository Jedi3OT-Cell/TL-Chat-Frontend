# Testing Guide — TL-Chat-Frontend

A reproducible, step-by-step walkthrough for testing the ThreatLocker LiveChat / E.D.I.T.H
frontend end to end. Follow it top to bottom and you will exercise every layer: static checks,
unit/component tests, end-to-end browser tests, a manual QA pass, and a full-stack run against the
backend. Each section says what to run, what "pass" looks like, and how to reproduce the setup
yourself from scratch.

---

## 0. Prerequisites

| Requirement | Why | Check |
|---|---|---|
| Node 22 (see `.nvmrc`) | Vite 8 / test toolchain | `node -v` → v22.x |
| npm 10+ | lockfile v3 | `npm -v` |
| A Chromium for Playwright | E2E browser | `npx playwright install chromium` (skip in the managed env — Chromium is pre-installed) |
| (Optional) TL-Chat-Backend running | live chat + queue | REST at `:5000`, SignalR `/chathub` |

```bash
git clone <repo> && cd TL-Chat-Frontend
cp .env.example .env.local        # set VITE_BACKEND_URL (defaults to http://localhost:5000)
npm ci                            # install exactly from the lockfile
```

Why `npm ci` and not `npm install`: `ci` installs the exact tree in `package-lock.json` and fails
if the lockfile is out of sync. That is what CI runs, so it is the honest local reproduction.

---

## 1. The one command: `npm run verify`

```bash
npm run verify
```

This runs, in order: **lint → unit tests → production build → dependency audit**. It covers the same
stages a contributor runs locally and catches the great majority of what CI would reject, but it is
**not** a byte-for-byte replica of CI and does not guarantee every pull-request check will pass. CI
additionally runs the **hardened** build (`build:hardened` with obfuscation), a **bundle-hygiene**
grep (no source maps / plaintext secrets), and **CodeQL** static analysis in a separate workflow —
none of which are part of local `verify`. Treat a green `verify` as "very likely to pass CI," then
let CI confirm. Everything below explains each stage so you can run and understand them individually.

---

## 2. Static checks (lint)

```bash
npm run lint          # eslint .
```

Pass = no output and exit 0. ESLint enforces the React Hooks rules (including the purity rules that
catch `Math.random()`/`Date.now()` called during render) and flags undefined variables — the class
of bug that previously shipped a `ReferenceError` in `ChatWindow`.

To reproduce the config: `eslint.config.js` applies browser globals to `src/**`, and a second block
applies Node globals to `playwright.config.js`, `vite.config.js`, `scripts/**`, and `e2e/**`.

---

## 3. Unit and component tests (Vitest + Testing Library)

```bash
npm test                  # vitest run  (one-shot)
npm run test:watch        # re-run on change while developing
npm run test:coverage     # with V8 coverage report in coverage/
```

Pass = all test files green. What is covered today:

- `src/lib/config.test.js` — URL normalization and the `Authorization` header helper, including that
  `javascript:` and non-http(s) schemes are rejected.
- `src/lib/classification.test.js` — module-color mapping, threat-level mapping, the flat-vs-nested
  session normalizer, and the wait-label date guard.
- `src/App.test.jsx` — landing renders both entry points; agent login requires both fields before
  calling the backend; **the JWT is never written to `localStorage`/`sessionStorage`** (a security
  invariant asserted as a test, not a comment).

How the tests avoid needing a backend:
- `fetch` is stubbed with `vi.spyOn(globalThis, 'fetch')`.
- The SignalR connection is passed into `ChatWindow` as a prop, so a fake object
  `{ on, off, invoke: vi.fn(), start, stop }` makes it fully testable offline.

To write your own component test, copy the pattern in `src/App.test.jsx`: render, act with
`fireEvent`, assert with `@testing-library/jest-dom` matchers. `src/test/setup.js` wires the matchers
and polyfills `scrollIntoView` (which jsdom lacks and `ChatWindow` calls on mount).

---

## 4. End-to-end tests (Playwright, headless Chromium)

```bash
npm run test:e2e          # playwright test
npm run test:e2e:ui       # interactive UI mode (local debugging)
```

`playwright.config.js` boots the app itself (`webServer` runs `npm run dev` in development mode on a
fixed port) and points the browser at it. In the managed environment set the pre-installed browser:

```bash
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run test:e2e
```

The backend is **stubbed in the browser** via Playwright route interception
(`e2e/mock-backend.js`) — `mockBackendOk()` fulfills the REST calls with canned JSON and
`mockBackendDown()` aborts them, so the specs run with no ASP.NET backend.

`e2e/smoke.spec.js` covers, and "pass" means all of these are green:
1. Landing renders the brand and both entry buttons.
2. "Request Support" routes to the intake form; "Agent Login" routes to the login.
3. Intake rejects an empty submit without calling the backend.
4. Intake degrades gracefully when the backend is unreachable (shows the connection error).
5. Agent login rejects an empty submit.
6. Agent login shows "access denied" on a 401.
7. Valid credentials reach the support console with an empty queue.
8. A queued session renders its card and its E.D.I.T.H detail when selected.
9. `/analytics` renders.

**What E2E cannot cover without a backend:** live chat messaging and agent pickup negotiate a real
SignalR WebSocket, which route interception cannot fake. Those paths are exercised either by the
demo mode (Section 6) or against a real/staging backend (Section 7).

---

## 5. Manual QA checklist (5 minutes in a browser)

```bash
npm run dev               # http://127.0.0.1:5173
```

Walk these and confirm each behaves as described:

- [ ] **Landing** renders with a live clock; "Request Support" and "Agent Login" both navigate.
- [ ] **Intake**: submitting empty shows "ALL FIELDS REQUIRED"; pressing Enter submits the form.
- [ ] **Intake, backend down**: filling all fields and submitting shows "CONNECTION FAILED — RETRY"
      and the form stays usable.
- [ ] **Agent login**: empty submit is blocked; a wrong password (or backend down) shows a clear
      error; on success you reach the **Support Console**.
- [ ] **Support Console, backend down**: the queue shows **CONNECTION LOST** with a Retry button —
      NOT a misleading "QUEUE CLEAR".
- [ ] **Logout** returns to the landing page.
- [ ] **Analytics** (`/analytics` directly, and via the console slide-out): the **Back** control
      works from both entry points and never throws.
- [ ] **Unknown URL** (e.g. `/nope`) redirects to the landing page instead of a blank screen.
- [ ] Tab through every screen with the keyboard: inputs are labeled, buttons are reachable, the
      focus ring is visible.

---

## 6. Standalone demo mode (full chat with no backend)

Set `VITE_DEMO_MODE=true` to run the complete customer→agent→close→rating loop against an in-memory
scripted hub, so you can demo or test chat without the ASP.NET backend:

```bash
VITE_DEMO_MODE=true npm run dev
```

See `.env.example` for the flag. Demo mode is compiled out of normal production builds.

---

## 7. Full-stack run (against TL-Chat-Backend)

1. Start the backend (`TL-Chat-Backend`) so REST is on `:5000` and SignalR is on `/chathub`.
2. Point the frontend at it and run:
   ```bash
   VITE_BACKEND_URL=http://localhost:5000 npm run dev
   ```
3. Open two browser profiles: one as a customer (`/chat`), one as an agent (`/agent`).
4. Verify the live path: customer submits intake → agent sees the session in the queue → agent
   accepts → both exchange messages with typing indicators → agent closes → customer rates.

### The contract the backend must satisfy

**REST**

| Method & path | Request | Response | Auth |
|---|---|---|---|
| `POST /api/auth/login` | `{ username, password }` | `{ displayName, token }` | none |
| `POST /api/chat/session` | `{ customerName, organizationName, osPlatform, issueDescription }` | `{ sessionId }` | none |
| `GET /api/chat/queue` | — | `[ { sessionId, createdAt, customerName, organizationName, osPlatform, issueDescription, summary } ]` | `Authorization: Bearer <jwt>` |
| `POST /api/chat/session/{id}/rating` | `{ rating }` | 2xx | none |

**SignalR hub `/chathub`** — client → server invokes (argument order matters):

| Invoke | Args |
|---|---|
| `JoinSessionAsCustomer` | `(sessionId, customerName)` |
| `RegisterAsAgent` | `(agentName)` |
| `JoinSession` | `(sessionId, agentName)` |
| `SendMessage` | `(sessionId, senderName, message, senderRole)` |
| `TypingIndicator` | `(sessionId, senderName, isTyping)` |
| `CloseSession` | `(sessionId)` |

Server → client events the frontend listens for:

| Event | Args |
|---|---|
| `AgentRegistered` | `()` |
| `QueueUpdated` | `(sessionOrArray)` — a full array or a single session to append |
| `ReceiveMessage` | `(message)` — `{ senderName, senderRole, message, timestamp }` |
| `UserTyping` | `(name, isTyping)` |
| `AgentJoined` | `(agentName)` |
| `SessionClosed` | `()` |

The agent connection sends the JWT via the SignalR `accessTokenFactory`, so the hub must accept the
token from the WebSocket query string (ASP.NET `JwtBearerEvents.OnMessageReceived` for `/chathub`).
Hub methods that act as an agent should be authorized from that token, not from the `agentName`
argument.

---

## 8. Getting CI + CodeRabbit to review it

- Push the branch and open a pull request. GitHub Actions runs `verify` plus CodeQL on every PR
  (`.github/workflows/`).
- **CodeRabbit** reviews pull requests automatically once the CodeRabbit GitHub App is installed on
  the repository (install at https://github.com/apps/coderabbitai and authorize this repo). Its
  behavior is configured by `.coderabbit.yaml` at the repo root. If no review appears within a few
  minutes of opening the PR, the App is not yet installed on the repo.

---

## Quick reference

```bash
npm run dev            # dev server (loopback, port 5173)
npm run verify         # lint + unit tests + build + audit  (the CI gate)
npm test               # unit/component tests
npm run test:coverage  # + coverage report
npm run test:e2e       # Playwright end-to-end
npm run build          # production build (no sourcemaps, console stripped)
npm run build:hardened # production build + JS obfuscation of app chunks
```
