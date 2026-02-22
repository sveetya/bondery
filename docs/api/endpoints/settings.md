# Settings

Base path: `/api/settings`

Manage user preferences. All endpoints require authentication.

## Get settings

```
GET /api/settings
```

**Response** `200`:

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "name": "John",
    "middlename": null,
    "surname": "Doe",
    "timezone": "Europe/Prague",
    "reminder_send_hour": "08:00:00",
    "language": "cs",
    "color_scheme": "auto",
    "avatar_url": "https://...",
    "email": "john@example.com",
    "providers": ["github"]
  }
}
```

## Update settings

```
PATCH /api/settings
```

**Request body:**

```json
{
  "name": "John",
  "middlename": "Michael",
  "surname": "Doe",
  "timezone": "Europe/Prague",
  "reminder_send_hour": "09:00",
  "language": "cs",
  "color_scheme": "dark"
}
```

All fields are optional.

| Field | Type | Values |
|---|---|---|
| `name` | string | User's first name |
| `middlename` | string | User's middle name |
| `surname` | string | User's last name |
| `timezone` | string | IANA timezone (e.g. `Europe/Prague`) |
| `reminder_send_hour` | string | Time in `HH:mm` or `HH:mm:ss` format |
| `language` | string | `en` or `cs` |
| `color_scheme` | string | `light`, `dark`, or `auto` |

**Response** `200`:

```json
{
  "success": true,
  "data": { "..." : "..." }
}
```
