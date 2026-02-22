# Events

Base path: `/api/events`

Events represent timeline entries -- meetings, calls, notes, and other interactions with contacts. All endpoints require authentication.

## List events

```
GET /api/events
```

**Response** `200`:

```json
{
  "events": [
    {
      "id": "uuid",
      "type": "meeting",
      "title": "Coffee chat",
      "description": "Discussed project roadmap",
      "date": "2026-02-15T14:00:00.000Z",
      "participants": [
        { "id": "uuid", "firstName": "Ada", "lastName": "Lovelace" }
      ],
      "createdAt": "2026-02-15T14:30:00.000Z"
    }
  ],
  "totalCount": 25
}
```

## Create event

```
POST /api/events
```

**Request body:**

```json
{
  "type": "meeting",
  "title": "Coffee chat",
  "description": "Discussed project roadmap",
  "date": "2026-02-15T14:00:00.000Z",
  "participantIds": ["uuid-1", "uuid-2"]
}
```

`type` and `date` are required. `title`, `description`, and `participantIds` are optional.

**Event types:** `call`, `coffee`, `email`, `meal`, `meeting`, `networking_event`, `note`, `other`, `party_social`, `text_messaging`, `competition_hackathon`, `custom`

**Response** `201`:

```json
{ "id": "uuid" }
```

## Update event

```
PATCH /api/events/:id
```

**Request body:**

```json
{
  "title": "Updated title",
  "description": "New description",
  "type": "coffee",
  "date": "2026-02-16T10:00:00.000Z",
  "participantIds": ["uuid-1"]
}
```

All fields are optional.

**Response** `200`:

```json
{ "message": "Event updated successfully" }
```

## Delete event

```
DELETE /api/events/:id
```

**Response** `200`:

```json
{ "message": "Event deleted successfully" }
```
