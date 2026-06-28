-- ============================================================================
-- Grant Lifetime Membership SQL Script
-- Run this in Supabase SQL Editor to grant lifetime/premium access to users
-- ============================================================================

-- Example: Grant lifetime membership to keerthisuga7@gmail.com
-- This script automatically finds the user and grants lifetime access

-- Grant lifetime membership by email (single user)
WITH user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'keerthisuga7@gmail.com'
)
INSERT INTO subscriptions (
  user_id,
  tier,
  billing_period_start,
  billing_period_end,
  auto_renew,
  stripe_customer_id,
  stripe_subscription_id
)
SELECT
  id,
  'premium',
  NOW(),
  NOW() + INTERVAL '100 years',
  false,
  NULL,
  NULL
FROM user_lookup
ON CONFLICT (user_id) 
DO UPDATE SET
  tier = 'premium',
  billing_period_end = NOW() + INTERVAL '100 years',
  auto_renew = false,
  updated_at = NOW();

-- Verify the subscription was created/updated
SELECT 
  s.*,
  u.email
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'keerthisuga7@gmail.com';

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
