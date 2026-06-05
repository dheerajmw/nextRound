-- Phase 2: per-turn evaluations + session aggregate scores

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  turn_id uuid not null unique references public.interview_turns (id) on delete cascade,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  scores jsonb not null,
  feedback jsonb not null,
  prompt_version text not null default 'v1',
  model text not null,
  provider text not null,
  created_at timestamptz not null default now()
);

create index evaluations_session_id_idx on public.evaluations (session_id);
create index evaluations_turn_id_idx on public.evaluations (turn_id);

alter table public.interview_sessions
  add column if not exists session_scores jsonb;

comment on column public.interview_sessions.session_scores is
  'Aggregated scores (avg per dimension + overall) after Phase 2 evaluation';

alter table public.evaluations enable row level security;

create policy "Users can view own evaluations"
  on public.evaluations for select
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = evaluations.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can insert own evaluations"
  on public.evaluations for insert
  with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = evaluations.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can update own evaluations"
  on public.evaluations for update
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = evaluations.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can delete own evaluations"
  on public.evaluations for delete
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = evaluations.session_id
        and s.user_id = auth.uid()
    )
  );
