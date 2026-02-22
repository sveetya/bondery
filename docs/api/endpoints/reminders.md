# Reminders

Base path: `/api/reminders`

Internal endpoint called by the Supabase cron job to send reminder digest emails.

## Send reminder digests

```
POST /api/reminders/daily-digest
```

**Authentication:** Header-based with shared secret.

```
x-reminder-job-secret: <PRIVATE_BONDERY_SUPABASE_HTTP_KEY>
```

This endpoint is **not** called by the webapp or extension. It is invoked by the `send_hourly_reminder_digests()` PostgreSQL function, which is triggered by a Supabase cron job running every hour at `:05`.

**Request body:**

```json
{
  "targetDate": "2026-02-22",
  "users": [
    {
      "userId": "uuid",
      "email": "john@example.com",
      "name": "John",
      "language": "en",
      "timezone": "Europe/Prague",
      "reminders": [
        {
          "personId": "uuid",
          "personFirstName": "Ada",
          "personLastName": "Lovelace",
          "eventType": "birthday",
          "eventDate": "1990-03-15",
          "daysUntil": 3,
          "note": null
        }
      ]
    }
  ]
}
```

**Response** `200`:

```json
{
  "success": true,
  "targetDate": "2026-02-22",
  "sentUsers": 15,
  "failedUsers": 0,
  "failures": []
}
```

Each user receives a personalized digest email rendered from the `ReminderDigestEmail` React Email template, listing all their upcoming important events.

## How the cron pipeline works

1. Supabase cron runs `send_hourly_reminder_digests()` every hour at `:05`
2. The function finds users whose `next_reminder_at_utc` has passed
3. It collects upcoming important events for each user (where `notify_on` is within the target range)
4. It checks `reminder_dispatch_log` to avoid sending duplicates
5. It calls this endpoint with the aggregated payload
6. After successful dispatch, it logs the send and advances `next_reminder_at_utc` by 24 hours
