# Portal Helpdesk & Ticketing Integration — Design Notes

Goal: after the LiveChat / E.D.I.T.H console is embedded in the ThreatLocker portal (see
`PORTAL-INTEGRATION.md`), turn a chat session into a **helpdesk ticket** so escalations land in the
same place support already works, and host the app on a **privately accessible domain** so it is
reachable only from inside the corporate/VPN perimeter.

> **Sourcing note.** The ThreatLocker specifics below are drawn from the public Help Center and API
> documentation summaries (threatlocker.kb.help). Those pages are blocked by this environment's
> network egress, so exact endpoint paths, field names, and payload shapes must be verified against
> the live Help Center before implementation. Everything marked *(verify)* is a hypothesis to
> confirm, not a documented contract.

---

## Part A — Privately accessible domain (internal-only hosting)

The console should not be exposed on the public internet. Serve it on an internal hostname reachable
only via the corporate LAN / VPN / Zero Trust access.

### Topology
```
Agent workstation ──VPN/ZTNA──▶ Internal reverse proxy ──▶ LiveChat static bundle (dist/)
(portal iframe)                 (HAProxy / IIS ARR)     └──▶ TL-Chat-Backend (REST + /chathub)
```

### DNS
- Publish `support-chat.internal.<company>.com` on the **internal resolver only**
  (Technitium / AD DNS), with **no public A/AAAA record**. Split-horizon DNS keeps the name from
  resolving off-network.

### TLS (internal CA)
- Issue the certificate from the internal CA (`devops-ca-01` / step-ca), SAN =
  `support-chat.internal.<company>.com`.
- Distribute the internal root to endpoints via GPO/MDM so browsers trust it without warnings.
- Because the cert is trusted internally, `VITE_BACKEND_URL` is `https://…` and the build-time
  `enforceSecureBackend` guard passes (no `VITE_ALLOW_INSECURE_BACKEND` needed).

### Reverse proxy / access
- HAProxy or IIS ARR terminates TLS and forwards `/` to the static bundle and `/api` + `/chathub`
  to the backend (WebSocket upgrade enabled for `/chathub`).
- Restrict source to the VPN/ZTNA ranges at the firewall; optionally require mTLS or an identity-aware
  proxy in front for defense in depth.
- Serve the security headers from `PORTAL-INTEGRATION.md` (CSP with `frame-ancestors` limited to the
  portal origin, HSTS, `X-Content-Type-Options`, `Referrer-Policy`).

