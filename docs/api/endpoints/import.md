# Import

Base path: `/api/contacts/import`

Import contacts from LinkedIn and Instagram data exports. Both flows follow a two-step process: **parse** (preview) then **commit** (import). All endpoints require authentication.

## LinkedIn import

### Parse LinkedIn export

```
POST /api/contacts/import/linkedin/parse
Content-Type: multipart/form-data
```

Upload a LinkedIn data export (ZIP archive or individual CSV files). The parser extracts contacts from `Connections.csv`.

**Extracted fields per contact:**
- First name, last name
- Email address
- Company / position
- LinkedIn username
- Connection date

**Response** `200`:

```json
{
  "contacts": [
    {
      "firstName": "Ada",
      "lastName": "Lovelace",
      "email": "ada@example.com",
      "linkedin": "ada-lovelace",
      "title": "Mathematician at Babbage Inc",
      "connectedAt": "2025-06-15T00:00:00.000Z",
      "existingPersonId": null
    }
  ],
  "totalParsed": 150,
  "alreadyImported": 12
}
```

`existingPersonId` is set when a contact with the same LinkedIn handle already exists.

### Commit LinkedIn import

```
POST /api/contacts/import/linkedin/commit
```

**Request body:**

```json
{
  "contacts": [
    {
      "firstName": "Ada",
      "lastName": "Lovelace",
      "email": "ada@example.com",
      "linkedin": "ada-lovelace",
      "title": "Mathematician at Babbage Inc",
      "connectedAt": "2025-06-15T00:00:00.000Z",
      "existingPersonId": null
    }
  ]
}
```

**Response** `200`:

```json
{
  "importedCount": 45,
  "updatedCount": 3,
  "skippedCount": 2
}
```

## Instagram import

### Parse Instagram export

```
POST /api/contacts/import/instagram/parse
Content-Type: multipart/form-data
```

Upload an Instagram data export (ZIP archive containing JSON files).

**Form fields:**

| Field | Type | Description |
|---|---|---|
| `file` | file | ZIP archive |
| `strategy` | string | Which contacts to extract |

**Import strategies:**

| Strategy | Description |
|---|---|
| `close_friends` | Only close friends list |
| `following` | Accounts you follow |
| `followers` | Accounts that follow you |
| `following_and_followers` | Union of following + followers |
| `mutual_following` | Intersection (mutual follows) |

**Response** `200`:

```json
{
  "contacts": [
    {
      "instagram": "ada_lovelace",
      "firstName": "ada_lovelace",
      "existingPersonId": null
    }
  ],
  "totalParsed": 200,
  "alreadyImported": 5
}
```

### Commit Instagram import

```
POST /api/contacts/import/instagram/commit
```

**Request body:**

```json
{
  "contacts": [
    {
      "instagram": "ada_lovelace",
      "firstName": "Ada",
      "lastName": "Lovelace",
      "existingPersonId": null
    }
  ]
}
```

**Response** `200`:

```json
{
  "importedCount": 50,
  "updatedCount": 2,
  "skippedCount": 0
}
```
