# Intake and sanity check

## Intake

All new cards land in **Intake** (default state). Agents must not skip to Building.

Intake holds raw ideas, drafts, and agent-created cards until a sanity check is complete.

## Five sanity-check questions

Before a card moves from **Intake** → **Icebox** or **Bet**, the description must include a `## Sanity check` section with answers to all five:

1. **Who is the user?** — Specific persona (e.g. "mobile contact manager"), or `operator/founder` for infra, docs, and business ops.
2. **What pain or opportunity?** — One sentence: what problem this solves or what it unlocks.
3. **How do we know?** — Evidence source: support ticket, churn feedback, usage/analytics, founder intuition, ROADMAP vote, agent suggestion, etc.
4. **What's the smallest shippable slice this week?** — If not shippable this week, answer `not this week` and move to **Icebox** instead of **Bet**.
5. **How will we know it worked?** — Metric, qualitative signal, or concrete outcome (e.g. "unblocks self-host docs", "reduces API p95 by 20%").

**Note:** This is a description section, not Plane triage and not a comment thread.

## Decision after sanity check

| Outcome | Next state |
|---------|------------|
| All five answered + shippable this week or soon | **Bet** (or **Bet for Next Cycle** if queued for Monday) |
| All five answered + not now | **Icebox** |
| Cannot answer honestly | Stay in **Intake** or **Won't do** with reason comment |

## Intake checklist

- [ ] Card is in Intake state
- [ ] All five sanity-check questions answered in description
- [ ] Source + Surface labels assigned
- [ ] Owner assigned before leaving Intake
