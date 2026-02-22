# Database Overview

Bondery uses **Supabase** as its backend platform, which provides a managed **PostgreSQL 17** database with extensions, authentication, storage, and cron jobs.

## Key characteristics

- **Row Level Security (RLS)** on every table -- users can only access their own data
- **PostGIS** extension for geographic coordinates
- **Automatic triggers** for `updated_at` timestamps, reminder scheduling, and user onboarding
- **Hourly cron job** for timezone-aware reminder dispatch
- **41 migration files** tracking the complete schema evolution

## Local development

```bash
cd apps/supabase-db

# Start local Supabase (PostgreSQL, Auth, Storage, Studio)
npx supabase start

# Reset database (runs all migrations + seed.sql)
npx supabase db reset

# Create a new migration
npx supabase migration new <name>

# Generate TypeScript types
npm run gen-types
```

## Services and ports

| Service | Port | URL |
|---|---|---|
| Supabase API | 54321 | http://127.0.0.1:54321 |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Supabase Studio | 54323 | http://localhost:54323 |
| Inbucket (email) | 54324 | http://localhost:54324 |

## Related documentation

- [Schema](schema.md) -- all tables, columns, types, and constraints
- [Row Level Security](rls-policies.md) -- RLS policies
- [Functions & Triggers](functions-triggers.md) -- database functions, triggers, and cron jobs
- [Migrations](migrations.md) -- migration history

## Entity relationship diagram

```mermaid
erDiagram
    users ||--o{ people : "owns"
    users ||--|| user_settings : "has"
    users ||--o{ groups : "owns"
    users ||--o{ events : "owns"

    people ||--o{ people_phones : "has"
    people ||--o{ people_emails : "has"
    people ||--o{ people_social_media : "has"
    people ||--o{ people_important_events : "has"
    people ||--o{ people_relationships : "source"
    people ||--o{ people_relationships : "target"
    people ||--o{ people_groups : "belongs to"
    people ||--o{ event_participants : "participates in"

    groups ||--o{ people_groups : "contains"
    events ||--o{ event_participants : "has"

    users ||--o{ reminder_dispatch_log : "logged"
```
