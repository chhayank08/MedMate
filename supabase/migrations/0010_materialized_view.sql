-- ============================================================================
-- Multi-Domain Learning Platform — Materialized View for User Preferences
-- Task 1.6: Create materialized view for user preferences
-- Requirements: 3.1, 3.7, 13.7
-- ============================================================================

-- ─── user_preferences_view materialized view ────────────────────────────────
-- Aggregates user domains and subjects with domain context for efficient queries
create materialized view if not exists public.user_preferences_view as
select 
  ud.user_id,
  jsonb_agg(distinct d.*) filter (where d.domain_id is not null) as domains,
  jsonb_agg(distinct jsonb_build_object(
    'subject_id', s.subject_id,
    'domain_id', s.domain_id,
    'name', s.name,
    'description', s.description,
    'enabled', us.subject_id is not null,
    'created_at', s.created_at,
    'updated_at', s.updated_at
  )) filter (where s.subject_id is not null) as subjects
from public.user_domains ud
left join public.domains d on d.domain_id = ud.domain_id
left join public.subjects s on s.domain_id = d.domain_id
left join public.user_subjects us on us.subject_id = s.subject_id and us.user_id = ud.user_id
group by ud.user_id;

-- Create unique index for efficient lookups
create unique index if not exists idx_user_preferences_view_user_id 
  on public.user_preferences_view(user_id);

-- ─── Update refresh function ────────────────────────────────────────────────
-- Update the refresh function to actually refresh the view
create or replace function public.refresh_user_preferences_view()
returns void
language plpgsql security definer
as $$
begin
  refresh materialized view concurrently public.user_preferences_view;
end;
$$;

-- ─── Triggers to auto-refresh view ─────────────────────────────────────────
-- Trigger on user_domains changes
create or replace function public.trigger_refresh_preferences()
returns trigger
language plpgsql security definer
as $$
begin
  -- Refresh view in background (non-blocking)
  perform public.refresh_user_preferences_view();
  return null;
end;
$$;

drop trigger if exists trigger_refresh_preferences_user_domains on public.user_domains;
create trigger trigger_refresh_preferences_user_domains
  after insert or update or delete on public.user_domains
  for each statement
  execute function public.trigger_refresh_preferences();

drop trigger if exists trigger_refresh_preferences_user_subjects on public.user_subjects;
create trigger trigger_refresh_preferences_user_subjects
  after insert or update or delete on public.user_subjects
  for each statement
  execute function public.trigger_refresh_preferences();
