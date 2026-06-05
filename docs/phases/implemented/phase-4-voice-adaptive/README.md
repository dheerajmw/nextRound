# Phase 4 — Voice & adaptive interviews

| | |
|--|--|
| **Status** | ✅ Implemented |
| **Migration** | `db/migrations/005_voice_adaptive.sql` |
| **Depends on** | [Phase 2](../phase-2-evaluation/) |
| **Full roadmap** | [Phase 4 in full-roadmap](../../../phaseWiseArchitecture.md#phase-4--voice--adaptive-interviews) |

## Goal

Realistic interviews with **voice in/out**, **adaptive follow-ups**, and **difficulty** tuned from past performance.

## Scope

- Web Speech API (STT) + Speech Synthesis (TTS)
- Transcript stored with answers; filler detection uses transcript in evaluation
- Adaptive follow-ups on vague / low-structure answers
- Difficulty (`easy` / `medium` / `hard`) from last 3 session scores
- All modes enabled: behavioral, HR, PM, technical

## Session config

| Field | Description |
|-------|-------------|
| `adaptive` | Enable follow-up questions |
| `difficulty` | LLM question hardness |
| `input_mode` | `text`, `voice`, or `both` |
| `max_followups_per_topic` | Follow-ups per main question (default 1) |
| `main_questions_completed` | Primary questions answered (0–5) |

## API

| Method | Route | Notes |
|--------|-------|-------|
| `POST` | `/api/interviews` | `adaptive`, `input_mode`, all modes |
| `POST` | `/api/interviews/:id/turns` | `answer`, `transcript`, optional `audio_url` |

## Key files

```text
db/migrations/005_voice_adaptive.sql
lib/interview/adaptive-policy.ts
lib/interview/difficulty.ts
lib/interview/process-answer.ts
lib/interview/generate-follow-up.ts
hooks/use-speech.ts
components/interview/voice-answer-controls.tsx
components/interview/question-speaker.tsx
```

## Exit criteria

- [ ] Migration `005` applied
- [ ] Voice interview completable in Chrome/Edge
- [ ] At least one adaptive follow-up appears on a vague/short answer
- [ ] HR / PM / technical modes start successfully

## Next (planned)

[Phase 5 — Personalization](../phase-5-personalization/)
