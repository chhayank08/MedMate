-- ============================================================================
-- Multi-Domain Learning Platform — Database Functions
-- Task 1.5: Create database functions for tier limits and usage tracking
-- Requirements: 6.5, 6.7, 13.7, 15.5
-- ============================================================================

-- ─── Tier limits constant ───────────────────────────────────────────────────
-- Reference for tier limits (enforced in application layer and this function)
-- Free: 1 domain, 3 subjects, 5 quizzes, 5 summaries
-- Pro: 3 domains, 10000 subjects, 50 quizzes, 50 summaries
-- Premium: 10 domains, 10000 subjects, 500 quizzes, 500 summaries

-- ─── check_tier_limits function ─────────────────────────────────────────────
-- Checks if user can perform an action based on tier limits
create or replace function public.check_tier_limits(
  p_user_id uuid,
  p_resource_type text,
  p_new_count integer
) returns boolean
language plpgsql security definer
as $$
declare
  v_tier varchar(20);
  v_limit integer;
  v_current_count integer;
begin
  -- Get user's current tier
  select tier into v_tier
  from public.subscriptions
  where user_id = p_user_id;
  
  -- Default to free tier if no subscription
  if v_tier is null then
    v_tier := 'free';
  end if;
  
  -- Determine limit based on tier and resource type
  case p_resource_type
    when 'domains' then
      v_limit := case v_tier
        when 'free' then 1
        when 'pro' then 3
        when 'premium' then 10
      end;
    when 'subjects' then
      v_limit := case v_tier
        when 'free' then 3
        when 'pro' then 10000
        when 'premium' then 10000
      end;
    when 'quizzes' then
      v_limit := case v_tier
        when 'free' then 5
        when 'pro' then 50
        when 'premium' then 500
      end;
    when 'summaries' then
      v_limit := case v_tier
        when 'free' then 5
        when 'pro' then 50
        when 'premium' then 500
      end;
    else
      raise exception 'Invalid resource type: %', p_resource_type;
  end case;
  
  -- Check if new count exceeds limit
  return p_new_count <= v_limit;
end;
$$;

-- ─── increment_usage_counter function ───────────────────────────────────────
-- Atomically increments usage counter with billing period rollover
create or replace function public.increment_usage_counter(
  p_user_id uuid,
  p_counter_type text
) returns void
language plpgsql security definer
as $$
declare
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_exists boolean;
begin
  -- Get current billing period from subscription
  select 
    billing_period_start,
    billing_period_end
  into v_period_start, v_period_end
  from public.subscriptions
  where user_id = p_user_id;
  
  -- Default to monthly period if no subscription
  if v_period_start is null then
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  end if;
  
  -- Check if current period has ended
  if now() > v_period_end then
    v_period_start := date_trunc('month', now());
    v_period_end := v_period_start + interval '1 month';
  end if;
  
  -- Check if usage record exists for current period
  select exists(
    select 1 
    from public.usage_tracking
    where user_id = p_user_id 
      and billing_period_start = v_period_start
  ) into v_exists;
  
  -- Create new record if it doesn't exist
  if not v_exists then
    insert into public.usage_tracking (
      user_id,
      billing_period_start,
      billing_period_end,
      quiz_count,
      summary_count,
      domain_count,
      subject_count
    ) values (
      p_user_id,
      v_period_start,
      v_period_end,
      0, 0, 0, 0
    )
    on conflict (user_id, billing_period_start) do nothing;
  end if;
  
  -- Increment appropriate counter
  case p_counter_type
    when 'quiz' then
      update public.usage_tracking
      set quiz_count = quiz_count + 1
      where user_id = p_user_id 
        and billing_period_start = v_period_start;
    when 'summary' then
      update public.usage_tracking
      set summary_count = summary_count + 1
      where user_id = p_user_id 
        and billing_period_start = v_period_start;
    else
      raise exception 'Invalid counter type: %', p_counter_type;
  end case;
end;
$$;

-- ─── refresh_user_preferences_view function ─────────────────────────────────
-- Refreshes materialized view for user preferences (placeholder for task 1.6)
create or replace function public.refresh_user_preferences_view()
returns void
language plpgsql security definer
as $$
begin
  -- Will be implemented when materialized view is created in task 1.6
  -- refresh materialized view concurrently user_preferences_view;
  return;
end;
$$;
