# Templates and branding

## EmailWrapper contract

Every template must wrap content in `packages/emails/src/shared/EmailWrapper.tsx`:

| Prop | Purpose |
|------|---------|
| `preview` | Inbox snippet text (React Email `<Preview>`) — complements subject, does not duplicate it |
| `children` | Email body |

`EmailWrapper` provides:

- **Font:** Lexend (Google Fonts woff2) + sans-serif fallback
- **Color:** Tailwind `brand` token from `BRAND_PRIMARY_COLOR` (`#a34bcb`)
- **Footer:** `BonderyLogotypeBlack` (160×48), centered

## Styling rules

- Use React Email components (`Section`, `Heading`, `Text`, `Button`, `Img`, etc.).
- Tailwind via `<Tailwind>` with `pixelBasedPreset` is supported — **do not rely on Tailwind alone** for critical layout; many clients strip `<style>`.
- Prefer inline styles on elements that must survive client sanitization.
- Single column layout; min **16px** body text for mobile readability.

## Brand assets

Import from `@bondery/branding`:

- `BRAND_PRIMARY_COLOR` — accent color
- `BonderyLogotypeBlack` from `@bondery/branding/react` — footer logo

Do not add one-off images or colors in templates.

## Product URLs

Templates today link to `app.usebondery.com` where needed. When adding links, use the production app URL consistently or pass URL as a prop from the API if environment-specific links are required later.

## Package structure

```text
packages/emails/
  src/
    shared/EmailWrapper.tsx
    templates/*.tsx
    index.ts
```

## i18n

Email copy lives in `packages/translations` under `platform/email/` (en / cs / de). Templates accept a `copy` prop; the API loads namespaces via `email-i18n.ts` and passes interpolated strings at send time.

- Do **not** use `react-i18next` hooks in `@bondery/emails` — senders call templates as functions outside a React tree.
- Preview defaults: `packages/emails/src/fixtures/default-copy.ts` (English).
- Share contact body uses `ShareContactEmailBody` (distinct from mobile `ShareContactEmail` sheet namespace).

## Upstream reference

For generic React Email component patterns, see the upstream `email-best-practices` skill (`.agents/skills/email-best-practices/SKILL.md`).
