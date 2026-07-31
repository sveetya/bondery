---
name: bondery-emails
description: >
  Bondery transactional email — React Email templates in packages/emails,
  Plunk SMTP delivery, notification triggers, preview workflow, and idempotency.
  Use when adding/changing email templates, send paths, reminder/share/trial/
  account/feedback emails, BONDERY_PRIVATE_EMAIL_* env vars, or notification services.
metadata:
  version: "1.0.0"
  namespace: bondery
---

# Bondery Emails

## When to use

- Adding or changing React Email templates in `@bondery/emails`
- Wiring or modifying email send paths in `apps/api`
- Reminder digest jobs, share contact email, trial/account/feedback emails
- `BONDERY_PRIVATE_EMAIL_*` env vars or SMTP/Plunk configuration
- Email preview, branding, accessibility, or deliverability for product mail

## Do not activate for

- Contact **email fields** in CRM UI (phone/email inputs) → [bondery-ux](../bondery-ux/SKILL.md)
- Stripe billing logic or webhook maps → [bondery-payments](../bondery-payments/SKILL.md)
- Auth/session security → [bondery-security](../bondery-security/SKILL.md)
- Generic React Email craft without Bondery paths → upstream `email-best-practices`

## Non-negotiables

1. **Templates only in `packages/emails`** — wrap with `EmailWrapper`; branding from `@bondery/branding`.
2. **Send only from `apps/api`** — never webapp, mobile, or website.
3. **Use shared transporter singleton** — call `sendRenderedEmail` from `transporter.ts`; never call `createTransport` from services.
4. **Production ESP:** Plunk via SMTP (`BONDERY_PRIVATE_EMAIL_*`); update [subprocessor registry](../bondery-legal/references/subprocessor-registry.md) when changing provider.
5. **Secrets via env manifest** — no credentials in code or templates.
6. **No PII in logs** — log send failures without full email bodies or contact fields.
7. **Idempotent automated sends** — webhooks and jobs must not double-send.
8. **Fail fast in dev/prod** — missing or invalid SMTP fails boot (`initEmailTransport`). In `NODE_ENV=test`, automated paths no-op when unconfigured (warn log, do not crash webhooks).
9. **Update [catalog.md](references/catalog.md)** when adding or changing an email.

## Decision tree

| Task | Read |
|------|------|
| System overview | [references/architecture.md](references/architecture.md) |
| All live emails | [references/catalog.md](references/catalog.md) |
| Add a new email | [references/adding-a-new-email.md](references/adding-a-new-email.md) |
| Templates, branding, EmailWrapper | [references/templates-and-branding.md](references/templates-and-branding.md) |
| Env vars, transporter, from/replyTo | [references/sending-and-env.md](references/sending-and-env.md) |
| Preview and testing | [references/dx-preview-and-test.md](references/dx-preview-and-test.md) |
| Triggers, jobs, idempotency | [references/triggers-and-idempotency.md](references/triggers-and-idempotency.md) |
| Subject, preview text, mobile UX | [references/ux-email-design.md](references/ux-email-design.md) |
| Accessibility | [references/accessibility.md](references/accessibility.md) |
| Transactional vs marketing | [references/email-types.md](references/email-types.md) |
| DNS, Plunk, inbox placement | [references/deliverability.md](references/deliverability.md) |
| Trial-ending **billing trigger** | [bondery-payments trial-ending-email](../bondery-payments/references/trial-ending-email.md) |
| Generic React Email / Resend patterns | `email-best-practices` (`.agents/skills/email-best-practices/SKILL.md`) |

## Cross-skill owners

| Domain | Owner |
|--------|-------|
| Stripe trial webhook + `trial_ending_email_sent_at` | [bondery-payments](../bondery-payments/SKILL.md) |
| Voice, sentence case | [bondery-ux](../bondery-ux/SKILL.md) |
| PII, rate limits, trigger auth | [bondery-security](../bondery-security/SKILL.md) |
| Plunk subprocessor, marketing compliance | [bondery-legal](../bondery-legal/SKILL.md) |
| User-visible release notes | [bondery-changelog](../bondery-changelog/SKILL.md) |

## Pre-ship checklist

### Template (`@bondery/emails`)

- [ ] Uses `EmailWrapper` with distinct `preview` text (complements, not duplicates, subject)
- [ ] Branding from `@bondery/branding` — no one-off colors/assets
- [ ] Single primary CTA or clear transactional purpose
- [ ] Critical layout uses inline styles (don't rely on Tailwind alone)
- [ ] Previewed via `pnpm run dev:emails`; checked in mobile client
- [ ] Accessibility: heading order, descriptive links, alt text, contrast ≥ 4.5:1
- [ ] No secrets, tokens, or unnecessary PII in body

### Copy and UX

- [ ] Voice matches [bondery-ux](../bondery-ux/SKILL.md) (sentence case, second person, active)
- [ ] Subject specific, ~60 chars, no spam triggers
- [ ] "Why you're receiving this" line for automated sends

### Sending (API)

- [ ] Uses shared transporter singleton via `sendRenderedEmail` ([transporter.ts](../../apps/api/src/lib/notifications/transporter.ts))
- [ ] `from` / `replyTo` / `cc` follow [sending-and-env.md](references/sending-and-env.md)
- [ ] Graceful no-op when SMTP not configured (automated paths)
- [ ] Idempotent for webhooks/cron sends
- [ ] Appropriate API error for user-initiated failures

### Security and legal

- [ ] Trigger path authenticated/scoped ([bondery-security](../bondery-security/SKILL.md))
- [ ] Classified in [email-types.md](references/email-types.md)
- [ ] New/changed ESP → update [subprocessor registry](../bondery-legal/references/subprocessor-registry.md)

### Monorepo hygiene

- [ ] Export added to `packages/emails/package.json` + `index.ts`
- [ ] Entry in [catalog.md](references/catalog.md)
- [ ] Cross-skill owner doc updated if billing-specific
- [ ] User-visible change → [bondery-changelog](../bondery-changelog/SKILL.md) entry
