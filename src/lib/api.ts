import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { Database } from "@/types/database.types";

type Authed = {
  ok: true;
  user: User;
  supabase: SupabaseClient<Database>;
};
type Failed = { ok: false; response: NextResponse };

/**
 * Standard guard for API route handlers: verifies the session and applies a
 * per-user rate limit. Returns either the authed context or a ready Response.
 */
export async function guard(
  routeKey: string,
  { limit = 20, windowMs = 60_000 } = {},
): Promise<Authed | Failed> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { success, resetAt } = rateLimit(`${routeKey}:${user.id}`, { limit, windowMs });
  if (!success) {
    const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000);
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Too many requests. Please wait ${waitSeconds} seconds before trying again.` },
        { status: 429, headers: { "Retry-After": String(waitSeconds) } },
      ),
    };
  }

  return { ok: true, user, supabase };
}

/** Narrow a thrown value to a user-safe message. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong.";
}
