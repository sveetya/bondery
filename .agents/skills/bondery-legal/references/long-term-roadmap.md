# Long-term roadmap

Ranked evolution for Bondery legal disclosure hygiene over 6–12 months. **Not implemented in v1 skill** — tracked here for planning.

## 1. Single source of truth for subprocessors (highest leverage)

**Problem:** `Privacy.tsx` hardcoded array drifts from code (Supabase, Plunk stale today).

**Target:** `packages/helpers/src/legal/subprocessors.ts` (or `packages/schemas`) — manifest shaped like `packages/helpers/src/env/manifest.ts`:

```typescript
// Illustrative — not yet implemented
{ name, useCase, dataCategories, region, privacyUrl, codeRefs: string[] }
```

- `Privacy.tsx` renders table from manifest
- `bondery-legal/references/subprocessor-registry.md` becomes a thin pointer or generated doc
- `npm run sync-legal` or extend `npm run env` pattern

**Benefit:** Structural prevention of vendor table drift.

## 2. CI drift check

**Model:** `npm run env -- --check`, `npm run check-doc-links` in `.github/workflows/verify.yml`.

**Target script:** Scan `package.json` / env manifest for known vendor SDK identifiers; diff against subprocessor manifest; fail or warn on undeclared vendor.

**Prerequisite:** #1 manifest exists.

## 3. Terms of Service finalization (standing leadership item)

**Severity:** Highest existing gap — live product with `Terms.tsx` stating it is not final contractual terms.

**Action:** Allocate counsel time; not an engineering skill deliverable.

**Track:** Plane epic / leadership backlog.

## 4. Cookie consent banner

**Gap:** Privacy §6 describes cookie categories; no consent UI on website.

**Owner:** `bondery-ux` + webapp/website implementation.

**Legal:** Escalate banner copy and essential vs. analytics split to human review.

## 5. Account-level GDPR export

**Gap:** Per-contact vCard only; policy allows email-based rights exercise.

**Owner:** `bondery-api` — `GET /api/me/export` or similar.

**Legal:** Update claims inventory when shipped.

## 6. Analytics opt-out + `DO_NOT_TRACK`

**Gap:** Policy claims settings toggle; `DO_NOT_TRACK` in manifest unused.

**Target:** Settings toggle + wire `DO_NOT_TRACK` in `instrumentation-client.ts`; respect DNT header.

## 7. Retention enforcement jobs

**Gap:** 30-day backup purge, 90-day IP log anonymization claimed but not coded.

**Target:** Documented jobs + update claims inventory to `implemented`.

## 8. Self-host legal split in docs

**Gap:** `docs/deploy/get-started.mdx` does not state operator-as-controller.

**Target:** Section clarifying hosted policy ≠ self-host obligations.

## 9. DPA request handling

**Target:** Templated DPA + SCCs for enterprise; Plane workflow for requests — human-gated, not automated.

## 10. SOC2 / ISO27001 readiness

**Note:** Maintained `subprocessor-registry.md` + `policy-claims-inventory.md` (or generated manifest) is the artifact auditors request. Investing in #1–#2 pays forward.

---

## Priority summary

| Priority | Item | Type |
|----------|------|------|
| P0 | ToS finalization | Legal/counsel |
| P1 | Subprocessor manifest + generated Privacy table | Engineering |
| P1 | CI vendor drift check | Engineering |
| P2 | Cookie consent banner | Product + legal review |
| P2 | Analytics opt-out | Product |
| P2 | Self-host docs clarification | Docs |
| P3 | Full account export | Product |
| P3 | Retention jobs | Engineering |
| P3 | DPA workflow | Ops + legal |

## Roadmap checklist (for planners)

- [ ] New work item references which roadmap item it advances
- [ ] Claims inventory updated when P2/P3 items ship
- [ ] Manifest (#1) preferred before large subprocessor table edits in Privacy.tsx
