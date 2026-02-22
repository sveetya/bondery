# Row Level Security (RLS)

Every table in the `public` schema has RLS enabled. All policies are restricted to the `authenticated` role (anonymous users cannot access any data).

## Policy pattern

All tables follow the same ownership-based pattern:

```sql
-- SELECT: users see only their own rows
CREATE POLICY "select_own" ON public.<table>
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: users can only insert rows with their own user_id
CREATE POLICY "insert_own" ON public.<table>
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own rows
CREATE POLICY "update_own" ON public.<table>
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- DELETE: users can only delete their own rows
CREATE POLICY "delete_own" ON public.<table>
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

## Tables with RLS

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `people` | own | own | own | own |
| `people_phones` | own | own | own | own |
| `people_emails` | own | own | own | own |
| `people_social_media` | own | own | own | own |
| `people_important_events` | own | own | own | own |
| `people_relationships` | own | own | own | own |
| `people_groups` | own | own | own | own |
| `groups` | own | own | own | own |
| `events` | own | own | own | own |
| `event_participants` | via join | via join | -- | via join |
| `user_settings` | own | own | own | own |
| `reminder_dispatch_log` | own | own | -- | -- |

## Join tables

For `event_participants`, the RLS policy verifies ownership through the parent `events` table:

```sql
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_participants.event_id
    AND events.user_id = auth.uid()
  )
)
```

Similarly, `people_groups` verifies both the `people` and `groups` ownership.

## Storage policies (avatars bucket)

The `avatars` bucket is public for reads but restricted for writes:

| Operation | Policy |
|---|---|
| SELECT | Public (all users can view avatars) |
| INSERT | Owner only (`auth.uid()::text = (storage.foldername(name))[1]`) |
| UPDATE | Owner only |
| DELETE | Owner only |

The folder structure `{user_id}/...` ensures each user can only modify files in their own folder.

## Performance optimizations

Several migrations optimize RLS performance:

- **Optimized `auth.uid()` calls** -- reduces repeated function invocations per row
- **Wrapped SELECT policies** -- avoids redundant security checks on indexed lookups
- **Restricted to `authenticated` role** -- short-circuits policy evaluation for anonymous requests
