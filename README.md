# Bondee Monorepo

A monorepo containing the Bondee application ecosystem, managed with [Turborepo](https://turborepo.com).

## 📦 What's Inside?

This monorepo includes the following packages/apps:

- `apps/web`: A [Next.js](https://nextjs.org/) application for the main Bondee web platform
- `apps/chrome-extension`: A Chrome extension for Instagram integration
- `packages/branding`: Shared branding assets, theme, and styles
- `packages/translations`: Internationalization (i18n) translation files

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 10 or higher (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bondee
```

2. Install dependencies:
```bash
npm install
```

This will install all dependencies for all packages in the monorepo using npm workspaces.

3. Set up environment variables:

**Chrome Extension:**
```bash
cd apps/chrome-extension
cp .env.example .env.production.local
cp .env.example .env.development.local
# Edit both files and set APP_URL
```

**Web App:**
```bash
cd apps/web
cp .env.example .env.production.local
cp .env.example .env.development.local
# Edit both files and fill in all required values
```

Required environment variables:
- **Chrome Extension**: `APP_URL`
- **Web App**: 
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `LINKEDIN_CLIENT_ID`
  - `LINKEDIN_CLIENT_SECRET`
  - `NEXT_PUBLIC_APP_URL`

## 🛠️ Development

### Run All Apps in Development Mode

To start all applications in development mode simultaneously:

```bash
npm run dev
```

This will start:
- **Web App**: Running on `http://localhost:3000`

### Run Specific App

To run a specific app only:

```bash
# Run only the web app
npm run dev --filter=web

# Run only the chrome extension (when available)
npm run dev --filter=chrome-extension
```

### Type Checking

Run TypeScript type checking across all packages:

```bash
npm run check-types
```

### Linting

Run ESLint across all packages:

```bash
npm run lint
```

## 🏗️ Build

### Build All Apps

To build all applications for production:

```bash
npm run build
```

This will:
- Build the Next.js web app with optimizations
- Create production bundles for all packages
- Cache the build outputs for faster subsequent builds

### Build Specific App

```bash
# Build only the web app
npm run build --filter=web
```

## 🚢 Production

### Run Production Build

After building, you can start the production server:

```bash
npm run start
```

Or for a specific app:

```bash
npm run start --filter=web
```

## 🔧 Environment Variables

Environment variables are validated automatically before building. Each app requires specific environment variables to be set in `.env.[environment].local` files.

### Setup Instructions

1. **Copy the example files**:
   ```bash
   # For web app
   cp apps/web/.env.production.example apps/web/.env.production.local
   cp apps/web/.env.development.example apps/web/.env.development.local
   
   # For chrome extension
   cp apps/chrome-extension/.env.production.example apps/chrome-extension/.env.production.local
   cp apps/chrome-extension/.env.development.example apps/chrome-extension/.env.development.local
   ```

2. **Fill in your values** in the newly created `.env.[environment].local` files

### Web App (`apps/web`)

**Required Environment Variables:**

```env
## Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
SUPABASE_SECRET_KEY=your_secret_key_here

## OAuth Configuration (used by Supabase)
### GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

### LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

## App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app  # Production
```

### Chrome Extension (`apps/chrome-extension`)

**Required Environment Variables:**

```env
## App Configuration
APP_URL=http://localhost:3000  # Development
# APP_URL=https://your-app-url.vercel.app  # Production
```

### Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings > API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** → `SUPABASE_SECRET_KEY` (keep this secret!)

### Getting OAuth Credentials

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Add OAuth 2.0 redirect URLs
4. Copy Client ID and Client Secret

### Environment Validation

Environment variables are automatically validated before building:
- **Development**: Validates `.env.development.local`
- **Production**: Validates `.env.production.local`

If any required variables are missing, the build will fail with a clear error message indicating which variables need to be set.

## 📁 Project Structure

```
bondee/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/               # Application source code
│   │   ├── public/            # Static assets
│   │   ├── supabase/          # Supabase migrations and config
│   │   ├── types/             # TypeScript type definitions
│   │   └── package.json       # Web app dependencies
│   └── chrome-extension/      # Chrome extension for Instagram
│       ├── src/               # Extension source code
│       ├── public/            # Extension assets
│       └── package.json       # Extension dependencies
├── packages/                  # Shared packages
│   ├── branding/             # Shared theme, styles, and icons
│   │   ├── src/
│   │   │   ├── icon.svg      # Main Bondee icon
│   │   │   ├── theme.ts      # Mantine theme configuration
│   │   │   └── styles.css    # Custom Mantine styles
│   │   └── package.json
│   └── translations/         # i18n translation files
│       ├── src/
│       │   ├── cs.json       # Czech translations
│       │   ├── en.json       # English translations
│       │   └── index.ts      # Translation exports
│       └── package.json
├── turbo.json                # Turborepo configuration
├── package.json              # Root package.json with workspaces
└── README.md                 # This file
```

## 🧹 Cleaning

To clean all build outputs and caches:

```bash
npm run clean
```

This removes:
- `.next` directories
- `.turbo` cache
- `dist` folders
- `node_modules` (run `npm install` after)

## 🎯 Turborepo Features

This monorepo uses Turborepo for:

- **Parallel Execution**: Run tasks across multiple packages simultaneously
- **Smart Caching**: Never rebuild the same thing twice
- **Dependency Awareness**: Build packages in the correct order based on dependencies
- **Incremental Builds**: Only rebuild what changed

### Useful Turbo Commands

```bash
# Run a task for all packages
turbo <task>

# Run a task for specific packages
turbo <task> --filter=web

# Run tasks with verbose output
turbo <task> --verbose

# Clear Turborepo cache
turbo clean
```

### Remote Caching
This monorepo is set up to use Turborepo's remote caching feature. This allows build outputs to be shared across different environments (e.g., CI/CD pipelines), speeding up builds significantly.

```bash
npx turbo login

```

## 📚 Tech Stack

### Web App
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Mantine UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Maps**: Leaflet + MapLibre GL
- **Charts**: D3.js
- **Internationalization**: next-intl