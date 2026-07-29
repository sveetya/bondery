---
name: Chrome Extension OAuth Setup
description: Resolve OAuth redirect URI mismatches when running the extension locally. Covers Better Auth client provisioning via provision-oauth-clients.ts.
triggers:
  - "Authorization page could not be loaded … redirect URI exact match"
  - New developer machine gets a different extension ID
related: []
---

# Chrome Extension OAuth Setup (Better Auth)

The extension authenticates against the **API** Better Auth OAuth provider (`/auth/oauth2/*`), not Supabase GoTrue.

## When does this happen?

- A new developer (or new machine) gets a different Chrome extension ID, so the redirect URI no longer matches the provisioned OAuth client.
- `BONDERY_INFRA_CHROME_EXTENSION_ID` in root `.env.local` does not match the unpacked extension ID.

The error looks like:

```
Authorization page could not be loaded. Verify OAuth client settings:
client_id, redirect URI exact match (https://<extension-id>.chromiumapp.org/), and API reachability.
```

## Step 1 — Find your extension ID

In `chrome://extensions`, copy the ID shown under the Bondery extension.

Your redirect URI will be:

```
https://<your-extension-id>.chromiumapp.org/
```

## Step 2 — Set env vars

In root `.env.local`:

```env
BONDERY_PUBLIC_OAUTH_CLIENT_ID="<from provision script or team vault>"
BONDERY_INFRA_CHROME_EXTENSION_ID="<your-extension-id>"
```

Run `npm run env` to sync into `apps/chrome-extension/.env.development.local`.

## Step 3 — Provision OAuth client

With API env + migrated Postgres:

```bash
cd apps/api
npx tsx --env-file=.env.development.local scripts/provision-oauth-clients.ts
```

This upserts the public PKCE client with redirect `https://<BONDERY_INFRA_CHROME_EXTENSION_ID>.chromiumapp.org/`.

## Step 4 — Reload extension and sign in

1. Reload the extension in `chrome://extensions`.
2. Open the popup and sign in — browser opens API OAuth authorize URL.
3. Complete login/consent on the API/webapp if prompted.

## Required extension env

```env
BONDERY_PUBLIC_API_URL=http://localhost:26631
BONDERY_PUBLIC_WEBAPP_URL=http://localhost:26632
BONDERY_PUBLIC_OAUTH_CLIENT_ID=...
```

OAuth scopes: `openid profile email offline_access api:access` with `resource` = `BONDERY_PUBLIC_API_URL`.
