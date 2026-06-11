import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type GlobalSearchRow = Database["public"]["Functions"]["global_search"]["Returns"][number];

export async function getGlobalSearchResults(query: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase || !query.trim()) return { data: [] as GlobalSearchRow[], error: supabase ? null : "Supabase nao configurado.", isConfigured: Boolean(supabase) };
  const { data, error } = await supabase.rpc("global_search", { search_query: query, result_limit: 20 });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}