### New/relevant env vars
| Var | Purpose |
|---|---|
| `VITE_BACKEND_URL` | `https://support-chat.internal.<company>.com` (or the backend's internal host) |
| `VITE_PORTAL_ORIGINS` | portal origins allowed to embed / post auth (from `PORTAL-INTEGRATION.md`) |

---

## Part B — Ticketing integration

### What ThreatLocker provides
- **Portal Help Desk (native):** tickets are created in the portal Help Desk with fields
  **organization, primary contact, summary of issue, and product** *(verify field names/enum)*.
  There is a `+ New Ticket` action in the portal UI.
- **Portal API:** base URL `https://portalapi.<INSTANCE>.threatlocker.com/portalapi/<endpoint>`
  where `<INSTANCE>` is your cloud instance (A–H, EU1, CA1, FedRAMP). Auth uses a **Portal API Key**
  created under **Administrators → API Users**, sent with your **Instance ID**; org-scoped calls
  include a `managedOrganizationId` header (a GUID). API tokens have a selectable expiration that
  renews on each use. The documented API surface covers Computer, Organization, Policy, Report,
  SystemAudit, ApprovalRequest, etc.
- **Third-party PSA/ticketing integrations:** ServiceNow (Incidents table), ConnectWise Manage,
  HaloPSA, Datto, Kaseya BMS, and Dynamics 365.

> A dedicated public "create Help Desk ticket" REST endpoint is **not clearly documented** in the
> public API surface *(verify)*. Design for two ticket sinks and pick per deployment.

### Two integration paths

**Path 1 — ThreatLocker Portal Help Desk (native), preferred when the portal owns support.**
Create/lookup the ticket **server-side from TL-Chat-Backend**, never from the browser (the Portal API
Key must not ship to the client). Flow:
1. Agent clicks **"Escalate to ticket"** in the chat window.
2. Frontend calls the chat backend: `POST /api/chat/session/{id}/escalate`.
3. Chat backend calls the Portal API (or the portal's internal ticket service) with the API Key +
   Instance ID + `managedOrganizationId`, mapping session data to ticket fields.
4. Backend returns `{ ticketId, ticketUrl }`; the frontend shows a linked confirmation in the chat.

**Path 2 — PSA passthrough (ServiceNow / ConnectWise / Halo), when support lives in a PSA.**
Same server-side escalation endpoint, but the backend targets the configured PSA connector
(e.g. ServiceNow `POST /api/now/table/incident`). Selected by a backend setting, invisible to the
frontend.

### Field mapping (chat session → ticket)
| Ticket field | Source in the chat session |
|---|---|
| Organization | `organizationName` (or the portal Organization ID when launched embedded) |
| Primary contact | `customerName` (+ portal user identity when embedded) |
| Summary | `issueDescription` (first line) |
| Description / work notes | full transcript + E.D.I.T.H `summary` (module, issue type, recommended steps) |
| Product / category | `summary.moduleClassification` mapped to the portal product/module enum |
| Priority | derived from `summary.threatLevel` (CRITICAL/HIGH → high priority) |
| Affected asset | `osPlatform` (+ hostname/device tag when available) |

### Frontend-side work (small, additive)
- Add an **"Escalate to ticket"** button in `ChatWindow` (agent role) that calls the backend
  escalation endpoint and renders the returned ticket link — no PSA/portal credentials in the client.
- KB-article links in both the agent detail panel and the chat window already point at the
  ThreatLocker Help Center (`https://threatlocker.kb.help/?s=<term>`), not a public search engine.
  The remaining enhancement is to deep-link to the **specific** KB article each E.D.I.T.H suggestion
  references — this requires the backend to return an article URL (or slug/ID) in
  `summary.suggestedKBArticles` instead of a free-text term, so it is tracked as a backend-contract
  follow-up. Once a ticket exists, link it in the chat too.
- Persist `{ ticketId, ticketUrl }` on the session so a returning agent sees the existing ticket
  instead of creating a duplicate.

### Security constraints
- **API keys and PSA credentials live only on the backend.** The browser calls the chat backend; the
  chat backend calls the Portal/PSA API. This keeps the Instance ID + Portal API Key off the client
  and out of the bundle (consistent with `THREAT-MODEL.md`).
- Scope each Portal API Key to the minimum org set via `managedOrganizationId`; set a short token
  expiration; rotate on staff changes.
- Rate-limit and de-duplicate escalations server-side so one chat cannot spawn many tickets.

---

## Open questions to confirm against the live Help Center *(verify)*
1. Is there a Portal API endpoint to create a Help Desk ticket, or is ticket creation only via the
   portal UI + PSA connectors?
2. Exact Help Desk ticket schema: field names, the **product** enum, priority/status values.
3. Whether the embedded portal session can pass the portal **Organization ID** and user identity to
   the chat backend for correlation with the Unified Audit.
4. Which PSA is the target of record for this deployment (drives Path 1 vs Path 2).

## Sources
- [ThreatLocker Help Desk — Help Center](https://threatlocker.kb.help/help-desk/)
- [ThreatLocker API Documentation — Help Center](https://threatlocker.kb.help/api-documentation/)
- [ThreatLocker Integrations — Help Center](https://threatlocker.kb.help/integrations/)
- [ThreatLocker ServiceNow Integration — Help Center](https://threatlocker.kb.help/servicenow-integration/)
- [ThreatLocker API Users — Help Center](https://threatlocker.kb.help/api-users/)
