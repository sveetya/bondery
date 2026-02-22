# Important Events

Base path: `/api/contacts/:id/important-events`

Important events are recurring dates attached to a contact (birthdays, anniversaries, namedays, etc.). The system can send reminder emails ahead of these dates. All endpoints require authentication.

## List important events

```
GET /api/contacts/:id/important-events
```

**Response** `200`:

```json
{
  "events": [
    {
      "id": "uuid",
      "eventType": "birthday",
      "eventDate": "1990-03-15",
      "note": null,
      "notifyDaysBefore": 3,
      "createdAt": "2026-01-10T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "eventType": "anniversary",
      "eventDate": "2020-06-20",
      "note": "Wedding anniversary",
      "notifyDaysBefore": 7,
      "createdAt": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

## Replace important events

```
PUT /api/contacts/:id/important-events
```

This is a **full replacement** operation. The provided array replaces all existing important events for the contact.

**Request body:**

```json
{
  "events": [
    {
      "eventType": "birthday",
      "eventDate": "1990-03-15",
      "note": null,
      "notifyDaysBefore": 3
    },
    {
      "eventType": "anniversary",
      "eventDate": "2020-06-20",
      "note": "Wedding anniversary",
      "notifyDaysBefore": 7
    }
  ]
}
```

**Event types:** `birthday`, `anniversary`, `nameday`, `graduation`, `other`

**Notify options:** `1`, `3`, `7`, or `null` (no notification)

Only one `birthday` per contact is allowed.

**Response** `200`:

```json
{
  "events": [
    {
      "id": "uuid",
      "eventType": "birthday",
      "eventDate": "1990-03-15",
      "note": null,
      "notifyDaysBefore": 3
    }
  ]
}
```
