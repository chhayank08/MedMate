-- ============================================================================
-- Multi-Domain Learning Platform — Alter Existing Tables
-- Task 1.3: Alter existing tables for multi-domain support
-- Requirements: 3.3, 4.4, 13.1, 14.1, 14.2, 14.3, 16.1, 16.4
-- ============================================================================

-- ─── profiles table updates ─────────────────────────────────────────────────
-- Add UI preference columns
alter table public.profiles 
  add column if not exists theme varchar(20) default 'system' 
    check (theme in ('light', 'dark', 'system')),
  add column if not exists language varchar(5) default 'en' 
    check (language in ('en', 'es', 'fr', 'de')),
  add column if not exists display_density varchar(20) default 'standard' 
    check (display_density in ('compact', 'standard', 'comfortable')),
  add column if not exists notification_email boolean default true,
  add column if not exists notification_push boolean default true,
  add column if not exists notification_in_app boolean default true;

-- ─── quizzes table updates ──────────────────────────────────────────────────
-- Add domain and subject tagging
alter table public.quizzes 
  add column if not exists domain_id uuid references public.domains(domain_id) on delete set null,
  add column if not exists subject_id uuid references public.subjects(subject_id) on delete set null;

create index if not exists idx_quizzes_domain on public.quizzes(domain_id);
create index if not exists idx_quizzes_subject on public.quizzes(subject_id);

-- ─── summaries table updates ────────────────────────────────────────────────
-- Add domain and subject tagging
alter table public.summaries 
  add column if not exists domain_id uuid references public.domains(domain_id) on delete set null,
  add column if not exists subject_id uuid references public.subjects(subject_id) on delete set null;

create index if not exists idx_summaries_domain on public.summaries(domain_id);
create index if not exists idx_summaries_subject on public.summaries(subject_id);

-- ─── tasks table updates ────────────────────────────────────────────────────
-- Add optional domain and subject associations
alter table public.tasks 
  add column if not exists domain_id uuid references public.domains(domain_id) on delete set null,
  add column if not exists subject_id uuid references public.subjects(subject_id) on delete set null;

create index if not exists idx_tasks_domain on public.tasks(domain_id);
create index if not exists idx_tasks_subject on public.tasks(subject_id);

-- ─── subject_analytics table updates ────────────────────────────────────────
-- Modify to support multi-domain analytics
alter table public.subject_analytics 
  add column if not exists domain_id uuid references public.domains(domain_id) on delete cascade,
  add column if not exists subject_id uuid references public.subjects(subject_id) on delete cascade;

create index if not exists idx_subject_analytics_domain on public.subject_analytics(domain_id);
create index if not exists idx_subject_analytics_subject on public.subject_analytics(subject_id);
