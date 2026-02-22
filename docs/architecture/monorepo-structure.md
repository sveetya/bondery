# Monorepo Structure

```
bondery/
├── apps/
│   ├── api/                    # Fastify REST API
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── lib/            # Shared utilities (auth, config, parsers)
│   │   │   └── routes/         # Route modules (contacts, groups, events...)
│   │   ├── openapi.yaml        # OpenAPI specification
│   │   └── package.json
│   │
│   ├── webapp/                 # Next.js authenticated app
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   │   ├── (app)/      # Route group
│   │   │   │   │   ├── app/    # Protected routes (/app/*)
│   │   │   │   │   ├── auth/   # OAuth callback
│   │   │   │   │   └── login/  # Login page
│   │   │   │   └── layout.tsx  # Root layout
│   │   │   ├── components/     # Shared UI components
│   │   │   └── lib/            # Supabase clients, i18n, config
│   │   ├── proxy.ts            # Middleware (CSP, auth redirects)
│   │   └── package.json
│   │
│   ├── website/                # Next.js public landing page
│   │   ├── src/
│   │   │   ├── app/            # Pages (landing, legal, contact)
│   │   │   └── components/     # Landing page sections
│   │   ├── proxy.ts            # Middleware (CSP)
│   │   └── package.json
│   │
│   ├── chrome-extension/       # Browser extension
│   │   ├── src/
│   │   │   ├── linkedin/       # LinkedIn content script
│   │   │   ├── instagram/      # Instagram content script
│   │   │   ├── facebook/       # Facebook content script
│   │   │   └── webapp/         # Bridge for extension detection
│   │   ├── manifest.json       # Extension manifest v3
│   │   └── package.json
│   │
│   └── supabase-db/            # Database management
│       ├── supabase/
│       │   ├── migrations/     # SQL migration files (40+)
│       │   ├── functions/      # Edge functions
│       │   ├── seed.sql        # Development seed data
│       │   └── config.toml     # Supabase local config
│       └── package.json
│
├── packages/
│   ├── types/                  # @bondery/types
│   │   ├── src/
│   │   │   ├── contact.ts      # Contact, Phone, Email types
│   │   │   ├── activity.ts     # Event types
│   │   │   ├── group.ts        # Group types
│   │   │   ├── user.ts         # User settings types
│   │   │   ├── api.ts          # API request/response types
│   │   │   └── supabase.types.ts  # Generated Supabase types
│   │   └── package.json
│   │
│   ├── helpers/                # @bondery/helpers
│   ├── branding/               # @bondery/branding
│   ├── mantine-next/           # @bondery/mantine-next
│   ├── translations/           # @bondery/translations
│   └── emails/                 # @bondery/emails
│
├── .github/
│   ├── workflows/              # CI/CD workflows
│   └── instructions/           # Team coding guidelines
│
├── turbo.json                  # Turborepo task configuration
├── package.json                # Root workspace configuration
├── eslint.config.mjs           # Shared ESLint config
└── .prettierrc                 # Shared Prettier config
```

## Workspace configuration

The root `package.json` defines npm workspaces:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

All apps and packages are discovered automatically. Dependencies between packages are declared via standard `dependencies` in each `package.json` (e.g. `"@bondery/types": "*"`).

## Turborepo task graph

`turbo.json` defines task dependencies:

- `build` depends on `^build` (build dependencies first)
- `dev` is persistent (long-running)
- `check-types` depends on `^build`
- `lint` runs independently

Package-specific build tasks are defined for `@bondery/branding`, `@bondery/emails`, `@bondery/helpers`, and `@bondery/types`.
