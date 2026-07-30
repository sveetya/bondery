# UX email design

Email-specific UX rules. For voice and tone, inherit from [bondery-ux](../../bondery-ux/SKILL.md) → `references/common/ux-writing.md`.

## Hierarchy

1. **Preview text** — inbox snippet; completes the subject, does not repeat it
2. **H1** — one headline, the main point
3. **Body** — 1–3 short paragraphs
4. **Primary action** — one button or bold link if action is needed
5. **Footer** — brand mark (via `EmailWrapper`), support link, "why you got this" for automated sends

## Subject lines

- Specific and scannable (~60 characters)
- Sentence case, no ALL CAPS or spam triggers
- Examples: `Your Bondery Premium trial is ending soon` ✅ — `SUBSCRIPTION EXPIRATION NOTICE` ❌

## Preview text

Set via `EmailWrapper` `preview` prop. Good preview text adds context the subject omits.

## Mobile

- Single column (already default)
- Min **16px** body text
- Touch targets for buttons ≥ 44px
- Test iOS Mail and Gmail app, not just React Email preview

## One primary CTA

Transactional emails should have at most one primary action. Secondary links are fine; avoid competing buttons.

## Dark mode

Design for white background first. Use brand colors with sufficient contrast on white; avoid pure `#000` text. Email clients may force dark mode with unpredictable results — do not block ship on dark-mode parity.

## Automated sends

Include a brief line explaining why the recipient is receiving the email (e.g. "You're receiving this because you have reminders enabled in Bondery.").

## User-initiated sends

Share contact emails represent the sender — tone should feel personal, not robotic. From name uses `Bondery` (not `Robot from Bondery`).
