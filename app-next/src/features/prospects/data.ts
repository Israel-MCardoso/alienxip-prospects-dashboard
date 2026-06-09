import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"];

export async function getProspects() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      data: [] as ProspectRow[],
      error: "Supabase nao configurado. Configure .env.local para carregar prospects reais.",
      isConfigured: false
    };
  }

  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("updated_at", { ascending: false });

  return {
    data: data || [],
    error: error?.message || null,
    isConfigured: true
  };
}

export async function getProspect(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { data: null, error: "Supabase nao configurado.", isConfigured: false };
  }

  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .single();

  return {
    data,
    error: error?.message || null,
    isConfigured: true
  };
}
