// ============================================================================
// Subscription and Tier Types
// Task 2.3: Create subscription TypeScript types
// Requirements: 6.1, 6.2, 6.3, 6.4, 15.1, 15.2, 15.3
// ============================================================================

import { SummaryTypeEnum } from './database.types';

// ─── Subscription Tier Types ────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  billing_period_start: string;
  billing_period_end: string;
  auto_renew: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Usage Tracking Types ───────────────────────────────────────────────────
export interface UsageTracking {
  id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  quiz_count: number;
  summary_count: number;
  domain_count: number;
  subject_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  domains: { current: number; limit: number };
  subjects: { current: number; limit: number };
  quizzes: { current: number; limit: number; resetsAt: string };
  summaries: { current: number; limit: number; resetsAt: string };
}

// ─── Tier Limits ────────────────────────────────────────────────────────────
export interface TierLimits {
  domains: number;
  subjects: number;
  quizzes: number;
  summaries: number;
  summaryTypes: SummaryTypeEnum[];
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    domains: 1,
    subjects: 3,
    quizzes: 5,
    summaries: 5,
    summaryTypes: ['quick', 'revision']
  },
  pro: {
    domains: 3,
    subjects: 10000,
    quizzes: 50,
    summaries: 50,
    summaryTypes: ['quick', 'revision', 'cheat_sheet', 'key_concepts', 'definitions']
  },
  premium: {
    domains: 10,
    subjects: 10000,
    quizzes: 500,
    summaries: 500,
    summaryTypes: [
      'quick', 
      'revision', 
      'cheat_sheet', 
      'key_concepts', 
      'definitions', 
      'flashcards', 
      'high_yield_points', 
      'exam_notes', 
      'one_page_summary', 
      'active_recall_notes'
    ]
  }
};

// ─── Action Types ───────────────────────────────────────────────────────────
export type ActionType = 'add_domain' | 'add_subject' | 'generate_quiz' | 'generate_summary';

// ─── Limit Check Result ─────────────────────────────────────────────────────
export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  upgradeRequired?: SubscriptionTier;
}
