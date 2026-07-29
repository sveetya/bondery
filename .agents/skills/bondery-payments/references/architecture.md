# Architecture

Stripe Billing is integrated via custom Fastify routes and `apps/api/src/services/billing/*`.

See `docs/adr/0002-stripe-billing.md` for the decision to avoid the Better Auth Stripe plugin.

- **Mirror table:** `subscriptions` (webhook-maintained)
- **Pending checkout:** `pending_subscriptions` when no Bondery user exists yet
- **Idempotency:** `stripe_webhook_events`
