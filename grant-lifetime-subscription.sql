-- Grant lifetime premium subscription to keerthisuga7@gmail.com
-- Run this in Supabase SQL Editor

-- First, find the user_id for the email
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user_id from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'keerthisuga7@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email keerthisuga7@gmail.com not found';
  ELSE
    -- Insert or update subscription to premium with far future end date (100 years)
    INSERT INTO public.subscriptions (
      user_id,
      tier,
      billing_period_start,
      billing_period_end,
      auto_renew,
      stripe_subscription_id,
      stripe_customer_id
    )
    VALUES (
      target_user_id,
      'premium',
      NOW(),
      NOW() + INTERVAL '100 years',
      false,
      'lifetime_grant',
      NULL
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      tier = 'premium',
      billing_period_start = NOW(),
      billing_period_end = NOW() + INTERVAL '100 years',
      auto_renew = false,
      stripe_subscription_id = 'lifetime_grant',
      updated_at = NOW();

    -- Reset usage tracking for the new billing period
    INSERT INTO public.usage_tracking (
      user_id,
      billing_period_start,
      billing_period_end,
      quiz_count,
      summary_count,
      domain_count,
      subject_count
    )
    VALUES (
      target_user_id,
      NOW(),
      NOW() + INTERVAL '100 years',
      0,
      0,
      0,
      0
    )
    ON CONFLICT (user_id, billing_period_start) 
    DO UPDATE SET
      billing_period_end = NOW() + INTERVAL '100 years',
      updated_at = NOW();

    RAISE NOTICE 'Lifetime premium subscription granted to user: %', target_user_id;
  END IF;
END $$;

-- Verify the subscription
SELECT 
  u.email,
  s.tier,
  s.billing_period_start,
  s.billing_period_end,
  s.auto_renew
FROM auth.users u
JOIN public.subscriptions s ON s.user_id = u.id
WHERE u.email = 'keerthisuga7@gmail.com';
