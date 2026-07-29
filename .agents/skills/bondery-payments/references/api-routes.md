# API routes

| Route | Method | Notes |
|-------|--------|-------|
| `/api/subscriptions` | GET | DB-only status + quota |
| `/api/subscriptions/checkout` | POST | `{ interval }` → `{ clientSecret }` |
| `/api/subscriptions/portal` | GET | Redirect to Stripe billing portal |
| `/api/subscriptions/sync` | POST | Claim pending / Stripe API recovery |
| `/api/webhooks/stripe` | POST | Stripe webhooks (no auth) |
