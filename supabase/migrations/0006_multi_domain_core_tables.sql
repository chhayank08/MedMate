-- ============================================================================
-- Multi-Domain Learning Platform — Core Domain and Subject Tables
-- Migration: Create domains, subjects, and user preference junction tables
-- Task 1.1: Create core domain and subject tables with indexes
-- Requirements: 1.1, 2.1, 13.1, 13.2, 13.3, 13.4, 13.5
-- ============================================================================

-- ─── domains table ──────────────────────────────────────────────────────────
-- Stores predefined and custom learning domains (Medical, Engineering, etc.)
create table if not exists public.domains (
  domain_id      uuid primary key default gen_random_uuid(),
  name           varchar(100) not null,
  description    varchar(500),
  icon_name      varchar(50),
  is_predefined  boolean not null default false,
  created_by     uuid references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  
  -- Ensure unique domain names per user (null created_by for predefined domains)
  constraint unique_domain_name unique (name, created_by)
);

-- Indexes for efficient queries
create index if not exists idx_domains_created_by on public.domains(created_by);
create index if not exists idx_domains_is_predefined on public.domains(is_predefined);

-- ─── user_domains junction table ────────────────────────────────────────────
-- Tracks which domains each user has selected
create table if not exists public.user_domains (
  user_id     uuid not null references auth.users(id) on delete cascade,
  domain_id   uuid not null references public.domains(domain_id) on delete cascade,
  selected_at timestamptz not null default now(),
  
  -- Composite primary key ensures user can select each domain only once
  primary key (user_id, domain_id)
);

-- Indexes for efficient queries
create index if not exists idx_user_domains_user on public.user_domains(user_id);
create index if not exists idx_user_domains_domain on public.user_domains(domain_id);

-- ─── subjects table ─────────────────────────────────────────────────────────
-- Stores subjects within each domain (e.g., Anatomy in Medical domain)
create table if not exists public.subjects (
  subject_id  uuid primary key default gen_random_uuid(),
  domain_id   uuid not null references public.domains(domain_id) on delete restrict,
  name        varchar(100) not null,
  description varchar(500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  
  -- Ensure unique subject names within each domain
  constraint unique_subject_per_domain unique (domain_id, name)
);

-- Indexes for efficient queries
create index if not exists idx_subjects_domain on public.subjects(domain_id);

-- ─── user_subjects junction table ───────────────────────────────────────────
-- Tracks which subjects each user has enabled
create table if not exists public.user_subjects (
  user_id    uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(subject_id) on delete cascade,
  enabled_at timestamptz not null default now(),
  
  -- Composite primary key ensures user can enable each subject only once
  primary key (user_id, subject_id)
);

-- Indexes for efficient queries
create index if not exists idx_user_subjects_user on public.user_subjects(user_id);
create index if not exists idx_user_subjects_subject on public.user_subjects(subject_id);

-- ─── updated_at triggers ────────────────────────────────────────────────────
-- Automatically update updated_at timestamp on row updates
drop trigger if exists set_updated_at_domains on public.domains;
create trigger set_updated_at_domains
  before update on public.domains
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_subjects on public.subjects;
create trigger set_updated_at_subjects
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Enable RLS on all new tables
alter table public.domains       enable row level security;
alter table public.user_domains  enable row level security;
alter table public.subjects      enable row level security;
alter table public.user_subjects enable row level security;

-- domains: Anyone can read predefined domains; users can CRUD their own custom domains
drop policy if exists "domains_read_predefined" on public.domains;
create policy "domains_read_predefined" on public.domains
  for select
  using (is_predefined = true or auth.uid() = created_by);

drop policy if exists "domains_insert_custom" on public.domains;
create policy "domains_insert_custom" on public.domains
  for insert
  with check (auth.uid() = created_by and is_predefined = false);

drop policy if exists "domains_update_custom" on public.domains;
create policy "domains_update_custom" on public.domains
  for update
  using (auth.uid() = created_by and is_predefined = false)
  with check (auth.uid() = created_by and is_predefined = false);

drop policy if exists "domains_delete_custom" on public.domains;
create policy "domains_delete_custom" on public.domains
  for delete
  using (auth.uid() = created_by and is_predefined = false);

-- user_domains: Users can only manage their own domain selections
drop policy if exists "user_domains_owner" on public.user_domains;
create policy "user_domains_owner" on public.user_domains
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- subjects: Anyone can read subjects (tied to domains which have read access)
drop policy if exists "subjects_read_all" on public.subjects;
create policy "subjects_read_all" on public.subjects
  for select
  using (true);

-- Future: subjects_insert/update/delete policies for admin users can be added here

-- user_subjects: Users can only manage their own subject selections
drop policy if exists "user_subjects_owner" on public.user_subjects;
create policy "user_subjects_owner" on public.user_subjects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
