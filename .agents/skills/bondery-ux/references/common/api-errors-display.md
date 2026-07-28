# API error display (client)

Show API failures using translated catalog copy — never raw server `message` strings in notifications.

## Helpers

Import from `@bondery/helpers/api`:

- `ApiError` — typed error with `code`, `type`, `doc_url`
- `buildApiErrorFromResponse` — parse nested `{ error: ... }` envelope
- `getUserFacingError(error, t)` — resolve translated copy for notifications

## Rules

- Use `getUserMessage(t)` or `getUserFacingError` for toast/notification text
- **Never** surface server `message` in user-facing notifications
- Error codes map to `common.errors.api.{code}` in **en**, **cs**, **de**

## Server catalog

For adding error codes, catalog entries, and CI requirements, see the `bondery-api` skill → [api-errors.md](../../../bondery-api/references/api-errors.md).

## Transport

App transport (`clientApiJson`, `serverApiJson`, `apiRequest`) stays in each app. See `bondery-api` → [api-usage.md](../../../bondery-api/references/api-usage.md) for 401/outage handling.

## Checklist

- [ ] Notifications use `getUserFacingError` — not `error.message`
- [ ] New error code has `common.errors.api.{code}` in all locales
- [ ] 401 triggers session teardown per api-usage transport policy
