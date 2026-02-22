# Groups

Base path: `/api/groups`

All endpoints require authentication.

## List groups

```
GET /api/groups
```

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `previewLimit` | integer | Max number of contact previews per group |

**Response** `200`:

```json
{
  "groups": [
    {
      "id": "uuid",
      "label": "Family",
      "emoji": "👨‍👩‍👧‍👦",
      "color": "blue",
      "contactCount": 12,
      "contactPreviews": [
        { "id": "uuid", "firstName": "Ada", "lastName": "Lovelace", "avatar": "..." }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "totalCount": 5
}
```

## Create group

```
POST /api/groups
```

**Request body:**

```json
{
  "label": "Colleagues",
  "emoji": "💼",
  "color": "green"
}
```

Only `label` is required.

**Response** `201`:

```json
{ "id": "uuid" }
```

## Get group

```
GET /api/groups/:id
```

**Response** `200`:

```json
{
  "group": {
    "id": "uuid",
    "label": "Family",
    "emoji": "👨‍👩‍👧‍👦",
    "color": "blue",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

## Update group

```
PATCH /api/groups/:id
```

**Request body:**

```json
{
  "label": "Close Family",
  "emoji": "❤️",
  "color": "red"
}
```

All fields are optional.

**Response** `200`:

```json
{ "message": "Group updated successfully" }
```

## Delete group

```
DELETE /api/groups/:id
```

**Response** `200`:

```json
{ "message": "Group deleted successfully" }
```

## Delete groups (bulk)

```
DELETE /api/groups
```

**Request body:**

```json
{
  "ids": ["uuid-1", "uuid-2"]
}
```

**Response** `200`:

```json
{ "message": "Groups deleted successfully" }
```

## Get group contacts

```
GET /api/groups/:id/contacts
```

**Response** `200`:

```json
{
  "group": {
    "id": "uuid",
    "label": "Family"
  },
  "contacts": [
    { "id": "uuid", "firstName": "Ada", "lastName": "Lovelace", "..." : "..." }
  ],
  "totalCount": 12
}
```

## Add contacts to group

```
POST /api/groups/:id/contacts
```

**Request body:**

```json
{
  "personIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response** `200`:

```json
{ "message": "Contacts added to group" }
```

## Remove contacts from group

```
DELETE /api/groups/:id/contacts
```

**Request body:**

```json
{
  "personIds": ["uuid-1", "uuid-2"]
}
```

**Response** `200`:

```json
{ "message": "Contacts removed from group" }
```
