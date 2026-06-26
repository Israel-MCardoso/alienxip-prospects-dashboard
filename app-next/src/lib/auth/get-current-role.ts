import { createSupabaseServerClient } from "@/lib/supabase/server";

// Server-side: resolve the current authenticated user's role from public.profiles.
// Returns null when unconfigured, unauthenticated, or profile missing.
export async function getCurrentRole(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role ?? null;
}
