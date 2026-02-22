# Redirect

Base path: `/api/redirect`

Integration endpoint used by the Chrome extension to create or find contacts from social media profiles.

## Browser redirect (GET)

```
GET /api/redirect
```

**Authentication:** Optional. Unauthenticated users are redirected to login.

Used by the Chrome extension to redirect the user to the contact's page in the webapp. If the contact doesn't exist, it's created first.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `instagram` | string | Instagram username |
| `linkedin` | string | LinkedIn profile ID |
| `facebook` | string | Facebook profile ID |
| `firstName` | string | First name |
| `middleName` | string | Middle name |
| `lastName` | string | Last name |
| `profileImageUrl` | string | Profile image URL |
| `title` | string | Job title |
| `place` | string | Location or workplace |

At least one social media handle (`instagram`, `linkedin`, or `facebook`) is required.

**Response** `302`:

Redirects to one of:
- `{WEBAPP_URL}/app/person/{contactId}` -- if authenticated
- `{WEBAPP_URL}/login?returnUrl=...` -- if not authenticated

## API redirect (POST)

```
POST /api/redirect
```

**Authentication:** Required.

JSON API version of the redirect endpoint. Creates or finds a contact and returns the result without redirecting.

**Request body:**

```json
{
  "instagram": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "profileImageUrl": "https://example.com/photo.jpg",
  "title": "Software Engineer",
  "place": "San Francisco, CA"
}
```

**Response** `200`:

```json
{
  "contactId": "uuid",
  "existed": false
}
```

`existed` is `true` when a contact with the same social media handle was already in the user's network.
