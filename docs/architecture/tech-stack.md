# Tech Stack

## Core

| Technology | Version | Purpose |
|---|---|---|
| TypeScript | 5.x | Language for all apps and packages |
| Node.js | >= 20 | Runtime |
| npm | >= 10 | Package manager |
| Turborepo | 2.8+ | Monorepo build system and task runner |

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x | React framework (App Router, RSC) |
| React | 19.x | UI library |
| Mantine | 8.x | Component library |
| Tailwind CSS | 4.x | Utility-first CSS |
| next-intl | 4.x | Internationalization |
| D3.js | 7.x | Data visualizations and charts |
| Leaflet | 1.x | Interactive maps |
| MapLibre GL | 5.x | Vector tile maps |
| Tiptap | 2.x | Rich text editor |
| Motion | 12.x | Animations (Framer Motion) |
| PostHog | -- | Product analytics |

## Backend

| Technology | Version | Purpose |
|---|---|---|
| Fastify | 5.x | HTTP server framework |
| Supabase | -- | Auth, database, storage, edge functions |
| PostgreSQL | 17 | Primary database |
| PostGIS | -- | Geospatial extension |
| nodemailer | 6.x | Email delivery (SMTP) |
| React Email | 4.x | Email template rendering |

## Chrome Extension

| Technology | Purpose |
|---|---|
| React 19 | UI in injected components |
| Parcel | Bundler |
| Manifest v3 | Chrome extension API |
| MutationObserver | Dynamic page content detection |

## Development tools

| Tool | Purpose |
|---|---|
| ESLint | Linting (Airbnb config + Prettier) |
| Prettier | Code formatting |
| Supabase CLI | Local database management |
| Docker | Required by Supabase CLI |

## Infrastructure

| Service | Purpose |
|---|---|
| Vercel | Hosting for Next.js apps and API |
| Supabase Cloud | Managed PostgreSQL, auth, storage |
| GitHub Actions | CI/CD for chrome extension releases |
| Chrome Web Store | Extension distribution |
