# Authentication

All API endpoints (except `GET /status` and `GET /api/redirect`) require authentication.

## How it works

Bondery uses **cookie-based authentication** powered by Supabase Auth. There is no separate API key or token management -- the session is established through the webapp's OAuth flow and shared via cookies.

### Authentication flow

1. User signs in via the webapp using GitHub or LinkedIn OAuth
2. Supabase Auth issues an access token and refresh token
3. Tokens are stored in HTTP-only cookies by the Supabase SSR client
4. When the webapp calls the API, it forwards all cookies
5. The API extracts the tokens from cookies and creates an authenticated Supabase client

### Cookie format

Supabase stores tokens in cookies named with the pattern:

```
sb-{project-ref}-auth-token
```

For large tokens, Supabase splits cookies into chunks:

```
sb-{project-ref}-auth-token.0
sb-{project-ref}-auth-token.1
```

The API automatically reassembles chunked cookies and parses the base64-encoded JSON payload containing `access_token` and `refresh_token`.

### Alternative: Bearer token

The API also accepts authentication via the `Authorization` header:

```
Authorization: Bearer <supabase-access-token>
```

This is used by the webapp's server-side fetches, which pass both cookies and the Bearer token for reliability.

## Auth middleware

Every protected route calls `requireAuth(request, reply)` as its first step. This function:

1. Extracts tokens from the request (cookies or Authorization header)
2. Calls `supabase.auth.setSession()` to validate the token
3. Returns `{ client, user }` on success, or sends a `401` response on failure

The returned `client` is a Supabase client scoped to the authenticated user. All subsequent database queries use this client, ensuring Row Level Security (RLS) is enforced.

## Internal endpoints

The reminder dispatch endpoint (`POST /api/reminders/daily-digest`) uses a different authentication mechanism:

```
x-reminder-job-secret: <PRIVATE_BONDERY_SUPABASE_HTTP_KEY>
```

This shared secret is verified by the API and is used exclusively by the Supabase cron job.

## Error response

When authentication fails, the API returns:

```json
HTTP/1.1 401 Unauthorized

{
  "error": "Unauthorized"
}
```
