# Security Policy

## Scope
This repository contains the browser frontend for the ThreatLocker LiveChat / E.D.I.T.H support
console. It talks to a separate backend (`TL-Chat-Backend`) over HTTPS (REST) and WSS (SignalR).

## Reporting a vulnerability
Do **not** open a public issue. Email the maintainer listed in `.github/CODEOWNERS` with:
- affected commit / build hash (`dist/assets/index-<hash>.js`),
- reproduction steps or HAR trace (redact tokens),
- impact assessment.
You will receive an acknowledgement within 2 business days.

## Security invariants (enforced by review + CI)
| Invariant | Enforcement |
|---|---|
| No hardcoded backend hosts or secrets in source | CI greps `dist/` for `localhost:5000` and key material; all URLs flow through `src/lib/config.js` |
| Production bundles are served only over TLS to a TLS backend | `config.js` throws at load if `VITE_BACKEND_URL` is `http://` in a production build |
| Agent JWT lives in React state only | Unit test asserts token never reaches `localStorage`/`sessionStorage` |
| No HTML injection sinks | ESLint + review; `dangerouslySetInnerHTML` / `innerHTML` are prohibited |
| No source maps or console output in production | `vite.config.js` (`sourcemap:false`, `esbuild.drop`) + CI check |
| Dependencies free of known high/critical CVEs | `npm audit --audit-level=high` gate + Dependabot weekly |
| Static analysis on every PR | CodeQL `security-extended` |

## Supported versions
Only the `main` branch and the most recent tagged release receive fixes.
