# Phase 3 — Readiness dashboard

| | |
|--|--|
| **Status** | ✅ Implemented |
| **Migration** | `db/migrations/004_readiness.sql` |
| **Depends on** | [Phase 2](../phase-2-evaluation/) |
| **Full roadmap** | [Phase 3 in full-roadmap](../../../phaseWiseArchitecture.md#phase-3--readiness-dashboard) |

## Goal

User sees **measurable progress** over time: trends, consistency, readiness index, and recurring strengths/weaknesses.

## Scope

- Aggregate metrics from completed sessions with `session_scores`
- Trend charts: communication, overall, readiness index (3+ sessions)
- Top 3 recurring strengths / weaknesses from evaluation feedback
- Session comparison table (historical)
- Daily `user_readiness_snapshots` rollup
- PostHog: `dashboard_viewed`, `session_reviewed`, `readiness_index_band`

## Metrics

| Metric | Definition |
|--------|------------|
| Communication | Average `communication` across scored sessions |
| Consistency | `100 - min(stdDev(overall) × 3, 100)` — higher = steadier scores |
| Readiness index | Weighted composite of dimension averages (see `lib/readiness/constants.ts`) |
| Weak / strong themes | Frequency rollup of `improvements` / `strengths` strings |

## API

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/readiness` | JSON metrics for authenticated user |

Dashboard also loads metrics server-side via `getReadinessMetrics()`.

## Database (Phase 3)

- `user_readiness_snapshots` — daily `metrics` jsonb per user
- Indexes on `interview_sessions (user_id, created_at)`

## Key files

```text
db/migrations/004_readiness.sql
lib/readiness/compute.ts
lib/readiness/get-readiness.ts
lib/readiness/constants.ts
lib/readiness/types.ts
app/api/readiness/route.ts
components/dashboard/readiness-dashboard.tsx
components/dashboard/readiness-trend-charts.tsx
components/dashboard/readiness-themes.tsx
components/dashboard/session-comparison.tsx
components/dashboard/dashboard-view-tracker.tsx
app/dashboard/page.tsx
```

## Exit criteria

- [ ] Migration `004` applied
- [ ] User with **3+** scored completed sessions sees trend charts
- [ ] Strengths and weaknesses sections show recurring themes
- [ ] Session comparison table lists historical scores

## Next (planned)

[Phase 4 — Voice & adaptive interviews](../../planned/README.md#phase-4--voice--adaptive-interviews)
