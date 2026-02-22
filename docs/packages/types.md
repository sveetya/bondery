# @bondery/types

Shared TypeScript type definitions used across all applications.

**Version:** 0.0.1
**Build:** `tsc`

## Exports

| Export path | Description |
|---|---|
| `@bondery/types` | All types (re-exported from index) |
| `@bondery/types/database` | Supabase-generated database types |
| `@bondery/types/supabase.types` | Same as `database` |

## Type modules

### Contact types (`contact.ts`)

- `ContactType` -- `"home"` or `"work"` (for phone/email entries)
- `PhoneEntry` -- `{ prefix, value, type, preferred }`
- `EmailEntry` -- `{ value, type, preferred }`
- `Contact` -- full contact entity with all fields
- `ContactPreview` -- lightweight preview (`id`, `firstName`, `lastName`, `avatar`, `avatarColor`)
- `CreateContactInput` -- `{ firstName, lastName, linkedin? }`
- `UpdateContactInput` -- all Contact fields optional
- `ImportantEventType` -- `"birthday"` | `"anniversary"` | `"nameday"` | `"graduation"` | `"other"`
- `ImportantEvent` -- full event with `notifyDaysBefore` and `notifyOn`
- `UpcomingReminder` -- `{ event, person }`
- `RelationshipType` -- `"parent"` | `"child"` | `"spouse"` | `"partner"` | `"sibling"` | `"friend"` | `"colleague"` | `"neighbor"` | `"guardian"` | `"dependent"` | `"other"`
- `ContactRelationship` -- relationship record
- `ContactRelationshipWithPeople` -- relationship with source/target previews
- `Position` -- `{ lat, lng }`

### Event types (`activity.ts`)

- `EventType` -- `"Call"` | `"Coffee"` | `"Email"` | `"Meal"` | `"Meeting"` | `"Networking event"` | `"Note"` | `"Other"` | `"Party/Social"` | `"Text/Messaging"` | `"Competition/Hackathon"` | `"Custom"`
- `Event` -- full event entity
- `CreateEventInput` -- `{ type, date, title?, description?, participantIds }`
- `UpdateEventInput` -- all fields optional

### Group types (`group.ts`)

- `Group` -- `{ id, userId, label, emoji, color, createdAt, updatedAt }`
- `GroupWithCount` -- Group + `contactCount` and `previewContacts`
- `CreateGroupInput` -- `{ label, emoji?, color? }`
- `UpdateGroupInput` -- all fields optional
- `GroupMembershipRequest` -- `{ personIds }`

### User types (`user.ts`)

- `ColorSchemePreference` -- `"light"` | `"dark"` | `"auto"`
- `UserSettings` -- full settings entity
- `UpdateUserSettingsInput` -- partial settings update
- `AuthUser` -- authenticated user info

### API types (`api.ts`)

- `ApiErrorResponse` -- `{ error, description? }`
- `ApiSuccessResponse` -- `{ success: true, message? }`
- `PhotoUploadResponse` -- `{ success, avatarUrl? }`
- `RedirectRequest` / `RedirectResponse` -- chrome extension integration
- `LinkedInPreparedContact` / `LinkedInParseResponse` / `LinkedInImportCommitRequest` -- LinkedIn import
- `InstagramPreparedContact` / `InstagramParseResponse` / `InstagramImportCommitRequest` -- Instagram import
- `InstagramImportStrategy` -- `"close_friends"` | `"following"` | `"followers"` | `"following_and_followers"` | `"mutual_following"`

### Database types (`supabase.types.ts`)

Auto-generated from the Supabase schema. Provides `Row`, `Insert`, and `Update` types for every database table.

**Regenerate after schema changes:**

```bash
cd apps/supabase-db
npm run gen-types
```
