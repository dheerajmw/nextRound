-- Phase 1: interview turns + session target_role snapshot

alter table public.interview_sessions
  add column if not exists target_role text;

create table public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  turn_index int not null check (turn_index >= 0),
  question text not null,
  rationale text,
  answer_text text,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  unique (session_id, turn_index)
);

create index interview_turns_session_id_idx on public.interview_turns (session_id);
create index interview_turns_session_turn_idx on public.interview_turns (session_id, turn_index);

alter table public.interview_turns enable row level security;

create policy "Users can view own interview turns"
  on public.interview_turns for select
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_turns.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can insert own interview turns"
  on public.interview_turns for insert
  with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_turns.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can update own interview turns"
  on public.interview_turns for update
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_turns.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can delete own interview turns"
  on public.interview_turns for delete
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_turns.session_id
        and s.user_id = auth.uid()
    )
  );
