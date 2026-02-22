# Environment Variables

Each application has its own `.env` files. This page lists every variable across all apps.

## Shared variables

These variables are used by multiple apps and should be consistent:

| Variable | Description | Dev default |
|---|---|---|
| `NEXT_PUBLIC_WEBAPP_URL` | Webapp base URL | `http://localhost:3002` |
| `NEXT_PUBLIC_WEBSITE_URL` | Website base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3001` |

## API (`apps/api`)

File: `.env.development.local`

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |
| `PRIVATE_SUPABASE_SECRET_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_API_URL` | Yes | API's own base URL (used for port) |
| `NEXT_PUBLIC_WEBAPP_URL` | No | Webapp URL for CORS |
| `NEXT_PUBLIC_WEBSITE_URL` | No | Website URL for CORS |
| `API_PORT` | No | Server port (default: derived from URL) |
| `API_HOST` | No | Server host (default: `0.0.0.0`) |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |
| `PRIVATE_EMAIL_HOST` | Yes | SMTP host |
| `PRIVATE_EMAIL_PORT` | Yes | SMTP port (e.g. `465`) |
| `PRIVATE_EMAIL_USER` | Yes | SMTP username |
| `PRIVATE_EMAIL_PASS` | Yes | SMTP password |
| `PRIVATE_EMAIL_ADDRESS` | Yes | "From" email address |
| `PRIVATE_BONDERY_SUPABASE_HTTP_KEY` | Yes | Shared secret for internal reminder cron calls |
| `DO_NOT_TRACK` | No | Disable analytics |

## Webapp (`apps/webapp`)

File: `.env.development.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Yes | API base URL (used for rewrites) |
| `NEXT_PUBLIC_WEBAPP_URL` | Yes | Webapp's own URL |
| `NEXT_PUBLIC_WEBSITE_URL` | Yes | Website URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog host URL |
| `DO_NOT_TRACK` | No | Disable analytics |

## Chrome Extension (`apps/chrome-extension`)

File: `.env.development.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_WEBAPP_URL` | Yes | Webapp URL (redirect target) |
| `NEXT_PUBLIC_WEBSITE_URL` | No | Website URL |
| `NEXT_PUBLIC_API_URL` | No | API URL |

## Supabase DB (`apps/supabase-db`)

File: `.env.local`

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | No | Local Supabase URL (auto-set by `supabase start`) |
| `POSTGRES_PASSWORD` | No | PostgreSQL password (default: `postgres`) |
| `POSTGRES_HOST` | No | PostgreSQL host (default: `localhost`) |
| `POSTGRES_PORT` | No | PostgreSQL port (default: `54322`) |
| `POSTGRES_DB` | No | Database name (default: `postgres`) |
| `NEXT_PUBLIC_WEBAPP_URL` | Yes | Webapp URL for auth callback redirects |
| `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET` | No | GitHub OAuth secret |
| `SUPABASE_AUTH_EXTERNAL_LINKEDIN_CLIENT_ID` | No | LinkedIn OIDC client ID |
| `SUPABASE_AUTH_EXTERNAL_LINKEDIN_SECRET` | No | LinkedIn OIDC secret |
| `SUPABASE_AUTH_CALLBACK_URL` | No | Auth callback URL |

## Supabase Edge Functions

File: `apps/supabase-db/supabase/functions/.env.local`

Edge functions can access variables from this file when running locally via `supabase functions serve`.
