-- Phase 3: readiness snapshots + query indexes

create table public.user_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null default (current_date),
  metrics jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index user_readiness_snapshots_user_id_idx
  on public.user_readiness_snapshots (user_id, snapshot_date desc);

-- Supporting indexes for dashboard aggregates (idempotent)
create index if not exists interview_sessions_user_created_idx
  on public.interview_sessions (user_id, created_at desc);

create index if not exists evaluations_session_id_created_idx
  on public.evaluations (session_id, created_at);

alter table public.user_readiness_snapshots enable row level security;

create policy "Users can view own readiness snapshots"
  on public.user_readiness_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert own readiness snapshots"
  on public.user_readiness_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can update own readiness snapshots"
  on public.user_readiness_snapshots for update
  using (auth.uid() = user_id);
