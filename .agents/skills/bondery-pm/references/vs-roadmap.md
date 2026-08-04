# MAIN vs ROADMAP

## What belongs on MAIN

- Bugs, chores, research tasks, refactors, performance tickets
- Security and infra work
- Every PR-scoped or sprint-sized task
- Business ops (tax, legal, compliance prep)
- Internal mirrors of public ROADMAP initiatives (execution breakdown)

## What belongs on ROADMAP

- User-visible initiatives users care about ahead of time
- Community-driven feature areas after curation
- See [bondery-roadmap](../../bondery-roadmap/references/vs-internal-plane.md)

## Linking MAIN ↔ ROADMAP

When a MAIN card implements a public initiative:

1. Include `ROADMAP-n` in the `## Roadmap` description section
2. `create_work_item_relation` (relates_to) between MAIN and ROADMAP items
3. Use `Source: Founder` for founder-initiated mirrors; infer Surface from ROADMAP platform label

Do not mandate 1:1 mirroring — many public cards have no internal twin until Building starts.

## Distinction from other docs

| Surface | Owns |
|---------|------|
| **MAIN** (this skill) | Internal execution, cycles, sanity checks |
| **ROADMAP** | Future intent and public confidence |
| **Changelog** | Shipped facts and versions |

## vs-roadmap checklist

- [ ] Internal work is on MAIN (`5ab1d2fc-fe39-4adf-af3c-bad0165e151f`)
- [ ] Public-facing intent is on ROADMAP, not duplicated on MAIN title
- [ ] ROADMAP-linked MAIN cards have relation + description section
