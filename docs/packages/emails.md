# @bondery/emails

React Email templates for transactional emails sent by the API.

**Version:** 0.1.0
**Build:** `tsc`
**Preview server:** Port 3004

## Exports

| Export path | Description |
|---|---|
| `@bondery/emails` | All email templates |

## Templates

### ReminderDigestEmail

Daily/weekly reminder digest sent to users with upcoming important events (birthdays, anniversaries, etc.).

**Props:**
- User name and language
- List of upcoming events with contact names and dates
- Link to the webapp

### FeedbackEmail

Sent when a user submits feedback via the feedback form.

**Props:**
- User email
- NPS score and reason
- General feedback text

## Development

Preview email templates in the browser:

```bash
cd packages/emails
npm run dev
```

Opens React Email's preview server at http://localhost:3004 where you can view and iterate on templates with hot reload.

## Dependencies

- `@bondery/branding` -- brand assets for email headers
- `@bondery/mantine-next` -- theme colors
- `@react-email/components` -- email-safe UI components
- `@react-email/render` -- server-side rendering to HTML
- `@react-email/tailwind` -- Tailwind CSS for emails

## How emails are sent

1. API endpoint receives a trigger (feedback submission or reminder cron)
2. Template is rendered to HTML using `@react-email/render`
3. HTML is sent via `nodemailer` through the configured SMTP server
4. Configuration: see [Environment Variables](../getting-started/environment-variables.md) (PRIVATE_EMAIL_* variables)
