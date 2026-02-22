# Database Schema

All tables are in the `public` schema with RLS enabled. Every row is scoped to a user via `user_id`.

## people

Contacts/persons in the user's network.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `first_name` | text | No | | Required |
| `middle_name` | text | Yes | | |
| `last_name` | text | Yes | | |
| `title` | text | Yes | | Job title |
| `place` | text | Yes | | Location or workplace |
| `description` | text | Yes | | Brief description |
| `notes` | text | Yes | | Personal notes |
| `avatar` | text | Yes | | URL to profile photo |
| `avatar_color` | text | Yes | `'blue'` | Avatar background color |
| `last_interaction` | timestamptz | Yes | `now()` | Last interaction timestamp |
| `connections` | text[] | Yes | | Connection IDs |
| `myself` | boolean | Yes | `false` | Whether this is the user's own profile |
| `position` | jsonb | Yes | | Company/role data |
| `gender` | text | Yes | | |
| `language` | text | Yes | | |
| `timezone` | text | Yes | | |
| `nickname` | text | Yes | | |
| `pgp_public_key` | text | Yes | | PGP public key |
| `location` | geography | Yes | | PostGIS geography point |
| `latitude` | numeric | Yes | | |
| `longitude` | numeric | Yes | | |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | Auto-updated by trigger |

## people_phones

Normalized phone numbers for contacts.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `person_id` | uuid | No | | FK to `people` |
| `prefix` | text | No | `'+1'` | Country code |
| `value` | text | No | | Phone number |
| `type` | text | Yes | | `'home'` or `'work'` |
| `preferred` | boolean | Yes | `false` | Primary phone |
| `sort_order` | integer | Yes | | Display order (>= 0) |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

## people_emails

Normalized email addresses for contacts.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `person_id` | uuid | No | | FK to `people` |
| `value` | text | No | | Email address |
| `type` | text | Yes | | `'home'` or `'work'` |
| `preferred` | boolean | Yes | `false` | Primary email |
| `sort_order` | integer | Yes | | Display order (>= 0) |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

## people_social_media

Social media handles for contacts.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `person_id` | uuid | No | | FK to `people` |
| `platform` | text | No | | `linkedin`, `instagram`, `whatsapp`, `facebook`, `website`, `signal` |
| `handle` | text | No | | Username or URL |
| `connected_at` | timestamptz | Yes | | When the connection was made on the platform |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

**Unique constraint:** `(user_id, person_id, platform)` -- one handle per platform per contact.

## people_important_events

Recurring dates (birthdays, anniversaries) with optional reminders.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `person_id` | uuid | No | | FK to `people` |
| `event_type` | text | No | | `birthday`, `anniversary`, `nameday`, `graduation`, `other` |
| `event_date` | date | No | | The recurring date |
| `note` | text | Yes | | |
| `notify_days_before` | smallint | Yes | | `1`, `3`, or `7` (days before to notify) |
| `notify_on` | date | Yes | | Computed: `event_date - notify_days_before` |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

**Constraints:**
- Only one `birthday` per contact (unique on `user_id, person_id` where `event_type = 'birthday'`)
- Unique on `(user_id, person_id, event_type, event_date, note)`

## people_relationships

Relationships between two contacts.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `source_person_id` | uuid | No | | FK to `people` |
| `target_person_id` | uuid | No | | FK to `people` |
| `relationship_type` | text | No | | See types below |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

**Relationship types:** `parent`, `child`, `spouse`, `partner`, `sibling`, `friend`, `colleague`, `neighbor`, `guardian`, `dependent`, `other`

**Constraints:**
- `source_person_id <> target_person_id` (no self-relationships)
- Unique on `(user_id, source_person_id, target_person_id, relationship_type)`
- Unique pair constraint preventing reverse duplicates

## groups

Contact groups/categories.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `label` | text | No | | Group name |
| `emoji` | text | Yes | | Emoji icon |
| `color` | text | Yes | | Display color |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

## people_groups

Join table for contact-group membership.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `person_id` | uuid | No | | FK to `people` |
| `group_id` | uuid | No | | FK to `groups` (cascade delete) |
| `user_id` | uuid | No | | FK to `auth.users` |
| `created_at` | timestamptz | Yes | `now()` | |

**Unique constraint:** `(person_id, group_id)`

## events

Timeline events (meetings, calls, notes).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `type` | text | No | | Event type (see EventType) |
| `title` | text | Yes | | Event title |
| `description` | text | Yes | | Event description |
| `date` | timestamptz | No | `now()` | When the event occurred |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

## event_participants

Join table linking events to contacts.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `event_id` | uuid | No | | FK to `events` (cascade delete), part of PK |
| `person_id` | uuid | No | | FK to `people` (cascade delete), part of PK |
| `created_at` | timestamptz | Yes | `now()` | |

**Primary key:** `(event_id, person_id)`

## user_settings

User preferences and profile data.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` (unique) |
| `name` | varchar | Yes | | First name |
| `middlename` | varchar | Yes | | Middle name |
| `surname` | varchar | Yes | | Last name |
| `timezone` | varchar | Yes | `'UTC'` | IANA timezone |
| `reminder_send_hour` | time | No | `'08:00:00'` | When to send daily reminder |
| `next_reminder_at_utc` | timestamptz | No | | Precomputed next reminder time |
| `language` | text | Yes | `'en'` | Preferred language |
| `color_scheme` | color_scheme | No | `'auto'` | `light`, `dark`, or `auto` |
| `avatar_url` | text | Yes | | Profile photo URL |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

**Custom type:** `color_scheme` is a PostgreSQL enum with values `light`, `dark`, `auto`.

## reminder_dispatch_log

Tracks sent reminder digests to avoid duplicates.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | | FK to `auth.users` |
| `reminder_date` | date | No | | The target date of the reminder |
| `timezone` | text | No | | User's timezone at send time |
| `created_at` | timestamptz | Yes | `now()` | |

**Unique constraint:** `(user_id, reminder_date)` -- one digest per user per day.

## Storage buckets

### avatars

Public bucket for profile photos (contacts and users).

- **File size limit:** 50 MB (Supabase default)
- **Public access:** Yes (all avatars are publicly readable)
- **Path convention:** `{user_id}/{contact_id_or_user_id}.{ext}`
- **RLS:** Users can only upload/modify files in their own `{user_id}/` folder
