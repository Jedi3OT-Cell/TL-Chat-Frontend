## Summary
<!-- What changed and why. Link the issue / work item. -->

Closes #

## Type of change
- [ ] Feature
- [ ] Bug fix
- [ ] Security hardening
- [ ] Refactor / tech debt
- [ ] Docs / CI only

## Security checklist (required)
- [ ] No secrets, hostnames, or instance-specific values added to source or `.env.example`
- [ ] All new backend calls go through `src/lib/config.js` (no hardcoded URLs)
- [ ] User-supplied strings are rendered via JSX text nodes only (no `dangerouslySetInnerHTML`, no `innerHTML`)
- [ ] Auth token is passed in memory only — never written to `localStorage` / `sessionStorage` / cookies from JS
- [ ] New external links use `rel="noopener noreferrer"`
- [ ] `npm run verify` passes locally (lint · test · build · audit)
- [ ] Threat model (`docs/THREAT-MODEL.md`) updated if a trust boundary changed

## Test evidence
<!-- Screenshots / recording / test output. For UI changes include before & after. -->

## Rollback plan
<!-- How do we revert if this misbehaves in production? -->
