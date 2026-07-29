# Env vars

| Variable | Purpose |
|----------|---------|
| `BONDERY_PRIVATE_STRIPE_SECRET_KEY` | Server Stripe API |
| `BONDERY_PRIVATE_STRIPE_WEBHOOK_SECRET` | Webhook signature |
| `BONDERY_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Embedded Checkout client |
| `BONDERY_PUBLIC_STRIPE_PRICE_ID_MONTHLY` | Monthly Price ID |
| `BONDERY_PUBLIC_STRIPE_PRICE_ID_ANNUAL` | Annual Price ID |
| `BONDERY_PUBLIC_BILLING_UPGRADES_ENABLED` | `true` to enable upgrades (default `false`) |

Registered in `packages/helpers/src/env/manifest.ts`.
