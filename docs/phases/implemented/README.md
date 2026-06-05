# Implemented phases

Phases **0–8+** are shipped in the codebase. Apply database migrations in order before using each phase.

## Migration order

| Order | Migration | Phase | Required for |
|-------|-----------|-------|----------------|
| 1 | `db/migrations/001_initial.sql` | 0 | Auth, profiles, sessions |
| 2 | `db/migrations/002_interview_turns.sql` | 1 | Mock interviews |
| 3 | `db/migrations/003_evaluations.sql` | 2 | Scores & feedback |
| 4 | `db/migrations/004_readiness.sql` | 3 | Readiness dashboard |
| 5 | `db/migrations/005_voice_adaptive.sql` | 4 | Voice + adaptive interviews |
| 6 | `db/migrations/006_practice_plans.sql` | 5 | Practice plans & task inbox |
| 7 | `db/migrations/007_data_enrichment.sql` | 6 | Question bank, role templates, resume skills |
| 8 | `db/migrations/008_partners.sql` | 3 | Organizations, cohorts, partner analytics |
| 9 | `db/migrations/009_vision.sql` | 7 | Vision: media, peer, coach, companies |

Run each file in the Supabase **SQL Editor** (or CLI), one at a time.

## Phase guides

| Phase | Folder | Summary |
|-------|--------|---------|
| **0** | [phase-0-foundation/](./phase-0-foundation/) | Next.js, Supabase auth, LLM client, CI |
| **1** | [phase-1-text-interviews/](./phase-1-text-interviews/) | 5-question text mock interviews |
| **2** | [phase-2-evaluation/](./phase-2-evaluation/) | Per-answer & session AI scoring |
| **3** | [phase-3-readiness-dashboard/](./phase-3-readiness-dashboard/) | Trends, themes, readiness index |
| **4** | [phase-4-voice-adaptive/](./phase-4-voice-adaptive/) | Voice STT/TTS, adaptive follow-ups |
| **5** | [phase-5-personalization/](./phase-5-personalization/) | Practice plans, retries, improvement inbox |
| **6** | [phase-6-data-enrichment/](./phase-6-data-enrichment/) | Question bank, O*NET rubrics, resume skills |
| **7** | [phase-7-partners/](./phase-7-partners/) | Orgs, cohorts, coach view, CSV export |
| **8+** | [phase-8-vision/](./phase-8-vision/) | Media analysis, peer mock, career coach, benchmarking |

## Analytics events (cumulative)

| Event | Phase |
|-------|-------|
| `signup`, `login` | 0 |
| `interview_started`, `interview_completed` | 1 |
| `evaluation_received` | 2 |
| `dashboard_viewed`, `session_reviewed`, `readiness_index_band` | 3 |
| `adaptive_followup` | 4 |
| `practice_task_completed`, `practice_retry_started` | 5 |
| `resume_skills_extracted`, `question_from_bank` | 6 |
| `cohort_invite_sent`, `org_created` | 7 |
| `media_analysis_completed`, `peer_session_created`, `coach_message_sent` | 8+ |

Defined in `lib/analytics/events.ts`.

## Environment

See project [README.md](../../../README.md) and `.env.example`.
