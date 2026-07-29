# Trial-ending email

**Trigger:** `customer.subscription.trial_will_end` (~3 days before trial end).

**Template:** `packages/emails/src/templates/TrialEndingEmail.tsx`

**Handler:** `webhook-handlers/trial-ending.ts` — idempotent via `trial_ending_email_sent_at` on `subscriptions`.

**Delivery:** `sendTrialEndingEmail` via existing SMTP (`BONDERY_PRIVATE_EMAIL_*`).
