# Sequencing and gates

## End-to-end order

```text
PR → verify → merge main → stage-images (:sha for changed services)
→ prerequisites on main (see prerequisites.md)
→ [if extension changed] ext-X.Y.Z → STOP for Chrome Web Store
→ git push origin main:release  (website CD; not extension-gated)
→ git tag api-X.Y.Z / webapp-X.Y.Z  (only changed services)
→ pin tested pair → Dokploy → manual smoke
→ post-release comms (monthly)
```

## Critical ordering rule

**When the Chrome extension changed:** do not push `main:release` or `api-*` / `webapp-*` tags until the user **explicitly confirms** the extension is live in the Chrome Web Store. Deploying the webapp/API before the extension is live breaks `MIN_EXTENSION_VERSION` gating.

Agents must **stop and ask** after pushing `ext-X.Y.Z` until the user confirms CWS approval.

## Extension unchanged (common for infra-only releases)

If `apps/chrome-extension/**` has **no substantive source changes** since the last release (a `package.json` version bump alone does not count):

1. Skip [extension.md](extension.md) tag and CWS wait.
2. Proceed directly to `main:release` and product tags after prerequisites and `stage-images` on `main`.

Example: CI/CD-only or api/webapp-only releases (e.g. `1.8.0` when extension source is unchanged but monorepo versions align).

## Website exception

Marketing website CD is **not** extension-gated.

```bash
git push origin main:release
```

Triggers [`deploy-website.yml`](../../../../.github/workflows/deploy-website.yml) when website-related paths changed. The workflow promotes `website:sha-<short>` → `:production` when the image exists on `main`; otherwise it builds. No `website-X.Y.Z` semver tag.

You may push website-only changes to `release` without waiting on Chrome Web Store review.

## Product container tags

After prerequisites and (if applicable) extension gate:

```bash
git tag api-X.Y.Z        # if API changed
git tag webapp-X.Y.Z     # if webapp changed
git push origin api-X.Y.Z webapp-X.Y.Z
```

Tags must point at a commit that was built on `main` so `:sha-<short>` exists. See [ci-triggers.md](ci-triggers.md).

Tag only services that changed in this release.

## Human approval before production refs

| Action | Who approves |
|--------|----------------|
| `git push origin main:release` | Human (agent proposes commands) |
| `git push origin api-X.Y.Z webapp-X.Y.Z` | Human |
| Dokploy pin change + redeploy | Human |
| `force_rebuild: true` on release workflow dispatch | Human |

## Release smoke failure decision tree

Use this when release smoke fails — fix the right layer, not the symptom.

```text
pre_start exits non-zero (e.g. ERR_MODULE_NOT_FOUND)
  → Image packaging / Dockerfile (workspace packages not resolvable at runtime)
  → Fix Dockerfile; re-tag or force_rebuild; do NOT override pre_start in smoke scripts

promote fails "no sha-* image"
  → stage-images did not build that commit (path filter skip or failed build)
  → Move tag to a built SHA, or push a commit that triggers stage-images, or force_rebuild

health check fails after pre_start succeeds
  → Runtime env / DB / SeaweedFS / secrets — not the image build path

PR green but release smoke fails on image
  → Before Phase 1 guardrails: api/webapp images were not built on PR
  → After guardrails: check whether path filters skipped the docker build job
```

### Tag commit requirements

1. Tag must be on `release` branch (enforced by release workflows).
2. `ghcr.io/usebondery/api:sha-<7char>` (or webapp) must exist — `stage-images` built that SHA on `main`.
3. Deploy-only or Dockerfile-fix commit after tag → move tag to a built SHA, or use `force_rebuild: true`.

### Smoke contract

- Smoke checks out the **tag ref** for compose/scripts.
- Smoke runs the **full** compose `pre_start` hooks — no overrides.
- Image fixes ship via Dockerfile + re-tag or `force_rebuild`, not smoke script hacks on `main`.

## Sequencing checklist

- [ ] Prerequisites on `main` complete
- [ ] `stage-images` succeeded for services being released
- [ ] Extension path: CWS live confirmed **or** extension unchanged shortcut taken
- [ ] `main:release` pushed when website/full stack ready
- [ ] Product tags pushed only for changed services
- [ ] CI green on release workflows (use babysit if needed)
