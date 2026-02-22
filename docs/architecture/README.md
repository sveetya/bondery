# Architecture Overview

Bondery is a TypeScript monorepo managed by Turborepo. It consists of five deployable applications and six shared packages.

## High-level diagram

```mermaid
graph TB
    subgraph clients [Clients]
        Browser[Browser]
        Extension[Chrome Extension]
    end

    subgraph apps [Applications]
        Website["Website\n(Next.js, port 3000)"]
        Webapp["Webapp\n(Next.js, port 3002)"]
        API["API Server\n(Fastify, port 3001)"]
    end

    subgraph backend [Backend Services]
        SupabaseAuth[Supabase Auth]
        SupabaseDB[PostgreSQL + PostGIS]
        SupabaseStorage[Supabase Storage]
        Cron[Supabase Cron]
    end

    subgraph external [External]
        SMTP[SMTP Server]
        GitHub[GitHub OAuth]
        LinkedIn[LinkedIn OIDC]
    end

    Browser --> Website
    Browser --> Webapp
    Extension -->|"redirect /api/redirect"| API
    Webapp -->|"fetch /api/*"| API
    API --> SupabaseAuth
    API --> SupabaseDB
    API --> SupabaseStorage
    API --> SMTP
    Webapp --> SupabaseAuth
    SupabaseAuth --> GitHub
    SupabaseAuth --> LinkedIn
    Cron -->|"POST /api/reminders"| API
```

## Key principles

- **Monorepo** -- all code in one repository, shared dependencies and types
- **Type safety** -- shared `@bondery/types` package ensures API contracts are consistent across frontend and backend
- **Supabase as backend** -- authentication, database, storage, and cron jobs are all managed by Supabase
- **Server-side rendering** -- both Next.js apps use the App Router with React Server Components
- **Row Level Security** -- all database access is scoped to the authenticated user at the database level

## Application roles

| App | Role | Framework | Port |
|---|---|---|---|
| `apps/website` | Public landing page, SEO, legal pages | Next.js 16 | 3000 |
| `apps/api` | REST API for all data operations | Fastify 5 | 3001 |
| `apps/webapp` | Authenticated application (dashboard, contacts, groups) | Next.js 16 | 3002 |
| `apps/chrome-extension` | Import contacts from social media profiles | React + Parcel | -- |
| `apps/supabase-db` | Database migrations, edge functions, seed data | Supabase CLI | 54321 |

## Shared packages

| Package | Purpose |
|---|---|
| `@bondery/types` | TypeScript types and Supabase database types |
| `@bondery/helpers` | Utility functions and path constants |
| `@bondery/branding` | Brand assets, icons, React icon components |
| `@bondery/mantine-next` | Mantine UI theme and styles for Next.js |
| `@bondery/translations` | i18n messages (Czech, English) |
| `@bondery/emails` | React Email templates (reminders, feedback) |

See [Monorepo Structure](monorepo-structure.md) for the full directory layout and [Tech Stack](tech-stack.md) for technology choices.
