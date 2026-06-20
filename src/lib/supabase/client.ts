import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/config";

/** Browser Supabase client for use in Client Components. */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY);
}
