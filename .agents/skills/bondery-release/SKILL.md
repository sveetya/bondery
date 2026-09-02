---
name: bondery-release
description: >
  Bondery release operator runbook — prerequisites on main, extension gates, promote
  main:release and unified vX.Y.Z tags, Dokploy BONDERY_INFRA_VERSION pin, rollback, and hotfix sequencing.
  Use when cutting a monthly or patch release, pushing to release, tagging vX.Y.Z,
  pinning product version, promoting to production, or rolling back.
metadata:
  version: "1.0.0"
  namespace: bondery
---

# Bondery Release

## When to use

- Cutting a monthly, patch, or hotfix release (`X.Y.Z`)
- Pushing `main` to `release` or tagging `vX.Y.Z`
- Setting `BONDERY_INFRA_VERSION` in Dokploy after a tested deploy
- Rolling back production or self-host pins (paired api + webapp)
- Coordinating Chrome extension publish before product deploy

## When not to use

- Changelog wording or version math — use `bondery-changelog`
- CI workflow YAML or tag semantics detail — use [`.github/workflows/README.md`](../../../.github/workflows/README.md)
- Pre-merge quality gates on a PR — use `bondery-verification-loop`
- Post-push CI triage — use Cursor `babysit` skill
- API compatibility policy — use `bondery-api` → `references/versioning.md`

## Non-negotiables

1. **`:sha-<short>` must exist on `main`** before `vX.Y.Z` — merge to `main` first; [`stage-images.yml`](../../../.github/workflows/stage-images.yml) builds artifacts on push to `main`.
2. **Product tags promote, they do not rebuild** — [`release.yml`](../../../.github/workflows/release.yml) promotes `ghcr.io/usebondery/{api,webapp}:sha-<short>` → `:X.Y.Z` unless `force_rebuild` on `retry-promote` dispatch.
3. **Extension gate (when extension changed):** do not approve `production-containers` or update Dokploy until the user confirms the Chrome Web Store listing is live.
4. **Website exception:** `git push origin main:release` is **not** extension-gated — marketing CD only ([`deploy-website.yml`](../../../.github/workflows/deploy-website.yml)).
5. **Pin `BONDERY_INFRA_VERSION`** in Dokploy (and manifest via `sync-version`) — pins **both** api and webapp images; redeploy together.
6. **CI truth:** [`.github/workflows/README.md`](../../../.github/workflows/README.md) overrides remembered release folklore.

## Related skills and docs

| Concern | Owner |
|---------|--------|
| Version scheme, `Unreleased` → dated section | [`bondery-changelog`](../bondery-changelog/SKILL.md) |
| Public roadmap state updates (Ready for Release → Released) | [`bondery-roadmap`](../bondery-roadmap/SKILL.md) |
| CI triggers, Docker channels, promote semantics | [`.github/workflows/README.md`](../../../.github/workflows/README.md) |
| Execute file edits and commits | Cursor implementer agent |
| Watch `release-*` / `deploy-website` CI | Cursor babysit skill |
| Extension local dev / OAuth / listing graphics | [`bondery-chrome-extension`](../bondery-chrome-extension/SKILL.md); [`apps/chrome-extension/README.md`](../../../apps/chrome-extension/README.md); [OAuth workflow](../../workflows/CHROME-EXTENSION-OAUTH.md) |
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
- [ ] If extension changed: CWS publish succeeded; **user confirmed CWS live** before approving `production-containers`
- [ ] `main:release` pushed when website (or full stack) ready
- [ ] `vX.Y.Z` tagged; unified CI promote + smoke green
- [ ] `BONDERY_INFRA_VERSION` synced via `sync-version`; Dokploy updated; api + webapp redeployed together
- [ ] Manual smoke: login + one authenticated mutation on product stack
- [ ] ROADMAP cards updated (Ready for Release → Released) per [`bondery-roadmap`](../bondery-roadmap/SKILL.md)
- [ ] Post-release comms if monthly release ([post-release.md](references/post-release.md))
