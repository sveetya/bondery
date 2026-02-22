# Functions & Triggers

## Trigger functions

### handle_updated_at()

Automatically sets `updated_at = now()` on row updates.

**Used by:**
- `people_updated_at` trigger on `people`
- `user_settings_updated_at` trigger on `user_settings`

### handle_new_user()

Creates a `user_settings` row when a new user signs up via Supabase Auth. Hydrates `name`, `middlename`, `surname`, and `avatar_url` from the auth user metadata.

**Security:** `SECURITY DEFINER` (runs with elevated privileges to insert into `user_settings`).

**Trigger:** `on_auth_user_created` on `auth.users` (AFTER INSERT).

### compute_people_important_event_notify_on()

Computes the `notify_on` date for important events:

```
notify_on = event_date - notify_days_before
```

If `notify_days_before` is null, sets `notify_on` to null.

**Trigger:** `people_important_events_compute_notify_on` on `people_important_events` (BEFORE INSERT OR UPDATE).

### set_user_settings_next_reminder_at_utc()

Computes `next_reminder_at_utc` whenever `timezone` or `reminder_send_hour` changes. Calls `compute_next_reminder_at_utc()`.

**Trigger:** `user_settings_set_next_reminder_at_utc` on `user_settings` (BEFORE INSERT OR UPDATE OF timezone, reminder_send_hour).

## Utility functions

### compute_next_reminder_at_utc(timezone, send_hour, base_ts)

Calculates the next UTC timestamp when a reminder should be sent, given the user's timezone and preferred send hour.

**Logic:**
1. Validates the timezone against `pg_timezone_names` (falls back to UTC)
2. Converts `now()` to the user's local time
3. Constructs today's candidate: `date_trunc('day', local_now) + send_hour`
4. Converts back to UTC
5. If the candidate is in the past, adds 1 day

**Returns:** `timestamptz`

## Cron jobs

### dispatch-hourly-reminder-digests

**Schedule:** `5 * * * *` (every hour at :05)

**Function:** `send_hourly_reminder_digests()`

**What it does:**

1. Finds users where `next_reminder_at_utc <= now()`
2. For each user, collects upcoming important events where `notify_on` falls within the reminder window
3. Checks `reminder_dispatch_log` to avoid duplicate sends
4. Sends an HTTP POST to the API endpoint (`POST /api/reminders/daily-digest`) with:
   - Target date
   - Array of users with their reminders
   - `x-reminder-job-secret` header for authentication
5. Logs the dispatch in `reminder_dispatch_log`
6. Advances `next_reminder_at_utc` by 24 hours for processed users

**Security:** `SECURITY DEFINER` with `search_path = public, extensions, net, pg_net`.

**Dependencies:** Uses `pg_net` extension for HTTP requests from PostgreSQL.

## Trigger summary

| Trigger | Table | Event | Function |
|---|---|---|---|
| `people_updated_at` | `people` | BEFORE UPDATE | `handle_updated_at()` |
| `user_settings_updated_at` | `user_settings` | BEFORE UPDATE | `handle_updated_at()` |
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |
| `people_important_events_compute_notify_on` | `people_important_events` | BEFORE INSERT/UPDATE | `compute_people_important_event_notify_on()` |
| `user_settings_set_next_reminder_at_utc` | `user_settings` | BEFORE INSERT/UPDATE OF timezone, reminder_send_hour | `set_user_settings_next_reminder_at_utc()` |
