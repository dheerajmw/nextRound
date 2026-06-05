-- Phase 0: profiles + interview_sessions skeleton
-- Apply via Supabase SQL Editor or: supabase db push

-- Enums
create type public.interview_mode as enum (
  'behavioral',
  'hr',
  'pm',
  'technical'
);

create type public.interview_session_status as enum (
  'draft',
  'in_progress',
  'completed',
  'cancelled'
);

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  target_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Interview sessions (used from Phase 1)
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.interview_session_status not null default 'draft',
  mode public.interview_mode not null default 'behavioral',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index interview_sessions_user_id_idx on public.interview_sessions (user_id);
create index interview_sessions_created_at_idx on public.interview_sessions (created_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger interview_sessions_updated_at
  before update on public.interview_sessions
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.interview_sessions enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can view own interview sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own interview sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interview sessions"
  on public.interview_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own interview sessions"
  on public.interview_sessions for delete
  using (auth.uid() = user_id);
