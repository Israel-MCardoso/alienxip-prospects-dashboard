import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CommercialTaskRow = Database["public"]["Tables"]["commercial_tasks"]["Row"];
export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export async function getPipelineProspects() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { prospects: [], tasks: [], error: "Supabase nao configurado.", isConfigured: false };

  const [prospectsResult, tasksResult] = await Promise.all([
    supabase.from("prospects").select("*").order("updated_at", { ascending: false }),
    supabase.from("commercial_tasks").select("*").neq("status", "completed").order("due_date", { ascending: true })
  ]);

  return {
    prospects: prospectsResult.data || [],
    tasks: tasksResult.data || [],
    error: prospectsResult.error?.message || tasksResult.error?.message || null,
    isConfigured: true
  };
}

export async function getCompanies() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as CompanyRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("companies").select("*").order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getCompany(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: null, error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
  return { data, error: error?.message || null, isConfigured: true };
}

export async function getClients(filters?: { mine?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as ClientRow[], error: "Supabase nao configurado.", isConfigured: false };
  let query = supabase.from("clients").select("*");
  if (filters?.mine === "1") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) query = query.eq("owner_id", userData.user.id);
  }
  const { data, error } = await query.order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getClient(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: null, error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  return { data, error: error?.message || null, isConfigured: true };
}
