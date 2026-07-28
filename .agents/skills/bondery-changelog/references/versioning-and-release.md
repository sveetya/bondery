# Versioning and release notes

## Bondery version scheme

Bondery uses `X.Y.Z` as a calendar-derived product version:

- `X` — year offset from 2025 (`2026` → `1`, `2027` → `2`)
- `Y` — calendar month (`1` through `12`)
- `Z` — patch number within that month, starting at `0`

Examples:

- First release in January 2026: `1.1.0`
- Second release in January 2026: `1.1.1`
- First release in July 2026: `1.7.0`

This resembles SemVer syntactically but is not classic semantic versioning. Compatibility and breaking behavior must be described explicitly rather than inferred only from the number.

## While work is in flight

Add notable entries to `## [Unreleased]` in [`docs/changelog.mdx`](../../../../docs/changelog.mdx). Keep entries grouped by category and update them as the released outcome becomes clearer.

Do not create a dated version section for every merge. A dated section represents a release.

## When cutting a release

1. Calculate `X.Y.Z` from the release year/month and existing releases in that month.
2. Review all changes since the previous release; add missing notable entries and remove internal noise.
3. Move the accumulated entries under `## [X.Y.Z] - DD.MM.YYYY`.
4. Leave a fresh `## [Unreleased]` section at the top.
5. Add `Breaking` notes with migration links when applicable.
6. Complete package version bumps, generated artifacts, builds, extension gates, deployment, and rollback steps in the [Release workflow](../../../workflows/RELEASE.md).
7. For a monthly release, use the curated changelog as source material for the [Blog post workflow](../../../workflows/blog/BLOG-POST.md); do not paste commit logs into user communications.

Dependency-only work follows the [Package upgrade workflow](../../../workflows/chores/UPGRADE-PACKAGES.md) and normally uses the `📦 Dependencies` category with a `deps:` commit prefix.

## Release-note checklist

- [ ] Version derives from release year, month, and patch sequence
- [ ] All notable changes since the previous release were reviewed
- [ ] Entries moved from `Unreleased` into the new dated section
- [ ] A clean `Unreleased` section remains first
- [ ] Breaking and self-hosting actions are explicit
- [ ] Full technical release workflow completed separately
- [ ] Monthly announcement content was drafted from curated outcomes
