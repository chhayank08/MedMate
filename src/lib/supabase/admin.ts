import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Service-role client that BYPASSES Row Level Security. Server-only.
 * Never import this into client code. Use only for trusted background work
 * (e.g. scheduled jobs). Standard requests should use the RLS-scoped server
 * client from ./server so users can only ever touch their own rows.
 * Accepts the new secret key (sb_secret_…) or the legacy service_role JWT.
 */
export function createAdminClient() {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
