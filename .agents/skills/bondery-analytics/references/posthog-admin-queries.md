# PostHog admin queries

Server-side HogQL for admin KPI dashboards — not client analytics.

## Service

`apps/api/src/services/admin/posthog.ts`

- `runHogQLQuery` → `https://eu.i.posthog.com/api/projects/{projectId}/query`
- `getActiveUsersTimeline` — DAU / WAU / MAU (identified users via person_id)
- NPS survey aggregation (last 90 days)

## Secrets (API only — never public)

| Env var | Purpose |
|---------|---------|
| `BONDERY_PRIVATE_POSTHOG_API_SECRET` | Personal/project API key (`ph_...`) |
| `BONDERY_PRIVATE_POSTHOG_PROJECT_ID` | PostHog project ID |

Defined in `apps/api/src/env-schema.ts` and `packages/helpers/src/env/manifest.ts`.

When unset, admin stats endpoints degrade gracefully (no PostHog data).

## Consumption

- Routes: `apps/api/src/routes/admin/stats/`
- Webapp admin UI fetches via BFF — not direct HogQL from browser

## Query design notes

- Filter **identified** users for activation metrics — anonymous `distinct_id` inflates counts
- Event names in HogQL must match catalog — legacy names exist until migrated to `category:object_action`
- No response caching in the PostHog service — Next.js data cache handles webapp caching

## Admin queries checklist

- [ ] HogQL uses canonical event names where possible
- [ ] Queries scoped to identified users for user-count KPIs
- [ ] No secrets in client bundles or runtime config
- [ ] New KPI documents which PostHog events/properties it depends on
