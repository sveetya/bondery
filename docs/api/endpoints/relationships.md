# Relationships

Base path: `/api/contacts/:id/relationships`

Relationships connect two contacts in the user's network (e.g. "Ada is Grace's colleague"). All endpoints require authentication.

## List relationships

```
GET /api/contacts/:id/relationships
```

Returns all relationships for a given contact.

**Response** `200`:

```json
{
  "relationships": [
    {
      "id": "uuid",
      "sourcePersonId": "uuid",
      "targetPersonId": "uuid",
      "relationshipType": "colleague",
      "targetPerson": {
        "id": "uuid",
        "firstName": "Grace",
        "lastName": "Hopper"
      },
      "createdAt": "2026-01-20T10:00:00.000Z"
    }
  ]
}
```

## Create relationship

```
POST /api/contacts/:id/relationships
```

**Request body:**

```json
{
  "relatedPersonId": "uuid",
  "relationshipType": "colleague"
}
```

**Relationship types:** `parent`, `child`, `spouse`, `partner`, `sibling`, `friend`, `colleague`, `neighbor`, `guardian`, `dependent`, `other`

Duplicate relationships (same pair + type, including reverse direction) return `409 Conflict`.

**Response** `201`:

```json
{
  "relationship": {
    "id": "uuid",
    "sourcePersonId": "uuid",
    "targetPersonId": "uuid",
    "relationshipType": "colleague"
  }
}
```

## Update relationship

```
PATCH /api/contacts/:id/relationships/:relationshipId
```

**Request body:**

```json
{
  "relatedPersonId": "uuid",
  "relationshipType": "friend"
}
```

**Response** `200`:

```json
{
  "relationship": {
    "id": "uuid",
    "sourcePersonId": "uuid",
    "targetPersonId": "uuid",
    "relationshipType": "friend"
  }
}
```

## Delete relationship

```
DELETE /api/contacts/:id/relationships/:relationshipId
```

**Response** `200`:

```json
{ "message": "Relationship deleted successfully" }
```
