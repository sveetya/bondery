# Development Workflow

## Running apps

### All apps at once

```bash
npm run dev
```

### Core apps only (webapp + API + emails)

```bash
npm run dev:core
```

### Specific app or package

Use the `--filter` flag with Turborepo:

```bash
# Only the webapp
npx turbo dev --filter=webapp

# Only the API
npx turbo dev --filter=api

# Only the chrome extension
npx turbo dev --filter=chrome-extension
```

## Development ports

| Service | Port | URL |
|---|---|---|
| Website | 3000 | http://localhost:3000 |
| API (Fastify) | 3001 | http://localhost:3001 |
| Webapp (Next.js) | 3002 | http://localhost:3002 |
| Email preview | 3004 | http://localhost:3004 |
| Supabase API | 54321 | http://127.0.0.1:54321 |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Supabase Studio | 54323 | http://localhost:54323 |
| Inbucket (email) | 54324 | http://localhost:54324 |

## Building

```bash
# Build everything
npm run build

# Build specific package
npx turbo build --filter=@bondery/types
```

Build outputs are cached by Turborepo. Subsequent builds skip unchanged packages.

## Linting and type checking

```bash
# Lint all packages
npm run lint

# Type-check all packages
npm run check-types
```

## Database operations

```bash
cd apps/supabase-db

# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database (applies all migrations + seed)
npx supabase db reset

# Create a new migration
npx supabase migration new <migration_name>

# Generate TypeScript types from schema
npm run gen-types

# Push migrations to production
npx supabase db push
```

## Cleaning

Remove all build artifacts and `node_modules`:

```bash
npm run clean
```

Then re-install with `npm install`.

## Useful Turborepo commands

```bash
# View the dependency graph
npx turbo run build --graph

# Run with verbose output
npx turbo run dev --verbosity=2

# Force rebuild (ignore cache)
npx turbo run build --force
```
