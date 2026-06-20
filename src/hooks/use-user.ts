"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/** Current authenticated user (cached). Used to set user_id on inserts (RLS). */
export function useUser() {
  return useQuery({
    queryKey: ["user"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });
}
