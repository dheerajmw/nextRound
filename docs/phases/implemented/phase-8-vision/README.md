# Phase 8+ — Long-term vision (shipped MVP)

| | |
|--|--|
| **Status** | ✅ MVP implemented |
| **Migration** | `db/migrations/009_vision.sql` |
| **Depends on** | Phases 4–7 |
| **Full roadmap** | [Phase 8+ in phaseWiseArchitecture](../../../phaseWiseArchitecture.md#phase-8--long-term-vision) |

## Initiatives delivered (MVP)

| Initiative | Implementation |
|------------|----------------|
| **Video / delivery analysis** | Consent + transcript-based LLM analysis → `media_analysis` |
| **Emotion / confidence** | Scores in `analysis` JSON (confidence, delivery, emotion summary) |
| **Recruiter benchmarking** | Percentile vs cohort or global users on dashboard |
| **Company simulations** | `company_profiles` + seed data; picker on new interview |
| **Resume-aware (all questions)** | Resume/skills injected on every question when profile has skills |
| **Peer mock interviews** | Join-code rooms; linked interviews + peer feedback API |
| **AI career coach** | `/coach` chat with `coach_memory` persistence |

## Setup

1. Migration `009_vision.sql`
2. `npm run seed:phase8` (service role) for company profiles

## Routes

| Path | Purpose |
|------|---------|
| `/coach` | Career coach chat |
| `/peer` | Peer mock rooms |
| `GET /api/readiness/benchmark` | Percentile rank |
| `GET /api/companies` | Company list |
| `POST /api/interviews/:id/media` | Delivery analysis |
| `POST /api/peer/sessions` | Create room |
| `POST /api/peer/join` | Join room |
| `POST /api/coach` | Coach message |

## Not in MVP (future hardening)

- WebRTC / LiveKit live video rooms
- Supabase Storage video upload pipeline
- Full vision-model frame analysis
- White-label subdomains (noted in Phase 7)

## Exit criteria

- [ ] Migration 009 + seed phase 8
- [ ] Start interview with Google/Amazon company pack
- [ ] Complete interview → analyze delivery
- [ ] See benchmark percentile on dashboard
- [ ] Peer room: create code, partner joins, both interview
- [ ] Coach remembers context across messages
