-- ============================================================================
-- Grant Lifetime Membership SQL Script
-- Run this in Supabase SQL Editor to grant lifetime/premium access to users
-- ============================================================================

-- Example: Grant lifetime membership to keerthisuga7@gmail.com
-- Replace the email with the actual user email

-- Step 1: Find user ID by email
SELECT id, email FROM auth.users WHERE email = 'keerthisuga7@gmail.com';

-- Step 2: Grant lifetime membership (copy the user_id from Step 1)
INSERT INTO subscriptions (
  user_id,
  tier,
  billing_period_start,
  billing_period_end,
  auto_renew,
  stripe_customer_id,
  stripe_subscription_id
)
VALUES (
  'USER_ID_FROM_STEP_1', -- Replace with actual user_id
  'premium',
  NOW(),
  NOW() + INTERVAL '100 years', -- Effectively lifetime
  false, -- No auto-renew for lifetime members
  NULL,
  NULL
)
ON CONFLICT (user_id) 
DO UPDATE SET
  tier = 'premium',
  billing_period_end = NOW() + INTERVAL '100 years',
  auto_renew = false,
  updated_at = NOW();

-- Step 3: Verify the subscription was created/updated
SELECT * FROM subscriptions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'keerthisuga7@gmail.com'
);

-- ============================================================================
-- Batch Grant (Multiple Users)
-- ============================================================================

-- Grant lifetime to multiple users at once
WITH lifetime_users AS (
  SELECT id FROM auth.users WHERE email IN (
    'keerthisuga7@gmail.com',
    'another@example.com'
    -- Add more emails here
  )
)
INSERT INTO subscriptions (
  user_id,
  tier,
  billing_period_start,
  billing_period_end,
  auto_renew
)
SELECT 
  id,
  'premium',
  NOW(),
  NOW() + INTERVAL '100 years',
  false
FROM lifetime_users
ON CONFLICT (user_id) 
DO UPDATE SET
  tier = 'premium',
  billing_period_end = NOW() + INTERVAL '100 years',
  auto_renew = false,
  updated_at = NOW();
