-- ============================================================================
-- MedMate AI — initial schema
-- Tables, enums, Row Level Security, indexes, triggers and storage.
-- Apply with `supabase db push` or paste into the Supabase SQL editor.
-- Every user-owned table enables RLS so a user can only ever touch their rows.
-- ============================================================================

-- Needed for gen_random_uuid() on older Postgres; no-op if already present.
create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type task_status   as enum ('pending', 'in_progress', 'completed');
  create type task_priority as enum ('low', 'medium', 'high');
  create type recurrence    as enum ('none', 'daily', 'weekly', 'monthly');
  create type difficulty     as enum ('easy', 'medium', 'hard');
  create type question_type  as enum ('mcq', 'true_false', 'short_answer');
  create type summary_type   as enum ('quick', 'revision', 'cheat_sheet', 'key_concepts', 'definitions');
exception
  when duplicate_object then null;
end $$;

-- ─── Shared updated_at trigger ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles  (1:1 with auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  full_name          text,
  avatar_url         text,
  exam_date          date,
  study_goal         text,
  daily_goal_minutes integer not null default 120,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ============================================================================
-- tasks
-- ============================================================================
create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  description         text,
  subject             text,
  status              task_status not null default 'pending',
  priority            task_priority not null default 'medium',
  due_date            timestamptz,
  recurrence          recurrence not null default 'none',
  recurrence_interval integer not null default 1,
  reminder_minutes    integer,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists tasks_user_due_idx    on public.tasks (user_id, due_date);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status);

-- ============================================================================
-- notes  (Phase 1: created from pasted text; RAG-ready via content_text)
-- ============================================================================
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  subject      text,
  topic        text,
  title        text not null,
  file_path    text,
  file_type    text,
  content_text text,
  size_bytes   bigint,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists notes_user_idx         on public.notes (user_id);
create index if not exists notes_user_subject_idx on public.notes (user_id, subject);

-- ============================================================================
-- summaries
-- ============================================================================
create table if not exists public.summaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  note_id     uuid references public.notes(id) on delete set null,
  title       text,
  subject     text,
  source_text text,
  type        summary_type not null,
  content     text not null,
  model       text,
  created_at  timestamptz not null default now()
);
create index if not exists summaries_user_idx on public.summaries (user_id, created_at desc);

-- ============================================================================
-- quizzes + questions + attempts
-- ============================================================================
create table if not exists public.quizzes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  note_id       uuid references public.notes(id) on delete set null,
  title         text not null,
  subject       text,
  difficulty    difficulty not null default 'medium',
  num_questions integer not null,
  timed         boolean not null default false,
  time_limit_sec integer,
  source_text   text,
  model         text,
  created_at    timestamptz not null default now()
);
create index if not exists quizzes_user_idx on public.quizzes (user_id, created_at desc);

create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references public.quizzes(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  position       integer not null default 0,
  type           question_type not null,
  prompt         text not null,
  options        jsonb,
  correct_answer text not null,
  explanation    text,
  created_at     timestamptz not null default now()
);
create index if not exists questions_quiz_idx on public.questions (quiz_id, position);

create table if not exists public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  score         integer not null default 0,
  total         integer not null default 0,
  accuracy      numeric(5,2) not null default 0,
  time_taken_sec integer,
  answers       jsonb,
  completed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.quiz_attempts (user_id, completed_at desc);
create index if not exists attempts_quiz_idx on public.quiz_attempts (quiz_id);

-- ============================================================================
-- study_plans
-- ============================================================================
create table if not exists public.study_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text,
  exam_date     date not null,
  subjects      jsonb not null,
  hours_per_day numeric(4,1) not null,
  plan          jsonb not null,
  model         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists plans_user_idx on public.study_plans (user_id, created_at desc);

