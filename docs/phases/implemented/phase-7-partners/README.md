# Phase 7 — Partners & scale

| | |
|--|--|
| **Status** | ✅ Implemented |
| **Migration** | `db/migrations/008_partners.sql` |
| **Depends on** | [Phase 3](../phase-3-readiness-dashboard/) (readiness aggregates) |
| **Full roadmap** | [Phase 7 in phaseWiseArchitecture](../../../phaseWiseArchitecture.md#phase-7--partners--scale) |

## Goal

Support **placement cells, bootcamps, and coaches** with cohorts, anonymized readiness analytics, and org-level LLM caps.

## Scope

- Organizations + org members (`admin`, `coach`, `member`)
- Cohorts + email invites (pending → active on login)
- Cohort analytics (avg readiness, no answer text)
- Coach read-only mentee summaries
- CSV export for placement reporting
- Per-org daily LLM cap (`organizations.llm_daily_cap`)
- RLS on partner tables

## API

| Method | Route | Notes |
|--------|-------|-------|
| `GET/POST` | `/api/orgs` | List / create org |
| `GET` | `/api/orgs/:orgId` | Org + today's LLM usage |
| `GET/POST` | `/api/orgs/:orgId/cohorts` | List / create cohort |
| `GET` | `/api/orgs/:orgId/cohorts/:cohortId` | Members + analytics |
| `POST` | `/api/orgs/:orgId/cohorts/:cohortId/members` | `{ emails: [] }` |
| `GET` | `/api/orgs/:orgId/cohorts/:cohortId/export` | CSV download |
| `GET` | `/api/orgs/:orgId/coach` | Mentee readiness list |
| `POST` | `/api/cohorts/accept-invites` | Link pending invites by email |

## UI

- `/org` — create org, list memberships
- `/org/:orgId` — cohorts, coach view
- `/org/:orgId/cohorts/:cohortId` — analytics, invites, CSV

## Key files

```text
db/migrations/008_partners.sql
lib/partners/
app/api/orgs/
app/org/
components/partners/
```

## Exit criteria

- [ ] Run migration `008`
- [ ] Create org → cohort → invite 10 emails
- [ ] Students log in (matching email) → appear as active
- [ ] Cohort page shows avg readiness without answer content
- [ ] Export CSV

## Next

[Phase 8+ — Vision](../../planned/README.md#phase-8-vision)
