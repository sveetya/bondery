# Website

**Package:** `apps/website`
**Framework:** Next.js 16 (App Router)
**Port:** 3000
**Production URL:** `https://usebondery.com`

The website is the public-facing landing page for Bondery. It serves marketing content, legal pages, and SEO.

## Routes

| Route | Description |
|---|---|
| `/` | Landing page (Hero, Features, Pricing, FAQ, CTA) |
| `/contact` | Contact page with team section |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/about` | About page (not yet implemented) |

### Redirects (configured in `next.config.ts`)

| From | To |
|---|---|
| `/status` | External status page |
| `/login` | `{WEBAPP_URL}/login` |
| `/auth/callback/*` | `{WEBAPP_URL}/auth/callback/*` |
| `/app/*` | `{WEBAPP_URL}/app/*` |

## Landing page sections

1. **Header** -- navigation with GitHub stars badge, links to webapp
2. **Hero** -- main value proposition and sign-up CTA
3. **Features** -- feature highlights with animations
4. **Pricing** -- pricing information (free during beta)
5. **FAQ** -- frequently asked questions with JSON-LD schema markup
6. **Call to Action** -- sign-up prompt
7. **Footer** -- links and social media

## SEO

- **Structured data:** Organization, WebSite, SoftwareApplication JSON-LD schemas
- **Open Graph images:** dynamically generated via `opengraph-image.tsx`
- **Twitter cards:** via `twitter-image.tsx`
- **Sitemap:** auto-generated at `/sitemap.xml`
- **Robots.txt:** at `/robots.txt`
- **Canonical URLs** on all pages
- **Meta descriptions** on all pages

## Middleware

The `proxy.ts` middleware handles:

- **Content Security Policy (CSP)** with nonce-based script execution
- No authentication (public site)

## Security headers

- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `Cross-Origin-Opener-Policy: same-origin`
- Content Security Policy

## i18n

next-intl is installed but not yet configured. The site is currently English-only (`lang="en"`).

## Tech stack

- Next.js 16.1 with App Router
- React 19
- Mantine 8 component library
- Tailwind CSS 4
- Motion (Framer Motion) for animations
