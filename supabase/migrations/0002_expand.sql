-- ============================================================================
-- MedMate AI — Phase 2 schema expansion
-- Apply with `supabase db push` or paste into the Supabase SQL editor.
-- ============================================================================

-- ─── Extend summary_type enum with new values ────────────────────────────────
-- Postgres doesn't allow removing enum values, so we only ADD new ones.
ALTER TYPE summary_type ADD VALUE IF NOT EXISTS 'flashcards';
ALTER TYPE summary_type ADD VALUE IF NOT EXISTS 'high_yield_points';
ALTER TYPE summary_type ADD VALUE IF NOT EXISTS 'exam_notes';
ALTER TYPE summary_type ADD VALUE IF NOT EXISTS 'one_page_summary';
ALTER TYPE summary_type ADD VALUE IF NOT EXISTS 'active_recall_notes';

-- ─── profiles — new columns ──────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college_name            text,
  ADD COLUMN IF NOT EXISTS university_name         text,
  ADD COLUMN IF NOT EXISTS course                  text,
  ADD COLUMN IF NOT EXISTS degree_program          text,
  ADD COLUMN IF NOT EXISTS year_of_study           smallint,
  ADD COLUMN IF NOT EXISTS semester                smallint,
  ADD COLUMN IF NOT EXISTS expected_graduation_year smallint,
  ADD COLUMN IF NOT EXISTS onboarding_complete     boolean not null default false,
  ADD COLUMN IF NOT EXISTS study_preferences       jsonb not null default '{}',
  ADD COLUMN IF NOT EXISTS ai_preferences          jsonb not null default '{}',
  ADD COLUMN IF NOT EXISTS preferred_subjects      jsonb not null default '[]';

-- ─── study_reminders ─────────────────────────────────────────────────────────
create table if not exists public.study_reminders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  reminder_type    text not null check (reminder_type in ('one_time', 'recurring')),
  scheduled_for    timestamptz,
  recurrence       text check (recurrence in ('hourly','2h','4h','6h','daily','weekly','monthly','custom')),
  interval_minutes integer,
  enabled          boolean not null default true,
  last_fired_at    timestamptz,
  next_fire_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.study_reminders enable row level security;

do $$ begin
  create policy "study_reminders_owner"
    on public.study_reminders for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create index if not exists study_reminders_user_next
  on public.study_reminders (user_id, next_fire_at)
  where enabled = true;

-- ─── college_intel ────────────────────────────────────────────────────────────
create table if not exists public.college_intel (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  college_name     text,
  university_name  text,
  course           text,
  year_of_study    smallint,
  intel            jsonb not null default '{}',
  generated_at     timestamptz not null default now(),
  constraint college_intel_user_unique unique (user_id)
);

alter table public.college_intel enable row level security;

do $$ begin
  create policy "college_intel_owner"
    on public.college_intel for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
