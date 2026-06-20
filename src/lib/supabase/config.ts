/**
 * Shared Supabase connection values. Supports both the new publishable key
 * (sb_publishable_…, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) and the legacy
 * anon JWT (NEXT_PUBLIC_SUPABASE_ANON_KEY). NEXT_PUBLIC_* vars are inlined at
 * build time, so this is safe in both browser and server bundles.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
