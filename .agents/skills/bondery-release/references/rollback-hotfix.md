# Rollback and hotfix

## Hotfix (patch release)

For urgent fixes between monthly releases:

1. Fix the issue on `main`.
2. Bump only the **Z** segment (e.g. `1.8.0` → `1.8.1`).
3. Follow [prerequisites.md](prerequisites.md) and [sequencing-and-gates.md](sequencing-and-gates.md).

Keep hotfixes small. Prefer one logical fix per patch.

## Production rollback (product stack)

1. Restore the previous `BONDERY_INFRA_API_IMAGE_TAG` and `BONDERY_INFRA_WEBAPP_IMAGE_TAG` in Dokploy and [`manifest.ts`](../../../../packages/helpers/src/env/manifest.ts).
2. Redeploy only the affected service(s).
3. Do **not** rely on floating `:production` as the rollback target for api/webapp in production/self-host configs.

## Website rollback

Marketing site uses `:production` on the ops stack. Rollback options:

- Point ops Compose at a known `ghcr.io/usebondery/website:sha-<short>`, or
- Use Dokploy's previous deployment snapshot.

## Rollback via new patch (preferred for code defects)

1. Revert faulty commits on `main` (or fix forward).
2. Cut a new patch release (`Z+1`) following the hotfix flow.
3. Tag and promote through normal CI.

## Chrome extension rollback

You **cannot unpublish** a Chrome Web Store update. Submit a fixed version with a new `ext-X.Y.Z` tag and wait for CWS approval.

## CI rollback (workflow regression)

If a workflow change breaks promote/smoke:

1. Revert the workflow PR on `main`.
2. Re-run `stage-images` or use `force_rebuild: true` on release dispatch if `:sha` is missing.
3. Re-apply branch protection rules if ruleset JSON changed (`pnpm run github:rulesets -- main` or `gh api` on Windows).

## Rollback checklist

- [ ] Previous pin pair documented before deploy
- [ ] Dokploy env restored or patch release cut
- [ ] Smoke verified after rollback or patch deploy
- [ ] Changelog documents the incident if user-visible
