-- Phase 8+: long-term vision — media, companies, peer, coach

create type public.media_type as enum ('video', 'audio');
create type public.peer_session_status as enum (
  'open',
  'active',
  'completed',
  'cancelled'
);

-- Company-specific interview simulations
create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  interview_focus text,
  question_pack jsonb not null default '[]'::jsonb,
  rubric_emphasis jsonb,
  created_at timestamptz not null default now()
);

alter table public.interview_sessions
  add column if not exists company_profile_id uuid
    references public.company_profiles (id) on delete set null;

-- Video/audio analysis (consent required)
create table public.media_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  turn_id uuid references public.interview_turns (id) on delete set null,
  media_type public.media_type not null default 'video',
  storage_path text,
  consent_at timestamptz not null,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index media_analysis_session_id_idx on public.media_analysis (session_id);

alter table public.profiles
  add column if not exists media_consent_at timestamptz;

-- Peer mock interviews (async join-by-code flow)
create table public.peer_sessions (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  partner_user_id uuid references auth.users (id) on delete set null,
  join_code text not null unique,
  status public.peer_session_status not null default 'open',
  mode public.interview_mode not null default 'behavioral',
  target_role text,
  host_session_id uuid references public.interview_sessions (id) on delete set null,
  partner_session_id uuid references public.interview_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.peer_feedback (
  id uuid primary key default gen_random_uuid(),
  peer_session_id uuid not null references public.peer_sessions (id) on delete cascade,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  ratings jsonb not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (peer_session_id, from_user_id)
);

-- AI career coach
create table public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Career coaching',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index coach_messages_thread_id_idx on public.coach_messages (thread_id, created_at);

create table public.coach_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  memory_key text not null,
  memory_value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, memory_key)
);

create trigger peer_sessions_updated_at
  before update on public.peer_sessions
  for each row execute function public.set_updated_at();

create trigger coach_threads_updated_at
  before update on public.coach_threads
  for each row execute function public.set_updated_at();

alter table public.company_profiles enable row level security;
alter table public.media_analysis enable row level security;
alter table public.peer_sessions enable row level security;
alter table public.peer_feedback enable row level security;
alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_memory enable row level security;

create policy "Anyone authenticated can read company profiles"
  on public.company_profiles for select
  to authenticated
  using (true);

create policy "Users manage own media analysis"
  on public.media_analysis for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view peer sessions they participate in"
  on public.peer_sessions for select
  using (auth.uid() = host_user_id or auth.uid() = partner_user_id);

create policy "Users create peer sessions"
  on public.peer_sessions for insert
  with check (auth.uid() = host_user_id);

create policy "Participants update peer sessions"
  on public.peer_sessions for update
  using (auth.uid() = host_user_id or auth.uid() = partner_user_id);

create policy "Participants view peer feedback"
  on public.peer_feedback for select
  using (
    auth.uid() = from_user_id
    or auth.uid() = to_user_id
    or exists (
      select 1 from public.peer_sessions ps
      where ps.id = peer_feedback.peer_session_id
        and (ps.host_user_id = auth.uid() or ps.partner_user_id = auth.uid())
    )
  );

create policy "Users submit peer feedback"
  on public.peer_feedback for insert
  with check (auth.uid() = from_user_id);

create policy "Users manage own coach threads"
  on public.coach_threads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage messages in own threads"
  on public.coach_messages for all
  using (
    exists (
      select 1 from public.coach_threads t
      where t.id = coach_messages.thread_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coach_threads t
      where t.id = coach_messages.thread_id and t.user_id = auth.uid()
    )
  );

create policy "Users manage own coach memory"
  on public.coach_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
