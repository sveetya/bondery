# Preview and testing

## Local preview

```bash
# Emails package only
pnpm run dev:emails

# Or via root script
pnpm run dev:emails
```

- **Port:** 26639 (`packages/schemas/src/constants/dev-ports.ts` → `EMAIL_PREVIEW`)
- **Tool:** React Email CLI (`email dev --dir ./src/templates`)
- Opens browser UI to browse templates under `packages/emails/src/templates/{account,billing,internal,notifications}/`

Preview **before** opening a PR for any template change.

## Default props

Each template should export sensible default props for preview (component default parameters or a fixtures file). When adding templates, ensure the preview server renders without required runtime data from the API.

Optional future improvement: `assets/fixtures/*.json` per template for consistent preview data.

## Manual client testing

After preview, spot-check in real clients:

1. **Gmail** (web + mobile app)
2. **Apple Mail** (iOS)

Check: subject, **preview snippet (≤90 chars)**, single-column layout, button/link tap targets, header logo, footer help; digest “Manage these notifications”; **no** legal HQ on transactional templates.

## Automated testing

API coverage lives next to senders (for example `apps/api/src/test/magic-link-email.test.ts`, `email-i18n.test.ts`, `email-transporter.test.ts`). When adding an email, extend those rather than inventing a second test stack.

| Level | What to test |
|-------|----------------|
| Unit smoke | `renderEmailParts(YourEmail(props))` does not throw; HTML has `<Preview>`; `text` has body/CTA URL; optional HTML snapshot |
| Integration | Mock `sendRenderedEmail`; assert called with expected `to`/`subject`/`from` **and** `text` |
| E2E | Do **not** assert real inbox delivery unless you have a test mailbox |

API tests stub email env in `apps/api/src/test/load-test-env.ts` with dummy `BONDERY_PRIVATE_EMAIL_*`.

## Dev SMTP

Production uses Plunk SMTP. For local send testing, use a local catcher (Mailpit, Inbucket) with matching env vars — never send intentional hard bounces to fake addresses (damages sender reputation).

## Verification loop

When changing email code:

| Changed paths | Checks |
|---------------|--------|
| `packages/emails/**` | `pnpm --filter @bondery/emails run compile` and `pnpm --filter @bondery/emails run test` |
| `apps/api/src/services/notifications/**` | API typecheck/lint per [bondery-verification-loop](../../bondery-verification-loop/SKILL.md) |

## Related docs

- `docs/contributing/local-setup.mdx` — `dev:emails`
- `docs/contributing/architecture.mdx` — email stack overview
