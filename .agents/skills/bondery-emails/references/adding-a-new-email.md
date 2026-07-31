# Adding a new email

Step-by-step recipe for a new transactional email.

## 1. Add the template

Create `packages/emails/src/templates/YourEmail.tsx`:

- Wrap content in [`EmailWrapper`](../packages/emails/src/shared/EmailWrapper.tsx) with a meaningful `preview` prop.
- Import branding from `@bondery/branding` — no one-off colors or logos.
- Export props type and default component.

## 2. Export from the package

1. Add export to `packages/emails/src/index.ts`.
2. Add subpath to `packages/emails/package.json` `exports` if using a new file pattern.
3. Run `npm run sync-exports -w @bondery/emails` if your workflow requires it.
4. Build: `npm run compile -w @bondery/emails`.

## 3. Preview locally

```bash
npm run dev:emails
```

Open port **26639**, verify layout in browser. See [dx-preview-and-test.md](./dx-preview-and-test.md).

## 4. Add a sender in the API

Create `apps/api/src/services/notifications/your-email.ts`:

```typescript
import { YourEmail } from "@bondery/emails";
import { render } from "@react-email/render";
import {
  getEmailConfig,
  isEmailConfigured,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";
```

- Use `isEmailConfigured()` — return early with `log?.warn` when false (automated sends).
- Use `sendRenderedEmail(options, log)` — do not call `createTransport` or `createEmailTransporter` from services.
- Resolve locale with `resolveEmailLocale` (or document sender-locale rule for external recipients).
- Load copy with `loadEmailNamespace` + `email-copy-builders.ts` helpers; pass `copy` into the template.
- Register new strings in `packages/translations` (en/cs/de) and `manifest.json` with `"platforms": ["email"]`.

## 5. Wire the trigger

| Trigger type | Where to wire |
|--------------|---------------|
| User API action | Route handler → service |
| Stripe webhook | `services/billing/webhook-handlers/` |
| Scheduled job | `lib/jobs/schedules.ts` + worker |
| Auth lifecycle | `lib/auth/` teardown or hooks |

For automated sends, add idempotency — see [triggers-and-idempotency.md](./triggers-and-idempotency.md).

## 6. Update the catalog

Add a row to [catalog.md](./catalog.md) with template, trigger, subject, from/replyTo, idempotency, and owner skill.

## 7. Cross-skill updates

- **bondery-payments** — if billing-related trigger
- **bondery-legal** — if new ESP or new data categories sent to vendor
- **bondery-changelog** — if user-visible
- OpenAPI / schemas — if new API surface

## 8. Pre-ship

Run the checklist in [SKILL.md](../SKILL.md#pre-ship-checklist).

## Anti-patterns

- Sending from webapp or mobile
- Marketing broadcasts in `@bondery/emails`
- Duplicating nodemailer config
- New ESP without updating [subprocessor registry](../../bondery-legal/references/subprocessor-registry.md)
- Fake bounce addresses in tests (damages sender reputation)
