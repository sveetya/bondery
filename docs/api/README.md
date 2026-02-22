# API Reference

The Bondery API is a Fastify-based REST server that handles all data operations for the platform.

## Base URLs

| Environment | URL |
|---|---|
| Local development | `http://localhost:3001` |
| Production | `https://api.usebondery.com` |

## Key characteristics

- **Framework:** Fastify 5 with TypeScript
- **Authentication:** Cookie-based via Supabase Auth (see [Authentication](authentication.md))
- **File uploads:** Multipart form data, max 300 MB (`@fastify/multipart`)
- **CORS:** Configured for webapp and website origins
- **Logging:** Pino (pretty-printed in development)
- **Deployment:** Vercel serverless functions

## Response format

All successful responses return JSON. The shape varies by endpoint but follows consistent patterns:

```json
// Single resource
{ "contact": { ... } }

// Collection
{ "contacts": [...], "totalCount": 42 }

// Mutation confirmation
{ "message": "Contact updated successfully" }

// Success with data
{ "success": true, "data": { ... } }
```

## Error format

All errors return JSON with an `error` field:

```json
{
  "error": "Invalid request",
  "description": "First name is required"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Authentication required |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate relationship) |
| `500` | Internal server error |

## Endpoint groups

| Group | Base path | Description |
|---|---|---|
| [Contacts](endpoints/contacts.md) | `/api/contacts` | Contact CRUD, photos, vCard export |
| [Groups](endpoints/groups.md) | `/api/groups` | Group management and membership |
| [Events](endpoints/events.md) | `/api/events` | Timeline events |
| [Relationships](endpoints/relationships.md) | `/api/contacts/:id/relationships` | Contact-to-contact relationships |
| [Important Events](endpoints/important-events.md) | `/api/contacts/:id/important-events` | Birthdays, anniversaries |
| [Account](endpoints/account.md) | `/api/account` | User account management |
| [Settings](endpoints/settings.md) | `/api/settings` | User preferences |
| [Import](endpoints/import.md) | `/api/contacts/import` | LinkedIn and Instagram import |
| [Redirect](endpoints/redirect.md) | `/api/redirect` | Chrome extension integration |
| [Feedback](endpoints/feedback.md) | `/api/feedback` | User feedback |
| [Reminders](endpoints/reminders.md) | `/api/reminders` | Internal reminder dispatch |

## OpenAPI specification

The full machine-readable API specification is available as [openapi.yaml](openapi.yaml) (OpenAPI 3.0).

You can view it with:
- [Swagger Editor](https://editor.swagger.io/)
- Postman, Insomnia, or Bruno (import the YAML)
- GitBook (auto-rendered via OpenAPI integration)
