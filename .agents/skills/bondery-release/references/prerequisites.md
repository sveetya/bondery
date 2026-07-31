# Prerequisites on `main`

Complete all steps on `main` **before** pushing to `release` or creating product tags.

## 1. Bump version numbers

Update `version` in every product `package.json` (mobile uses independent versioning — skip `apps/mobile/package.json`):

```
package.json
apps/api/package.json
apps/webapp/package.json
apps/chrome-extension/package.json
apps/website/package.json
packages/branding/package.json
packages/db/package.json
packages/emails/package.json
packages/helpers/package.json
packages/mantine-next/package.json
packages/openapi-spec/package.json
packages/schemas/package.json
packages/translations/package.json
packages/typescript-config/package.json
packages/vcard/package.json
```

Version math and changelog cut: [`bondery-changelog` versioning](../../bondery-changelog/references/versioning-and-release.md).

## 2. Minimum extension version

When the extension API surface changes, update `MIN_EXTENSION_VERSION` in [`packages/helpers/src/globals/paths.ts`](../../../../packages/helpers/src/globals/paths.ts). This drives the API `426 extension_outdated` gate so users upgrade before incompatible webapp/API deploys.

Skip if the release does not change extension–API compatibility.

## 3. Product changelog

Move `Unreleased` entries into a dated `## [X.Y.Z] - DD.MM.YYYY` section in [`docs/changelog.mdx`](../../../../docs/changelog.mdx). Follow [`bondery-changelog` format](../../bondery-changelog/references/format.md).

## 4. OpenAPI spec

```bash
pnpm run generate:openapi
```

Commit generated output so API docs and clients stay in sync.

## 5. Build and verify

```bash
pnpm run build
```

Or run `bondery-verification-loop` for the release-scoped diff. Fix failures before proceeding.

## 6. Commit to `main`

Commit prerequisites as one or more logical commits on `main` (often via a `chore/release-X.Y.Z` PR). Merge PRs first so `stage-images` can build `:sha-<short>` for the release commit.

## Which services to tag

Tag only services with substantive changes since the last release. Quick checks:

```bash
# Compare against last product tags (adjust versions)
git diff api-1.7.4..HEAD --stat -- apps/api apps/webapp apps/website apps/chrome-extension
```

Confirm `stage-images` succeeded on the release commit for each service you will tag — see [ci-triggers.md](ci-triggers.md). A version-only bump under `apps/chrome-extension/` without source changes does **not** require `ext-X.Y.Z` (see [sequencing-and-gates.md](sequencing-and-gates.md)).

## Prerequisites checklist

- [ ] All `package.json` versions match target `X.Y.Z`
- [ ] `MIN_EXTENSION_VERSION` updated if extension/API compatibility changed
- [ ] `docs/changelog.mdx` has dated section; fresh `Unreleased` at top
- [ ] OpenAPI generated and committed
- [ ] `pnpm run build` (or verification loop) passes
- [ ] Changes merged on `main`
- [ ] Services to tag identified (`api` / `webapp` / `ext` only where substantively changed)
