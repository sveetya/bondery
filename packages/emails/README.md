# @bondery/emails

React Email templates for Bondery transactional mail. Sending happens in `apps/api` — this package is templates only.

## Preview locally

```bash
npm run dev:emails
```

Opens the React Email dev server on port **26639**.

## Agent skill

Full patterns, catalog, and pre-ship checklist: [`.agents/skills/bondery-emails/SKILL.md`](../../.agents/skills/bondery-emails/SKILL.md)

## Templates

| Template | Purpose |
|----------|---------|
| `ShareContactEmail` | User shares a contact card |
| `ReminderDigestEmail` | Daily important-date digest |
| `TrialEndingEmail` | Premium trial ending notice |
| `AccountDeletedEmail` | Post-deletion confirmation |
| `FeedbackEmail` | Internal NPS/feedback to ops |

Shared layout: `src/shared/EmailWrapper.tsx` (Lexend, brand color, logotype footer).
