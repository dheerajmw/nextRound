-- Phase 6: question bank, role templates (O*NET-style), profile resume/skills

create table public.role_templates (
  role_key text primary key,
  display_name text not null,
  competencies jsonb not null default '[]'::jsonb,
  rubric_weights jsonb not null,
  onet_codes text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.role_templates is
  'Role-specific competencies and evaluation rubric weights (O*NET-informed)';

create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  role_key text,
  mode public.interview_mode not null,
  difficulty public.interview_difficulty not null default 'medium',
  text text not null,
  tags text[] not null default '{}',
  source text not null default 'curated',
  created_at timestamptz not null default now()
);

create index question_bank_mode_difficulty_idx
  on public.question_bank (mode, difficulty);
create index question_bank_role_key_idx
  on public.question_bank (role_key) where role_key is not null;

alter table public.profiles
  add column if not exists resume_url text,
  add column if not exists skills jsonb;

comment on column public.profiles.skills is
  'Extracted skills: { "items": string[], "summary"?: string, "extracted_at": string }';

alter table public.question_bank enable row level security;
alter table public.role_templates enable row level security;

create policy "Authenticated users can read question bank"
  on public.question_bank for select
  to authenticated
  using (true);

create policy "Authenticated users can read role templates"
  on public.role_templates for select
  to authenticated
  using (true);
