# Data Flow

This document describes how data flows through the Bondery system.

## Authentication flow

```mermaid
sequenceDiagram
    participant User
    participant Webapp
    participant SupabaseAuth as Supabase Auth
    participant Provider as OAuth Provider

    User->>Webapp: Click "Sign in with GitHub/LinkedIn"
    Webapp->>SupabaseAuth: signInWithOAuth()
    SupabaseAuth->>Provider: Redirect to OAuth consent
    Provider->>SupabaseAuth: Authorization code
    SupabaseAuth->>Webapp: Redirect to /auth/callback
    Webapp->>SupabaseAuth: Exchange code for session
    SupabaseAuth-->>Webapp: Session (access_token + refresh_token)
    Note over Webapp: Session stored in cookies
    Webapp->>User: Redirect to /app/home
```

On first login, a database trigger (`on_auth_user_created`) automatically creates a `user_settings` row.

## API request flow

```mermaid
sequenceDiagram
    participant Webapp
    participant API as Fastify API
    participant Supabase as Supabase (DB + Storage)

    Webapp->>API: GET /api/contacts (cookies + Bearer token)
    API->>API: Extract tokens from cookies
    API->>Supabase: setSession(access_token, refresh_token)
    Supabase-->>API: Authenticated client
    API->>Supabase: SELECT * FROM people WHERE user_id = auth.uid()
    Note over Supabase: RLS enforces row-level access
    Supabase-->>API: Rows
    API-->>Webapp: JSON response
```

All API requests follow this pattern:

1. Webapp makes a server-side fetch to the API, forwarding the user's cookies
2. API extracts Supabase tokens from cookies (supports chunked cookies)
3. API creates an authenticated Supabase client scoped to the user
4. All database queries go through RLS -- the user can only access their own data

## Chrome extension flow

```mermaid
sequenceDiagram
    participant User
    participant Extension
    participant SocialMedia as LinkedIn/Instagram/Facebook
    participant API as Fastify API
    participant Webapp

    User->>SocialMedia: Visit a profile page
    Extension->>SocialMedia: Inject "Add to Bondery" button
    User->>Extension: Click the button
    Extension->>Extension: Extract profile data from DOM
    Extension->>API: GET /api/redirect?linkedin=username&firstName=...
    API->>API: Check auth cookies
    alt Authenticated
        API->>API: Create or find contact
        API-->>Webapp: Redirect to /app/person/:id
    else Not authenticated
        API-->>Webapp: Redirect to /login?returnUrl=...
    end
```

## Reminder dispatch flow

```mermaid
sequenceDiagram
    participant Cron as Supabase Cron
    participant DB as PostgreSQL
    participant API as Fastify API
    participant SMTP

    Note over Cron: Runs every hour at :05
    Cron->>DB: Call send_hourly_reminder_digests()
    DB->>DB: Find users where next_reminder_at_utc <= now()
    DB->>DB: Find upcoming important events for each user
    DB->>DB: Check dispatch log (avoid duplicates)
    DB->>API: POST /api/reminders/daily-digest (with users + events)
    API->>API: Verify x-reminder-job-secret header
    loop For each user
        API->>API: Render ReminderDigestEmail template
        API->>SMTP: Send email
    end
    API-->>DB: Response with sent/failed counts
    DB->>DB: Log dispatched reminders
    DB->>DB: Advance next_reminder_at_utc by 24 hours
```

## Data import flow (LinkedIn/Instagram)

```mermaid
sequenceDiagram
    participant User
    participant Webapp
    participant API as Fastify API
    participant DB as PostgreSQL

    User->>Webapp: Upload LinkedIn ZIP / Instagram export
    Webapp->>API: POST /api/contacts/import/{platform}/parse (multipart)
    API->>API: Extract and parse CSV/JSON from archive
    API-->>Webapp: Parsed contacts (preview)
    User->>Webapp: Select contacts to import
    Webapp->>API: POST /api/contacts/import/{platform}/commit
    API->>DB: Insert/update contacts
    API->>DB: Attach social media handles
    API-->>Webapp: Import summary (imported, updated, skipped)
```
