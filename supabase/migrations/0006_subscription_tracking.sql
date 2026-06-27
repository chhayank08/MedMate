-- ============================================================================
-- Multi-Domain Learning Platform — Subscription and Usage Tracking
-- Creates subscriptions and usage_tracking tables for tier-based access control
-- Requirements: 6.1, 6.7, 6.8, 6.9, 13.1
-- ============================================================================

-- ─── subscriptions table ────────────────────────────────────────────────────
-- Tracks user subscription information including tier, billing period, and Stripe IDs
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  tier                    varchar(20) not null check (tier in ('free', 'pro', 'premium')),
  billing_period_start    timestamptz not null,
  billing_period_end      timestamptz not null,
  auto_renew              boolean not null default true,
  stripe_subscription_id  varchar(255),
  stripe_customer_id      varchar(255),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint unique_user_subscription unique (user_id)
);

-- ─── usage_tracking table ───────────────────────────────────────────────────
-- Tracks resource usage per billing period for tier limit enforcement
create table if not exists public.usage_tracking (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  billing_period_start    timestamptz not null,
  billing_period_end      timestamptz not null,
  quiz_count              integer not null default 0,
  summary_count           integer not null default 0,
  domain_count            integer not null default 0,
  subject_count           integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint unique_user_period unique (user_id, billing_period_start)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
-- Subscriptions indexes for efficient queries
create index if not exists idx_subscriptions_user 
  on public.subscriptions (user_id);

create index if not exists idx_subscriptions_tier 
  on public.subscriptions (tier);

create index if not exists idx_subscriptions_billing_period_start 
  on public.subscriptions (billing_period_start);

create index if not exists idx_subscriptions_billing_period_end 
  on public.subscriptions (billing_period_end);

create index if not exists idx_subscriptions_stripe_subscription 
  on public.subscriptions (stripe_subscription_id);

create index if not exists idx_subscriptions_stripe_customer 
  on public.subscriptions (stripe_customer_id);

-- Usage tracking indexes for efficient queries
create index if not exists idx_usage_tracking_user 
  on public.usage_tracking (user_id);

create index if not exists idx_usage_tracking_billing_period_start 
  on public.usage_tracking (billing_period_start);

create index if not exists idx_usage_tracking_billing_period_end 
  on public.usage_tracking (billing_period_end);

create index if not exists idx_usage_tracking_period_range 
  on public.usage_tracking (billing_period_start, billing_period_end);

-- ─── Updated_at triggers ────────────────────────────────────────────────────
drop trigger if exists set_updated_at_subscriptions on public.subscriptions;
create trigger set_updated_at_subscriptions 
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_usage_tracking on public.usage_tracking;
create trigger set_updated_at_usage_tracking 
  before update on public.usage_tracking
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.usage_tracking enable row level security;

-- Subscriptions: users can only access their own subscription data
drop policy if exists "subscriptions_owner" on public.subscriptions;
create policy "subscriptions_owner" on public.subscriptions
  for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

-- Usage tracking: users can only access their own usage data
drop policy if exists "usage_tracking_owner" on public.usage_tracking;
create policy "usage_tracking_owner" on public.usage_tracking
  for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

-- ─── Initialize free tier for existing users ────────────────────────────────
-- Create default free tier subscriptions for all existing users
insert into public.subscriptions (
  user_id,
  tier,
  billing_period_start,
  billing_period_end,
  auto_renew
)
select 
  id as user_id,
  'free' as tier,
  now() as billing_period_start,
  (now() + interval '1 month') as billing_period_end,
  true as auto_renew
from auth.users
where id not in (select user_id from public.subscriptions)
on conflict (user_id) do nothing;

-- Initialize usage tracking for existing users
insert into public.usage_tracking (
  user_id,
  billing_period_start,
  billing_period_end,
  quiz_count,
  summary_count,
  domain_count,
  subject_count
)
select 
  id as user_id,
  now() as billing_period_start,
  (now() + interval '1 month') as billing_period_end,
  0 as quiz_count,
  0 as summary_count,
  0 as domain_count,
  0 as subject_count
from auth.users
where id not in (
  select user_id 
  from public.usage_tracking 
  where billing_period_start = date_trunc('month', now())
)
on conflict (user_id, billing_period_start) do nothing;

-- ─── Auto-create subscription and usage tracking for new users ──────────────
create or replace function public.handle_new_user_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  period_start timestamptz;
  period_end timestamptz;
begin
  period_start := now();
  period_end := period_start + interval '1 month';

  -- Create free tier subscription for new user
  insert into public.subscriptions (
    user_id,
    tier,
    billing_period_start,
    billing_period_end,
    auto_renew
  ) values (
    new.id,
    'free',
    period_start,
    period_end,
    true
  )
  on conflict (user_id) do nothing;

  -- Create initial usage tracking record
  insert into public.usage_tracking (
    user_id,
    billing_period_start,
    billing_period_end,
    quiz_count,
    summary_count,
    domain_count,
    subject_count
  ) values (
    new.id,
    period_start,
    period_end,
    0,
    0,
    0,
    0
  )
  on conflict (user_id, billing_period_start) do nothing;

  return new;
end;
$$;

-- Trigger to create subscription and usage tracking on user creation
drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();
