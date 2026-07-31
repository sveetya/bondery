# supabase-db

Supabase project for Bondery: migrations, local CLI config, setup scripts, and SQL snippets.

## Common commands

Run from this directory (`apps/supabase-db`):

| Command | Description |
|---------|-------------|
| `pnpm run start` | `supabase start` |
| `pnpm run stop` | `supabase stop` |
| `pnpm run reset` | `supabase db reset` |
| `pnpm run setup:local` | Validate `.env.local` and seed vault secrets |
| `pnpm run gen-types` | Regenerate TypeScript types in `packages/schemas` |

## Local development

1. Copy and fill env: `.env.local.example` → `.env.local`
2. `pnpm run setup:local`
3. `pnpm run start`

API URL: `http://127.0.0.1:54321`  
DB port: `54322` (see `supabase/config.toml`)

Mobile sync uses the API pull/bootstrap endpoints backed by `sync_change_log` — see [docs/contributing/local-setup.md](../../docs/contributing/local-setup.md).

## SQL snippets

Ad-hoc and environment-specific SQL lives in `supabase/snippets/`:

- `Setup/` — one-time environment configuration (vault URLs, etc.)
- `Testing/` — sample data and test helpers

Snippets are not applied automatically; run them manually in the SQL editor or via `psql`.

## Migrations

New migration:

```bash
pnpm run migration:new -- my_change_name
```

Apply locally:

```bash
pnpm run reset    # replay all migrations
```

Push to remote:

```bash
pnpm run push
```
