# Webhook events

| Event | Handler action |
|-------|----------------|
| `checkout.session.completed` | Retrieve subscription, upsert mirror |
| `customer.subscription.created` | Upsert mirror |
| `customer.subscription.updated` | Upsert mirror |
| `customer.subscription.deleted` | Mark canceled |
| `invoice.paid` | Reset `payment_failure_count` |
| `invoice.payment_failed` | Set `payment_failure_count` from `attempt_count` |
| `customer.subscription.trial_will_end` | Send trial-ending email (once) |

Raw body verification: `stripe.webhooks.constructEvent`.
