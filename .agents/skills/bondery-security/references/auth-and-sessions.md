# Auth and sessions

Authentication and session patterns across API and clients.

## Better Auth (identity issuer)

Config: `apps/api/src/lib/auth/index.ts`

- Social providers: GitHub, LinkedIn OIDC
- Session: 30-day expiry, daily refresh
- `account.encryptOAuthTokens: true` — IdP tokens in `Account` encrypted at rest (AES-256-GCM via Better Auth secret). Do not read those columns via Prisma; use `auth.api.getAccessToken` when a plaintext provider token is required.
- OAuth 2.1 / OIDC provider with PKCE required
- Canonical resource: `BONDERY_PUBLIC_API_URL` with scope `api:access`
- Issuer is always `BONDERY_PUBLIC_API_URL` — not `Host` / `X-Forwarded-*` (`auth/routes.ts`)

OAuth client secrets provisioned at deploy only: `apps/api/scripts/provision-oauth-clients.ts` (not runtime admin API).

## Fastify auth strategies

Registered in `apps/api/src/lib/platform/auth/strategies.ts`:

| Strategy | Use |
|----------|-----|
| `verifySession` | Session or OAuth resource JWT |
| `verifyAuth` | Session, OAuth JWT, or API key |
| `verifyAdmin` | Session + `user_settings.is_admin` |
| `verifyServiceSecret` | `BONDERY_PRIVATE_SERVICE_SECRET` bearer |

### JWT vs opaque bearer (no fallback)

```
Bearer token shape?
├── JWT (3 dot-separated segments) → resolveOAuthBearerUser only
│   └── failure → unauthorized (never calls getSession)
└── Opaque → auth.api.getSession (Better Auth native / mobile bearer)
```

OAuth JWT verification checks:
- JWKS signature (`jose`)
- `iss` = `BONDERY_PUBLIC_API_URL`
- `aud` = API resource identifier
- `api:access` scope present
- `client_id` in trusted set (`BONDERY_PUBLIC_OAUTH_CLIENT_ID`, `BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID`)

Integration tests: `apps/api/src/test/auth-integration.test.ts`.

## API keys

`apps/api/src/lib/platform/auth/api-keys.ts`:
- Format: `bondery_key_{keyId}_{secret}`
- Hash: SHA3-256(`pepper + fullKey`) with `timingSafeEqual`
- Pepper: `BONDERY_PRIVATE_API_KEY_PEPPER`
- Route allowlist: `api-key-access.ts` — integration area only

API keys shown once at creation in UI — never stored in client localStorage.

## Webapp dual-session model

| Cookie | Domain | Purpose |
|--------|--------|---------|
| Better Auth session | API (`BONDERY_PUBLIC_API_URL`) | Social sign-in, OAuth AS native session |
| `bondery_webapp_session` | Webapp | Encrypted BFF credential for RSC/BFF |
| `bondery_oauth_flow` | Webapp | PKCE verifier + state (10 min TTL) |

**BFF session** (`apps/webapp/src/lib/auth/oauthClient.server.ts`):
- JWE (`dir` + `A256GCM`), key = SHA-256(`BONDERY_PRIVATE_WEBAPP_SESSION_SECRET`)
- `httpOnly`, `sameSite: lax`, `secure` when HTTPS
- OAuth code+PKCE against API AS; includes `resource` on authorize, exchange, refresh

**BFF proxy** (`apps/webapp/src/app/api/[[...path]]/route.ts`):
- Requires decrypted webapp session
- Forwards Bearer OAuth JWT to API — browser never holds API access token in JS for REST

**Token refresh:** `apps/webapp/src/proxy.ts` — refreshes 5 min before expiry.

**CSRF:** No explicit CSRF tokens. Mitigations: `sameSite: lax`, OAuth `state` validation, server-side Bearer injection. Document reliance — do not add cookie-authenticated API endpoints without CSRF analysis.

## Mobile

`apps/mobile/src/lib/auth/client.ts`:
- `@better-auth/expo` — opaque bearer session token
- Native: `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`)
- Web (Expo): falls back to `localStorage` for PKCE verifier survival — flag when reviewing mobile-web flows

Deep link scheme: `bondery://` (trusted origin on API).

## Chrome extension

`apps/chrome-extension/src/lib/auth/index.ts`:
- OAuth tokens in `browser.storage.local` (persists across restarts)
- PKCE + **state CSRF check** on callback (`features/background/oauth.ts`)
- API calls: Bearer + `X-Bondery-Extension-Version` (`lib/api/transport.ts`)
- API calls only from background — enforced by `check-extension-patterns.ts`

**Review trigger:** `storage.local` vs `storage.session` tradeoff for token persistence.

## Extension version gate

`apps/api/src/lib/extension/version-check.ts`:
- Unauthenticated requests without Cookie, Bearer, or extension version → 401
- Extension below `MIN_EXTENSION_VERSION` → 426 `extension_outdated`
- Skips `/auth/*`, `/webhooks/*`, `/status`, `/health`

## Service secret (internal)

`verifyServiceSecret` compares `BONDERY_PRIVATE_SERVICE_SECRET` with plain `===` (not timing-safe).

**Review trigger:** consider `timingSafeEqual` for defense-in-depth.

## Auth checklist

- [ ] Route uses correct shell strategy (not custom auth in handler)
- [ ] JWT bearer never falls back to session lookup
- [ ] OAuth JWT checks `iss`, `aud`, `api:access` scope, trusted `client_id`
- [ ] Webapp secrets stay server-only; mobile/extension use PKCE
- [ ] API key hashed with pepper; route allowlist respected
- [ ] Session cookies: `httpOnly`, appropriate `sameSite`, `secure` in prod
- [ ] OAuth `state` validated on callback flows
