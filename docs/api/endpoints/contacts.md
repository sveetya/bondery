# Contacts

Base path: `/api/contacts`

All endpoints require authentication.

## List contacts

```
GET /api/contacts
```

Retrieve all contacts for the authenticated user (excludes the user's own "myself" profile).

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `limit` | integer | Max number of contacts to return |
| `offset` | integer | Pagination offset |
| `q` | string | Search query (matches first name, last name, etc.) |
| `sort` | string | Sort order: `nameAsc`, `nameDesc`, `surnameAsc`, `surnameDesc`, `interactionAsc`, `interactionDesc` |

**Response** `200`:

```json
{
  "contacts": [
    {
      "id": "uuid",
      "firstName": "Ada",
      "lastName": "Lovelace",
      "title": "Mathematician",
      "place": "London",
      "avatar": "https://...",
      "avatarColor": "blue",
      "lastInteraction": "2026-01-15T10:30:00.000Z",
      "phones": [{ "prefix": "+44", "value": "123456", "type": "work", "preferred": true }],
      "emails": [{ "value": "ada@example.com", "type": "home", "preferred": true }],
      "socialMedia": [{ "platform": "linkedin", "handle": "ada-lovelace" }],
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "totalCount": 42,
  "stats": {
    "totalContacts": 42,
    "recentlyAdded": 5
  }
}
```

## Create contact

```
POST /api/contacts
```

**Request body:**

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "linkedin": "ada-lovelace"
}
```

`firstName` is required. `lastName` and `linkedin` are optional.

**Response** `201`:

```json
{ "id": "uuid" }
```

## Get contact

```
GET /api/contacts/:id
```

**Response** `200`:

```json
{
  "contact": {
    "id": "uuid",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "middleName": null,
    "title": "Mathematician",
    "place": "London",
    "description": "Pioneer of computing",
    "notes": "Met at conference",
    "avatar": "https://...",
    "avatarColor": "blue",
    "lastInteraction": "2026-01-15T10:30:00.000Z",
    "phones": [],
    "emails": [],
    "socialMedia": [],
    "gender": null,
    "language": null,
    "timezone": null,
    "nickname": null,
    "position": null,
    "latitude": null,
    "longitude": null,
    "myself": false,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

## Update contact

```
PATCH /api/contacts/:id
```

All fields are optional. Only provided fields are updated.

**Request body:**

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "title": "Mathematician & Writer",
  "place": "London, UK",
  "description": "...",
  "notes": "...",
  "avatarColor": "purple",
  "phones": [{ "prefix": "+44", "value": "123456", "type": "work", "preferred": true }],
  "emails": [{ "value": "ada@example.com", "type": "home", "preferred": true }],
  "socialMedia": {
    "linkedin": "ada-lovelace",
    "instagram": null
  },
  "gender": "female",
  "language": "en",
  "timezone": "Europe/London",
  "nickname": "Ada",
  "position": { "company": "Babbage Inc", "role": "Lead Analyst" },
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

**Response** `200`:

```json
{ "message": "Contact updated successfully" }
```

## Delete contacts (bulk)

```
DELETE /api/contacts
```

**Request body:**

```json
{
  "ids": ["uuid-1", "uuid-2"]
}
```

**Response** `200`:

```json
{ "message": "Contacts deleted successfully" }
```

## Upload contact photo

```
POST /api/contacts/:id/photo
Content-Type: multipart/form-data
```

Accepts JPEG, PNG, GIF, or WebP. Max 5 MB.

**Response** `200`:

```json
{
  "success": true,
  "avatarUrl": "https://storage.example.com/avatars/user-id/contact-id.jpg?t=1234567890"
}
```

## Delete contact photo

```
DELETE /api/contacts/:id/photo
```

**Response** `200`:

```json
{ "success": true }
```

## Export vCard

```
GET /api/contacts/:id/vcard
```

Returns a downloadable `.vcf` file with the contact's information.

**Response** `200`:

```
Content-Type: text/vcard
Content-Disposition: attachment; filename="Ada_Lovelace.vcf"

BEGIN:VCARD
VERSION:3.0
...
END:VCARD
```

## Get upcoming reminders

```
GET /api/contacts/important-events/upcoming
```

Returns upcoming important events (birthdays, anniversaries) across all contacts.

**Response** `200`:

```json
{
  "reminders": [
    {
      "personId": "uuid",
      "personFirstName": "Ada",
      "personLastName": "Lovelace",
      "eventType": "birthday",
      "eventDate": "2026-03-15",
      "note": null,
      "daysUntil": 5
    }
  ]
}
```
