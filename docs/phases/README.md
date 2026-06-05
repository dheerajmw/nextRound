# Phases

All delivery phases for nextRound, grouped by status.

| Status | Location |
|--------|----------|
| **Implemented (0–3)** | [implemented/](./implemented/) |
| **Planned (3–8+)** | [planned/](./planned/) |

## Implemented phases

| Phase | Name | Doc |
|-------|------|-----|
| 0 | Foundation | [implemented/phase-0-foundation/](./implemented/phase-0-foundation/) |
| 1 | Text mock interviews | [implemented/phase-1-text-interviews/](./implemented/phase-1-text-interviews/) |
| 2 | Evaluation & feedback | [implemented/phase-2-evaluation/](./implemented/phase-2-evaluation/) |
| 3 | Readiness dashboard | [implemented/phase-3-readiness-dashboard/](./implemented/phase-3-readiness-dashboard/) |

## Planned phases

See [planned/README.md](./planned/README.md) and the [full architecture roadmap](../phaseWiseArchitecture.md).

## Dependency order

```text
Phase 0 → Phase 1 → Phase 2 → Phase 3 (planned) → …
```

Critical path to MVP: **0 → 1 → 2 → 3** (dashboard).
