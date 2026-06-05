-- Phase 4: voice fields, adaptive interview config

create type public.interview_difficulty as enum ('easy', 'medium', 'hard');
create type public.interview_input_mode as enum ('text', 'voice', 'both');
create type public.interview_turn_type as enum ('primary', 'follow_up');

alter table public.interview_sessions
  add column if not exists adaptive boolean not null default true,
  add column if not exists difficulty public.interview_difficulty not null default 'medium',
  add column if not exists input_mode public.interview_input_mode not null default 'both',
  add column if not exists max_followups_per_topic int not null default 1,
  add column if not exists main_questions_completed int not null default 0,
  add column if not exists current_topic_followups int not null default 0;

alter table public.interview_turns
  add column if not exists transcript text,
  add column if not exists turn_type public.interview_turn_type not null default 'primary',
  add column if not exists audio_url text,
  add column if not exists primary_question_index int;

comment on column public.interview_turns.primary_question_index is
  'Which main question (0-based) this turn belongs to; follow-ups share the same index';
