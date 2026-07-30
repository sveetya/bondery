# Architecture

## Stack

| Layer | Package / path | Role |
|-------|----------------|------|
| Templates | `packages/emails` (`@bondery/emails`) | React Email + Tailwind; presentation-only `copy` props |
| Copy | `packages/translations` (`platform/email/*`) | en / cs / de namespaces loaded in API |
| i18n | `apps/api/src/lib/notifications/email-i18n.ts` | Locale resolution + `loadNamespace` + interpolation |
| Render | `apps/api` | `@react-email/render` at send time |
| Transport | `apps/api/src/lib/notifications/transporter.ts` | Nodemailer → Plunk SMTP (production) |
| Triggers | `apps/api/src/services/notifications/`, `services/contacts/share.ts`, `lib/jobs/` | Routes, webhooks, pg-boss |

```text
packages/translations (platform/email)
        ↓ loadNamespace + interpolateCopy
apps/api notification service
        ↓ render(Template({ copy, ...data }))
        ↓ initEmailTransport() on onReady
        ↓ sendRenderedEmail() → getEmailTransporter()
Plunk SMTP (BONDERY_PRIVATE_EMAIL_*)
```

## Package boundaries

- **Templates only in `@bondery/emails`** — never send from webapp, mobile, or website.
- **No i18n hooks in templates** — API resolves locale and passes `copy` props (same pattern as Better Auth translations).
- **Send only from `apps/api`** — API owns SMTP credentials and delivery.
- **Branding from `@bondery/branding`** — `BRAND_PRIMARY_COLOR`, `BonderyLogotypeBlack`.

## Trigger paths

| Path | When | Example |
|------|------|---------|
| Sync (user request) | User action in API handler | Share contact, feedback |
| Webhook | External event | Stripe trial ending |
| Job | pg-boss schedule | Reminder digest hourly |
| Teardown | Account deletion flow | Account deleted (best-effort) |

Reminder digests run via **pg-boss** (`reminder-digest-hourly`, `0 * * * *` UTC). See [triggers-and-idempotency.md](./triggers-and-idempotency.md).

## Localization

| Email | Locale source |
|-------|----------------|
| Trial ending, account deleted, feedback, reminder digest | Recipient/submitter `user_settings.language` |
| Share contact | **Sender's** language (external recipients have no Bondery account) |

Namespaces live under `packages/translations/src/locales/{en,cs,de}/platform/email/` and are registered in `manifest.json` with `"platforms": ["email"]`.

Preview in `@bondery/emails` uses English defaults from `packages/emails/src/fixtures/default-copy.ts`.

## Known gaps

1. **No plain-text multipart** — HTML only today.

## Health check

`GET /health/ready` live-verifies SMTP via `probeSmtp()` → `verifyEmailTransport()` on the shared pool (cached with other readiness probes). Missing or misconfigured SMTP is unhealthy in development and production (503). In `NODE_ENV=test`, unconfigured SMTP is not critical.

Eager `initEmailTransport()` on `onReady` catches misconfiguration before pg-boss jobs run; development and production boot fail on missing env or verify failure. CI (`NODE_ENV=test`) skips live verify.

## Related skills

- Billing trigger for trial email → [bondery-payments](../../bondery-payments/references/trial-ending-email.md)
- Reminder product UX → `docs/concepts/reminders.mdx`
- Architecture overview → `docs/contributing/architecture.mdx`
