# Feedback

Base path: `/api/feedback`

## Submit feedback

```
POST /api/feedback
```

**Authentication:** Required.

Sends a feedback email to the Bondery team. The email is also CC'd to the submitting user.

**Request body:**

```json
{
  "npsScore": 8,
  "npsReason": "Great product, would love more integrations",
  "generalFeedback": "The LinkedIn import feature is very useful."
}
```

| Field | Type | Description |
|---|---|---|
| `npsScore` | number | Net Promoter Score (0--10) |
| `npsReason` | string | Reason for the score |
| `generalFeedback` | string | General feedback text |

**Response** `200`:

```json
{ "success": true }
```

The email is rendered using the `FeedbackEmail` React Email template and sent via SMTP.
