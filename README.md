# nextRound

AI-powered interview readiness platform.

**Documentation:** [docs/README.md](./docs/README.md) · [Problem statement](./docs/problemsStatement.md) · [Phase-wise architecture](./docs/phaseWiseArchitecture.md) · [Implemented phases](./docs/phases/implemented/)

## Phase 8+ (current) — full roadmap complete

**Vision MVP:** company-specific interviews, delivery/confidence analysis, recruiter benchmarking, peer mock rooms, AI career coach with memory, resume-aware questions throughout.

**Requires migrations 001–009**, LLM keys, `npm run seed:phase6` and `npm run seed:phase8`.

### Quick links

- `/coach` — career coach
- `/peer` — peer mock rooms
- Dashboard — benchmark percentile
- New interview — company simulation dropdown

## Phase 7

**Partners & scale:** organizations, cohorts, CSV export, org LLM caps.

## Phase 6

**Data enrichment:** question bank, role templates, resume skills, PM questions from bank.

## Phase 5

**Personalization engine:** practice plans, retries, improvement inbox on the dashboard.

## Phase 4

**Voice & adaptive** interviews: Web Speech STT/TTS, all interview modes, adaptive follow-ups, difficulty from past scores.

## Phase 0

Foundation: Next.js App Router, Supabase auth, database skeleton, LLM client, PostHog bootstrap, CI.

### Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project
- Optional: [Google AI Studio](https://aistudio.google.com) API key, [OpenRouter](https://openrouter.ai) key, [PostHog](https://posthog.com) project

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Apply database migrations in the Supabase SQL Editor (in order):

   ```text
   db/migrations/001_initial.sql
   db/migrations/002_interview_turns.sql
   db/migrations/003_evaluations.sql
   db/migrations/004_readiness.sql
   db/migrations/005_voice_adaptive.sql
   db/migrations/006_practice_plans.sql
   db/migrations/007_data_enrichment.sql
   db/migrations/008_partners.sql
   db/migrations/009_vision.sql
   ```

   Then seed catalog data (service role):

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=... npm run seed:phase6
   SUPABASE_SERVICE_ROLE_KEY=... npm run seed:phase8
   ```

4. In Supabase **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (or your production URL)
   - Redirect URLs: `http://localhost:3000/auth/callback`

5. Enable **Email** auth; optionally enable **Google** OAuth.

   **Local dev (avoids “email rate limit exceeded”):** In Supabase → **Authentication** → **Providers** → **Email**, turn off **Confirm email**. Sign-up then creates a session immediately without sending mail. For production, re-enable confirmation or use custom SMTP (**Authentication** → **Emails**).

6. Run the dev server:

   ```bash
   npm run dev
   ```

7. Verify Phase 0 exit criteria:
   - Sign up / log in → land on `/`
   - [GET /api/health](http://localhost:3000/api/health) returns `{ ok: true }`
   - On dashboard, **Test LLM connection** (requires `GEMINI_API_KEY` and/or `OPENROUTER_API_KEY`)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

### Project structure

```text
app/              # Routes (pages, API, auth callback)
components/       # UI, auth forms, PostHog provider
lib/              # Supabase, LLM, interview engine, analytics
prompts/          # Versioned LLM prompts
db/migrations/    # SQL schema
docs/             # Product & architecture docs
```

### Deploy (Vercel)

Repo: [github.com/dheerajmw/nextRound](https://github.com/dheerajmw/nextRound)

1. Import the repo on [Vercel](https://vercel.com) (Next.js is auto-detected; `vercel.json` is included).
2. **Environment variables** (Project → Settings → Environment Variables):

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
   | `NEXT_PUBLIC_APP_URL` | Yes | e.g. `https://your-app.vercel.app` |
   | `GEMINI_API_KEY` | Yes* | Primary LLM |
   | `OPENROUTER_API_KEY` | Yes* | Fallback LLM |
   | `NEXT_PUBLIC_POSTHOG_KEY` | No | Analytics |
   | `NEXT_PUBLIC_POSTHOG_HOST` | No | Default `https://us.i.posthog.com` |

   *At least one LLM key is required for mock interviews.

3. Apply Supabase migrations `001`–`009` (SQL Editor), then seed locally if needed (`npm run seed:phase6`, `seed:phase8`).
4. Supabase → **Authentication → URL Configuration**:
   - Site URL: your Vercel domain
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
5. Deploy. Verify `GET /api/health` and sign up → land on `/`.
