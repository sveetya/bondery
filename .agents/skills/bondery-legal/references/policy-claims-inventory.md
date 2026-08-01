# Policy claims inventory

Maps checkable factual claims in published legal documents to implementation status. **Gaps are flagged, not hidden.**

**Sources:**
- Privacy: `apps/website/src/components/legal/Privacy.tsx` (July 13, 2026)
- Terms: `apps/website/src/components/legal/Terms.tsx` (February 18, 2026 — **draft placeholder**)

| Status | Meaning |
|--------|---------|
| `implemented` | Code matches the claim |
| `unimplemented` | Policy claims capability; code does not provide it |
| `policy-only` | Stated in policy; no product enforcement |
| `drifted` | Code and policy disagree on facts |

## Terms of Service

| Claim | Location | Status | Notes |
|-------|----------|--------|-------|
| Final contractual terms | `Terms.tsx` | **unimplemented** | Explicit placeholder: "does not yet represent the final contractual terms" |
| Acceptable use, liability, governing law | `Terms.tsx` | **unimplemented** | Listed as future content |

**Escalate:** ToS finalization is a standing leadership/legal item — not an agent task.

## Privacy Policy — data practices

| Claim | Policy § | Status | Evidence |
|-------|--------|--------|----------|
| We do not sell personal information | Intro | `implemented` | No sale code paths |
| User is controller for contact data; Bondery is processor | §2 | `policy-only` | Architectural statement; enforce via tenant isolation (`bondery-security`) |
| Extension only activates on user click | §4 | `implemented` | Extension architecture (`check-extension-patterns.ts`) |
| No biometric data processed | §4 | `implemented` | No biometric collection in schemas |
| GitHub/LinkedIn sign-in: email, name, provider ID only | §5 | `implemented` | Better Auth providers (`lib/auth/index.ts`) |
| Data deleted immediately on account delete | §8 | `implemented` | `services/me/account.ts`, Prisma cascades |
| Backups purged within 30 days after deletion | §8 | **unimplemented** | No automated backup-purge job found |
| IP logs retained up to 90 days then deleted/anonymized | §8 | **unimplemented** | No log-anonymization job found; Session stores IP/UA |
| Data retained while account active | §8 | `implemented` | Standard DB retention |
| Services not intended for children under 16 | §11 | `policy-only` | No signup age gate in webapp/mobile/API |
| GDPR rights; respond within 30 days via email | §12 | `policy-only` | Manual process via `team@usebondery.com` |
| EU-based; SCCs for transfers outside EEA | §13 | `policy-only` | Infra/docs; Anthropic US disclosed |

## Privacy Policy — cookies and analytics

| Claim | Policy § | Status | Evidence |
|-------|--------|--------|----------|
| Essential cookies: auth session, language prefs | §6 | `implemented` | Webapp cookies (`lib/cookies/`, `oauthClient.server.ts`) |
| Analytics cookies; disable in account settings | §6 | **unimplemented** | PostHog initializes when key present; **no settings toggle** |
| Marketing site uses self-hosted cookieless analytics | §6 | `implemented` | `apps/website/src/app/layout.tsx`, `deploy/plausible/`, `BONDERY_PUBLIC_PLAUSIBLE_*` |
| No advertising/tracking/marketing cookies | §6 | `implemented` | No ad SDKs |
| `DO_NOT_TRACK` disables telemetry | — | **unimplemented** | Declared in `packages/helpers/src/env/manifest.ts` but **not referenced in app TS** |
| Cookie consent banner | — | **unimplemented** | No consent UI on website |

## Privacy Policy — subprocessors

| Claim | Policy § | Status | Evidence |
|-------|--------|--------|----------|
| Subprocessor table accurate | §15 | **drifted** | Supabase, Plunk stale; GitHub, LinkedIn, Better Auth, SMTP undisclosed — see [subprocessor-registry.md](./subprocessor-registry.md) |
| Anthropic: only when user messages AI; not for training | §15, docs | `implemented` | Chat routes only; policy-aligned |
| PostHog EU hosting | §15 | `implemented` | Default `eu.i.posthog.com` |

## Privacy Policy — rights and export

| Claim | Policy § | Status | Evidence |
|-------|--------|--------|----------|
| Right to access, rectify, delete, export | §12 | Partial | Delete: `DELETE /api/me` + UI. Export: **per-contact vCard only** — no full-account export |
| Exercise rights via `team@usebondery.com` | §12 | `policy-only` | Manual email process |

## Marketing / FAQ (not legal docs, but public claims)

| Claim | Location | Status | Notes |
|-------|----------|--------|-------|
| Hosted on EU servers | `Features.tsx`, FAQ schema | `implemented` | Hetzner EU |
| E2EE planned | FAQ schema | `policy-only` | Future; not implemented |
| TLS + AES at rest | FAQ schema | Partial | TLS yes; app-level encryption at rest not documented in code |

## Claims inventory checklist

- [ ] New feature checked against relevant rows — update status if claim satisfied or contradicted
- [ ] Gaps labeled `unimplemented` or `drifted` — not treated as resolved
- [ ] Substantive claim changes escalated — not silently deleted to hide gaps
- [ ] Registry and inventory updated together when vendors change
