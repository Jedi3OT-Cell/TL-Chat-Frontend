# Contributing

## Prerequisites
- Node 22 (`.nvmrc`), npm 10+
- A running `TL-Chat-Backend` (or set `VITE_BACKEND_URL` to a shared dev instance)

## Local setup
```bash
cp .env.example .env.local        # edit VITE_BACKEND_URL if needed
npm ci
npm run dev                       # http://127.0.0.1:5173
```

## Before you push
```bash
npm run verify    # lint + unit tests + production build + dependency audit
```
`verify` is exactly what CI runs. A PR that fails it will not be reviewed.

## Branch & PR workflow
1. Branch from `main`: `feat/<ticket>-short-name`, `fix/<ticket>-…`, `sec/<ticket>-…`, `chore/…`
2. Commit in Conventional Commits style (`feat:`, `fix:`, `sec:`, `chore:`, `docs:`, `test:`).
3. Open a PR against `main`; fill in **every** section of the PR template, including the security checklist.
4. One approving review from a CODEOWNER is required. Security-tagged PRs require the security owner.
5. Squash-merge. The squash title becomes the changelog line.

## Coding rules
- **Config:** every backend URL goes through `src/lib/config.js`. Never write `http://…` in a component.
- **Rendering:** user-controlled text (chat messages, org names, summaries) is rendered as JSX text only.
- **Auth:** the agent JWT is passed as a prop; do not persist it. Use `authHeaders(token)` for REST calls
  and `accessTokenFactory` for SignalR.
- **Dependencies:** adding a runtime dependency requires justification in the PR and a clean `npm audit`.
- **Styling:** inline style objects at the bottom of each component (existing convention); no CSS-in-JS libs.
- **Tests:** new behaviour ships with a Vitest + Testing Library test. Security invariants get a test, not a comment.

## Hardened build
```bash
npm run build:hardened   # vite build + javascript-obfuscator on app chunks
```
Windows PowerShell: `$env:OBFUSCATE=1; npm run build`.
See `docs/THREAT-MODEL.md` for what obfuscation does and does not protect.

## Release
1. `npm version minor|patch` on `main` (creates a tag).
2. CI builds the tagged commit; the `dist-<sha>` artifact is the release candidate.
3. Deploy that exact artifact — never rebuild for production from a developer machine.
