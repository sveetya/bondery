# Webapp

**Package:** `apps/webapp`
**Framework:** Next.js 16 (App Router)
**Port:** 3002
**Production URL:** `https://app.usebondery.com`

The webapp is the main authenticated application where users manage their contacts, groups, events, and settings.

## Routes

### Public routes

| Route | Description |
|---|---|
| `/` | Redirects to `/app/home` |
| `/login` | Login page (GitHub and LinkedIn OAuth) |
| `/auth/callback` | OAuth callback handler |

### Protected routes (require authentication)

| Route | Description |
|---|---|
| `/app/home` | Dashboard with stats, upcoming reminders, timeline preview |
| `/app/people` | Contacts list with search, sorting, and bulk actions |
| `/app/person/[person_id]` | Individual contact detail (info, relationships, events, notes) |
| `/app/groups` | Groups management |
| `/app/group/[groupId]` | Group detail with member list |
| `/app/timeline` | Timeline view of all events |
| `/app/settings` | User settings (profile, language, timezone, data management, import) |
| `/app/feedback` | Feedback form |

## Middleware

The `proxy.ts` file acts as Next.js middleware and handles:

1. **Content Security Policy (CSP)** -- nonce-based script/style execution in production
2. **Session management** -- calls `updateSession()` on every request to refresh Supabase tokens
3. **Auth redirects:**
   - Unauthenticated users on `/app/*` are redirected to `/login`
   - Authenticated users on `/login` are redirected to `/app/home`
   - `/app` redirects to `/app/home`

## Authentication flow

1. User clicks "Sign in with GitHub" or "Sign in with LinkedIn" on `/login`
2. Supabase Auth redirects to the OAuth provider
3. Provider redirects back to `/auth/callback` with an authorization code
4. The callback route exchanges the code for a session via `supabase.auth.exchangeCodeForSession()`
5. Session tokens are stored in HTTP-only cookies
6. Protected layouts check authentication and redirect if needed

## API communication

The webapp communicates with the Fastify API via server-side fetches:

- **Next.js rewrites** proxy `/api/*` to `${NEXT_PUBLIC_API_URL}/api/*`
- **Auth headers** are forwarded via `getAuthHeaders()`:
  - All cookies from the request
  - `Authorization: Bearer <access_token>` from the Supabase session
- All API calls use `cache: "no-store"` (no caching)

## Internationalization (i18n)

- **Library:** next-intl v4
- **Languages:** English (`en`), Czech (`cs`)
- **Messages:** Loaded from `@bondery/translations`
- **Locale detection:**
  - Authenticated users: from `user_settings.language` preference
  - Unauthenticated users: from `locale` cookie, falling back to `Accept-Language` header, falling back to `en`

## Key features

- **Contact management** -- CRUD with rich fields (phones, emails, social media, location, notes)
- **Groups** -- organize contacts into labeled groups with emoji and color
- **Timeline** -- chronological view of meetings, calls, and other events
- **Relationships** -- connect contacts (e.g. "Alice is Bob's colleague")
- **Important events** -- birthdays and anniversaries with email reminders
- **Data import** -- import contacts from LinkedIn (CSV) and Instagram (JSON) exports
- **Maps** -- plot contacts on interactive maps (Leaflet + MapLibre GL)
- **Rich text notes** -- Tiptap editor for contact notes
- **vCard export** -- download contacts as `.vcf` files
- **Color scheme** -- light, dark, and auto modes synced to user settings

## Tech stack

- Next.js 16.1 with App Router and React Server Components
- React 19
- Mantine 8 component library
- Tailwind CSS 4
- Supabase SSR for auth
- D3.js for data visualizations
- Leaflet + MapLibre GL for maps
- Tiptap for rich text editing
- PostHog for product analytics