-- ============================================================================
-- revisions  (SM-2 spaced repetition)
-- ============================================================================
create table if not exists public.revisions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  note_id       uuid references public.notes(id) on delete set null,
  subject       text not null,
  topic         text,
  last_reviewed timestamptz,
  next_review   date not null default current_date,
  interval_days integer not null default 1,
  ease_factor   numeric(4,2) not null default 2.5,
  repetitions   integer not null default 0,
  last_rating   difficulty,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists revisions_user_next_idx on public.revisions (user_id, next_review);

-- ============================================================================
-- flashcards
-- ============================================================================
create table if not exists public.flashcards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  note_id       uuid references public.notes(id) on delete set null,
  subject       text,
  front         text not null,
  back          text not null,
  difficulty    difficulty not null default 'medium',
  next_review   date default current_date,
  interval_days integer not null default 1,
  ease_factor   numeric(4,2) not null default 2.5,
  repetitions   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists flashcards_user_idx on public.flashcards (user_id, next_review);

-- ============================================================================
-- notifications
-- ============================================================================
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  task_id       uuid references public.tasks(id) on delete cascade,
  type          text not null default 'reminder',
  title         text,
  message       text not null,
  scheduled_for timestamptz,
  sent          boolean not null default false,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_sched_idx on public.notifications (user_id, scheduled_for, sent);

-- ============================================================================
-- subject_analytics  (per-subject rollups)
-- ============================================================================
create table if not exists public.subject_analytics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  subject       text not null,
  accuracy      numeric(5,2),
  study_minutes integer not null default 0,
  quiz_count    integer not null default 0,
  last_studied  timestamptz,
  is_weak       boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (user_id, subject)
);
create index if not exists subject_analytics_user_idx on public.subject_analytics (user_id);

-- ============================================================================
-- study_sessions  (source of truth for study-hours stats & trends)
-- ============================================================================
create table if not exists public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  subject          text,
  duration_minutes integer not null,
  source           text not null default 'manual',
  task_id          uuid references public.tasks(id) on delete set null,
  studied_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index if not exists study_sessions_user_idx on public.study_sessions (user_id, studied_at desc);

-- ============================================================================
-- chat_sessions + chat_messages  (RAG — schema only in Phase 1)
-- ============================================================================
create table if not exists public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  note_id    uuid references public.notes(id) on delete set null,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_sessions_user_idx on public.chat_sessions (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);

-- ─── updated_at triggers ─────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','tasks','notes','study_plans','revisions','flashcards',
    'subject_analytics','chat_sessions'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- Enable on every table, then add owner-only policies.
-- profiles is keyed on id; everything else on user_id.
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.tasks             enable row level security;
alter table public.notes             enable row level security;
alter table public.summaries         enable row level security;
alter table public.quizzes           enable row level security;
alter table public.questions         enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.study_plans       enable row level security;
alter table public.revisions         enable row level security;
alter table public.flashcards        enable row level security;
alter table public.notifications     enable row level security;
alter table public.subject_analytics enable row level security;
alter table public.study_sessions    enable row level security;
alter table public.chat_sessions     enable row level security;
alter table public.chat_messages     enable row level security;

-- profiles: keyed on id
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- All other tables: owner-only via user_id.
do $$
declare t text;
begin
  foreach t in array array[
    'tasks','notes','summaries','quizzes','questions','quiz_attempts',
    'study_plans','revisions','flashcards','notifications','subject_analytics',
    'study_sessions','chat_sessions','chat_messages'
  ] loop
    execute format('drop policy if exists "%s_owner" on public.%I;', t, t);
    execute format(
      'create policy "%s_owner" on public.%I
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t, t);
  end loop;
end $$;

-- ============================================================================
-- Storage: private "notes" bucket. Files live under <user_id>/... so the
-- first path segment must match the requesting user.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('notes', 'notes', false)
on conflict (id) do nothing;

drop policy if exists "notes_storage_owner" on storage.objects;
create policy "notes_storage_owner" on storage.objects
  for all
  using (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text);
