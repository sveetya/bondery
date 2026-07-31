---
name: bondery-release
description: >
  Bondery release operator runbook — prerequisites on main, extension gates, promote
  main:release and product tags, Dokploy image pins, rollback, and hotfix sequencing.
  Use when cutting a monthly or patch release, pushing to release, tagging api-X.Y.Z /
  webapp-X.Y.Z / ext-X.Y.Z, pinning image tags, promoting to production, or rolling back.
metadata:
  version: "1.0.0"
  namespace: bondery
---

# Bondery Release

## When to use

- Cutting a monthly, patch, or hotfix release (`X.Y.Z`)
- Pushing `main` to `release` or tagging `api-*`, `webapp-*`, `ext-*`
- Pinning `BONDERY_INFRA_*_IMAGE_TAG` after a tested deploy
- Rolling back production or self-host pins
- Coordinating Chrome extension publish before product deploy

## When not to use

- Changelog wording or version math — use `bondery-changelog`
- CI workflow YAML or tag semantics detail — use [`.github/workflows/README.md`](../../../.github/workflows/README.md)
- Pre-merge quality gates on a PR — use `bondery-verification-loop`
- Post-push CI triage — use Cursor `babysit` skill
- API compatibility policy — use `bondery-api` → `references/versioning.md`

## Non-negotiables

1. **`:sha-<short>` must exist on `main`** before `api-X.Y.Z` / `webapp-X.Y.Z` — merge to `main` first; [`stage-images.yml`](../../../.github/workflows/stage-images.yml) builds artifacts on push to `main`.
2. **Product tags promote, they do not rebuild** — release workflows promote `ghcr.io/usebondery/{api,webapp}:sha-<short>` → `:X.Y.Z` unless `force_rebuild: true` on manual dispatch (human-approved only).
3. **Extension gate (when extension changed):** do not push `main:release` or product tags until the user confirms the Chrome Web Store listing is live.
4. **Website exception:** `git push origin main:release` is **not** extension-gated — marketing CD only ([`deploy-website.yml`](../../../.github/workflows/deploy-website.yml)).
5. **Pin the tested api/webapp pair** in [`packages/helpers/src/env/manifest.ts`](../../../packages/helpers/src/env/manifest.ts) — do not use floating `:production` as the production/self-host pin for api/webapp.
6. **CI truth:** [`.github/workflows/README.md`](../../../.github/workflows/README.md) overrides remembered release folklore.

## Related skills and docs

| Concern | Owner |
|---------|--------|
| Version scheme, `Unreleased` → dated section | [`bondery-changelog`](../bondery-changelog/SKILL.md) |
| CI triggers, Docker channels, promote semantics | [`.github/workflows/README.md`](../../../.github/workflows/README.md) |
| Execute file edits and commits | Cursor implementer agent |
| Watch `release-*` / `deploy-website` CI | Cursor babysit skill |
| Extension local dev / OAuth | [`apps/chrome-extension/README.md`](../../../apps/chrome-extension/README.md) |
| Release blog post | [`.agents/workflows/blog/BLOG-POST.md`](../../workflows/blog/BLOG-POST.md) |

## Decision tree

| Task | Read |
|------|------|
| Pre-release bumps, openapi, build on `main` | [references/prerequisites.md](references/prerequisites.md) |
| Order of extension → release → tags | [references/sequencing-and-gates.md](references/sequencing-and-gates.md) |
| What GitHub runs on push/tag (operator view) | [references/ci-triggers.md](references/ci-triggers.md) |
| Manifest pins, Dokploy product stack | [references/dokploy-pins.md](references/dokploy-pins.md) |
| `ext-X.Y.Z`, Chrome Web Store wait/reject | [references/extension.md](references/extension.md) |
| Hotfix or production rollback | [references/rollback-hotfix.md](references/rollback-hotfix.md) |
| Blog, Discord, Reddit after deploy | [references/post-release.md](references/post-release.md) |
| Calculate `X.Y.Z`, cut changelog | [bondery-changelog versioning](../bondery-changelog/references/versioning-and-release.md) |

Full index: [references/README.md](references/README.md).

## Release operator checklist

- [ ] Prerequisites on `main` complete ([prerequisites.md](references/prerequisites.md))
- [ ] Changelog dated section cut (`bondery-changelog`)
- [ ] Target commit merged to `main`; `stage-images` produced `:sha-<short>` for changed services
- [ ] If extension changed: `ext-X.Y.Z` pushed; **user confirmed CWS live** before product deploy
- [ ] `main:release` pushed when website (or full stack) ready
- [ ] `api-X.Y.Z` / `webapp-X.Y.Z` tagged only for changed services; CI promote + smoke green
- [ ] Tested pair pinned in manifest + `deploy/bondery/.env.example`; promoted to `release` if needed
- [ ] Dokploy env updated; changed service(s) redeployed
- [ ] Manual smoke: login + one authenticated mutation on product stack
- [ ] Post-release comms if monthly release ([post-release.md](references/post-release.md))
