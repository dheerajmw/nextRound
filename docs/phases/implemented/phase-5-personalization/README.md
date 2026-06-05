# Phase 5 — Personalization engine

| | |
|--|--|
| **Status** | ✅ Implemented |
| **Migration** | `db/migrations/006_practice_plans.sql` |
| **Depends on** | [Phase 2](../phase-2-evaluation/) (evaluations) |
| **Full roadmap** | [Phase 5 in full-roadmap](../../../phaseWiseArchitecture.md#phase-5--personalization-engine) |

## Goal

Turn interview feedback into **actionable** next steps: retries, drills, and pathway progress—not generic tips.

## Scope

- After a completed scored interview, auto-generate a **practice plan** (LLM + fallback)
- Task types: **retry** (weak question), **exercise** (STAR drill, elevator pitch), **pathway** milestone
- Dashboard **improvement inbox** with mark-done and retry launch
- Retry opens a **2-question** mini-session with the original question pre-filled

## Database

| Table | Purpose |
|-------|---------|
| `practice_plans` | One plan per completed session (`summary`, `pathway_step`) |
| `practice_tasks` | Inbox items (`type`, `payload`, `status`, `retry_session_id`) |

`interview_sessions.question_limit` — `5` default, `2` for practice retries.

## API

| Method | Route | Notes |
|--------|-------|-------|
| `GET` | `/api/practice/tasks` | Open tasks + latest pathway |
| `PATCH` | `/api/practice/tasks/:id` | `status`: `completed` \| `skipped` \| `pending` |
| `POST` | `/api/practice/tasks/:id/start` | Start or resume retry mini-session |

Plans are created automatically in `lib/interview/process-answer.ts` after evaluation (skipped for retry sessions).

## Key files

```text
db/migrations/006_practice_plans.sql
lib/personalization/
prompts/v1/generate-practice-plan.ts
components/dashboard/practice-inbox.tsx
components/dashboard/practice-task-actions.tsx
app/api/practice/
```

## Analytics

| Event | When |
|-------|------|
| `practice_task_completed` | User marks a task done |
| `practice_retry_started` | User starts a retry mini-session |

## Exit criteria

- [ ] Run migration `006`
- [ ] Complete a 5-question mock with evaluations
- [ ] Dashboard shows ≥2 open tasks in Improvement inbox
- [ ] Mark an exercise complete; start a retry → 2-question session

## Next

[Phase 6 — Data enrichment](../../planned/README.md#phase-6--data-enrichment--role-depth)
