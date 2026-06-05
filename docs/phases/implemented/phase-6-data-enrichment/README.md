# Phase 6 — Data enrichment & role depth

| | |
|--|--|
| **Status** | ✅ Implemented |
| **Migration** | `db/migrations/007_data_enrichment.sql` |
| **Depends on** | [Phase 1](../phase-1-text-interviews/) |
| **Full roadmap** | [Phase 6 in phaseWiseArchitecture](../../../phaseWiseArchitecture.md#phase-6--data-enrichment--role-depth) |

## Goal

Ground interview questions and scoring in a **curated question bank**, **O*NET-style role templates**, and optional **resume-derived skills**.

## Scope

- `question_bank` — mode, role_key, difficulty, tags (seeded via ETL)
- `role_templates` — competencies, rubric weights, O*NET codes
- `profiles.skills` — LLM extraction from pasted resume text
- PM interviews **pull from the bank** when a match exists
- Role-specific evaluation rubric weights in prompts

## Setup

1. Run migration `007_data_enrichment.sql`
2. Seed catalog (service role required):

   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:phase6
   ```

## API

| Method | Route | Notes |
|--------|-------|-------|
| `GET` | `/api/profile/resume` | Current extracted skills |
| `POST` | `/api/profile/resume` | `{ "resume_text": "..." }` → skills jsonb |

## Key files

```text
db/migrations/007_data_enrichment.sql
scripts/etl/seed-phase6.mjs
scripts/etl/data/question-bank.json
scripts/etl/data/role-templates.json
lib/enrichment/
components/dashboard/profile-resume-card.tsx
```

## Exit criteria

- [ ] Migration + `npm run seed:phase6`
- [ ] Start **PM** interview → first question from bank (check rationale mentions “question bank”)
- [ ] Paste resume on dashboard → extract skills → new interview Q1 references skills

## Next

[Phase 7 — Partners & scale](../../planned/README.md#phase-7--partners--scale)
