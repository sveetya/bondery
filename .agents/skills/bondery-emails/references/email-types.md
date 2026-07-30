# Email types

Classification affects legal requirements and deliverability expectations.

## Types in Bondery today

| Type | Description | Examples | Unsubscribe required? |
|------|-------------|----------|---------------------|
| **Transactional** | Tied to account or product action | Trial ending, account deleted | No — include "why you got this" + support contact |
| **User-initiated** | User explicitly triggers send | Share contact, feedback | No |
| **Digest** | Scheduled product notification user opted into | Reminder digest | No (user controls reminders in settings) — if reclassified as marketing, legal review required |
| **Internal ops** | To team, not end-user marketing | Feedback to ops inbox | N/A |

## What we do not send

- Marketing newsletters or promotional broadcasts
- Auth magic links / password reset (OAuth-only auth today)
- Cold outreach

## Legal escalation

Coordinate with [bondery-legal](../../bondery-legal/SKILL.md) when:

- Adding a new email type that could be construed as marketing
- Adding a new ESP or changing data sent to Plunk
- Adding unsubscribe requirements or preference center

## No-reply policy

Do not use `no-reply@` From addresses. Use reply-capable addresses and set `replyTo` when the user should respond (share contact, feedback).

## Tracking

No link or open tracking on transactional emails — improves deliverability and trust. See [deliverability.md](./deliverability.md).
