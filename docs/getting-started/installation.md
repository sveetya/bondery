# Installation

## 1. Clone the repository

```bash
git clone https://github.com/usebondery/bondery.git
cd bondery
```

## 2. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces (`apps/*` and `packages/*`) in a single command.

## 3. Build shared packages

Before running any app you must build the shared packages they depend on:

```bash
npx turbo build --filter=@bondery/types --filter=@bondery/branding
```

This generates TypeScript types from the Supabase schema and compiles branding assets.

## 4. Start the local Supabase instance

```bash
cd apps/supabase-db
npx supabase start
```

This starts PostgreSQL, Auth, Storage, and other Supabase services in Docker. On first run it pulls the required images. Once running, note the output values for `API URL`, `anon key`, and `service_role key` -- you'll need them for environment variables.

To seed the database with sample data:

```bash
npx supabase db reset
```

## 5. Configure environment variables

Copy the example files and fill in your values. See [Environment Variables](environment-variables.md) for the full reference.

```bash
# API
cp apps/api/.env.development.example apps/api/.env.development.local

# Webapp
cp apps/webapp/.env.production.example apps/webapp/.env.development.local

# Chrome Extension (optional)
cp apps/chrome-extension/.env.development.example apps/chrome-extension/.env.development.local

# Supabase DB
cp apps/supabase-db/.env.local.example apps/supabase-db/.env.local
```

## 6. Run in development mode

```bash
npm run dev
```

This starts all apps concurrently via Turborepo:

| App | URL |
|---|---|
| Website | http://localhost:3000 |
| API | http://localhost:3001 |
| Webapp | http://localhost:3002 |
| Supabase Studio | http://localhost:54323 |

## Turborepo remote caching (optional)

Speed up builds by sharing cache across environments:

```bash
npx turbo login
npx turbo link
```
