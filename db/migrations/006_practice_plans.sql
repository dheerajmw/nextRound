-- Phase 5: practice plans and tasks (personalization engine)

create type public.practice_task_type as enum ('retry', 'exercise', 'pathway');
create type public.practice_task_status as enum (
  'pending',
  'in_progress',
  'completed',
  'skipped'
);

create table public.practice_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  summary text not null,
  pathway_step text,
  created_at timestamptz not null default now()
);

create unique index practice_plans_session_id_idx on public.practice_plans (session_id);
create index practice_plans_user_id_idx on public.practice_plans (user_id, created_at desc);

create table public.practice_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.practice_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.practice_task_type not null,
  title text not null,
  instructions text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.practice_task_status not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  retry_session_id uuid references public.interview_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index practice_tasks_user_status_idx
  on public.practice_tasks (user_id, status, created_at desc);
create index practice_tasks_plan_id_idx on public.practice_tasks (plan_id);

alter table public.interview_sessions
  add column if not exists question_limit int not null default 5,
  add column if not exists practice_task_id uuid references public.practice_tasks (id) on delete set null;

comment on column public.interview_sessions.question_limit is
  'Primary questions before session completes; practice retries use 2';

create trigger practice_tasks_updated_at
  before update on public.practice_tasks
  for each row execute function public.set_updated_at();

alter table public.practice_plans enable row level security;
alter table public.practice_tasks enable row level security;

create policy "Users can view own practice plans"
  on public.practice_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own practice plans"
  on public.practice_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can view own practice tasks"
  on public.practice_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own practice tasks"
  on public.practice_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own practice tasks"
  on public.practice_tasks for update
  using (auth.uid() = user_id);
