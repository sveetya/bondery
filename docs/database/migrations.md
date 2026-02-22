# Migrations

Migrations are located in `apps/supabase-db/supabase/migrations/`. Each file is a timestamped SQL file applied in order.

## Commands

```bash
cd apps/supabase-db

# Apply all pending migrations locally
npx supabase db reset

# Create a new migration
npx supabase migration new <name>

# Push migrations to production
npx supabase db push

# Generate TypeScript types after schema changes
npm run gen-types
```

## Migration history

| Timestamp | Name | Description |
|---|---|---|
| `20260115000001` | `initial_schema` | Initial schema with contacts table and user_settings |
| `20260122124941` | `rename_contacts_to_people` | Rename `contacts` table to `people` |
| `20260122130000` | `add_gender_language_to_people` | Add `gender` and `language` columns |
| `20260122140000` | `add_timezone_nickname_to_people` | Add `timezone` and `nickname` columns |
| `20260122150000` | `add_pgp_public_key_to_people` | Add `pgp_public_key` column |
| `20260122160000` | `enable_postgis` | Enable PostGIS extension |
| `20260122160001` | `add_location_column` | Add `location` geography column |
| `20260122170000` | `add_lat_lon_columns` | Add `latitude` and `longitude` columns |
| `20260122180000` | `add_groups` | Create `groups` and `people_groups` tables |
| `20260123000000` | `create_avatars_bucket` | Create public `avatars` storage bucket |
| `20260124000000` | `add_phones_emails_arrays` | Add JSON phone/email arrays to people |
| `20260124000001` | `remove_legacy_phone_email_columns` | Remove old single phone/email columns |
| `20260128105135` | `add_activities_table` | Create activities table (later renamed to events) |
| `20260212153000` | `update_activity_type_labels` | Normalize activity type labels |
| `20260212174500` | `add_title_to_activities` | Add `title` column to activities |
| `20260213090000` | `add_color_scheme_to_user_settings` | Add `color_scheme` enum to user_settings |
| `20260214120000` | `add_people_relationships` | Create `people_relationships` table |
| `20260214150000` | `enforce_people_relationship_constraints` | Add uniqueness and reverse-duplicate constraints |
| `20260215100000` | `add_people_important_events` | Create `people_important_events` table |
| `20260215113000` | `drop_legacy_people_date_columns` | Drop old birthdate/date columns from people |
| `20260215120000` | `normalize_people_phones_emails` | Create `people_phones` and `people_emails` tables |
| `20260215123000` | `fix_people_phone_prefix_split` | Fix phone prefix/value splitting logic |
| `20260215130000` | `normalize_people_social_media` | Create `people_social_media` table |
| `20260215170000` | `add_connected_at_to_people_social_media` | Add `connected_at` timestamp |
| `20260217130000` | `migrate_profile_photos_to_avatars` | Migrate profile photos to avatars bucket |
| `20260217143000` | `hydrate_new_user_settings_from_auth_metadata` | Auto-populate settings from auth metadata on signup |
| `20260217144000` | `backfill_user_settings_from_auth_metadata` | Backfill existing users' settings |
| `20260217180000` | `add_notify_on_and_reminder_cron` | Add `notify_on` computed column and daily cron |
| `20260218123000` | `hourly_reminders_with_user_send_hour` | Switch from daily to hourly reminder dispatch |
| `20260218144500` | `convert_reminder_send_hour_to_time` | Convert `reminder_send_hour` from text to `time` |
| `20260218170000` | `secure_reminder_dispatch_log_rls` | Add RLS to `reminder_dispatch_log` |
| `20260218183000` | `precompute_next_reminder_at_utc` | Add precomputed `next_reminder_at_utc` column |
| `20260218193000` | `drop_activity_location_and_attachment` | Remove unused location/attachment from events |
| `20260218224500` | `use_shared_env_names_for_reminder_http_settings` | Align env var names for HTTP settings |
| `20260219090000` | `restrict_public_rls_policies_to_authenticated` | Restrict all RLS policies to `authenticated` role |
| `20260219093000` | `optimize_public_rls_auth_uid_select` | Optimize RLS `auth.uid()` performance |
| `20260219100000` | `harden_security_definer_search_path` | Set explicit `search_path` on SECURITY DEFINER functions |
| `20260219103000` | `optimize_rls_runtime_function_calls` | Further RLS runtime optimization |
| `20260219104500` | `fix_rls_auth_uid_select_wrapping` | Fix RLS policy wrapping issue |
| `20260219110000` | `drop_duplicate_user_settings_user_id_index` | Remove redundant index |
| `20260220110000` | `rename_activities_to_events` | Rename `activities` to `events`, `activity_participants` to `event_participants` |

## Schema evolution themes

1. **Initial setup** (Jan 15) -- basic contacts + settings
2. **Contact enrichment** (Jan 22) -- gender, language, timezone, nickname, PGP, PostGIS
3. **Groups and storage** (Jan 22-23) -- groups, avatars bucket
4. **Normalization** (Jan 24, Feb 15) -- phones, emails, social media as separate tables
5. **Timeline** (Jan 28, Feb 12-20) -- activities/events with participants
6. **Relationships** (Feb 14) -- person-to-person relationships
7. **Important events** (Feb 15) -- birthdays, anniversaries with reminders
8. **Reminder system** (Feb 17-18) -- cron jobs, hourly dispatch, precomputed timestamps
9. **Security hardening** (Feb 19) -- RLS optimization, authenticated-only policies
10. **Naming cleanup** (Feb 20) -- activities renamed to events
