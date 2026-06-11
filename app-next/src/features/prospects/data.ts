import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, ProspectStatus, ProspectTemperature } from "@/types/database";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import { getEntityFiles } from "@/features/tech/data";

export type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"];
export type ProspectDiagnosticRow = Database["public"]["Tables"]["prospect_diagnostics"]["Row"];
export type ProspectNoteRow = Database["public"]["Tables"]["prospect_notes"]["Row"];
export type ProspectActivityRow = Database["public"]["Tables"]["prospect_activities"]["Row"];
export type CommercialTaskRow = Database["public"]["Tables"]["commercial_tasks"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];

export async function getProspects(filters?: {
  q?: string;
  status?: string;
  temperature?: string;
  mine?: string;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      data: [] as ProspectRow[],
      error: "Supabase nao configurado. Configure .env.local para carregar prospects reais.",
      isConfigured: false
    };
  }

  let query = supabase
    .from("prospects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  if (filters?.status && prospectStatuses.includes(filters.status as ProspectStatus)) {
    query = query.eq("status", filters.status as ProspectStatus);
  }

  if (filters?.temperature && prospectTemperatures.includes(filters.temperature as ProspectTemperature)) {
    query = query.eq("temperature", filters.temperature as ProspectTemperature);
  }

  if (filters?.mine === "1") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) {
      query = query.or(`owner_id.eq.${userData.user.id},responsible_user_id.eq.${userData.user.id}`);
    }
  }

  const { data, error } = await query;

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

export async function getProspectWorkspace(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      prospect: null,
      diagnostic: null,
      notes: [] as ProspectNoteRow[],
      activities: [] as ProspectActivityRow[],
      tasks: [] as CommercialTaskRow[],
      files: [] as FileRow[],
      profile: null,
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }

  const [prospectResult, diagnosticResult, notesResult, activitiesResult, tasksResult, filesResult, userResult] = await Promise.all([
    supabase.from("prospects").select("*").eq("id", id).single(),
    supabase.from("prospect_diagnostics").select("*").eq("prospect_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("prospect_notes").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
    supabase.from("prospect_activities").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
    supabase.from("commercial_tasks").select("*").eq("prospect_id", id).order("due_date", { ascending: true }),
    getEntityFiles("prospect", id),
    supabase.auth.getUser()
  ]);

  const userId = userResult.data.user?.id;
  const profileResult = userId
    ? await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
    : { data: null };

  return {
    prospect: prospectResult.data,
    diagnostic: diagnosticResult.data,
    notes: notesResult.data || [],
    activities: activitiesResult.data || [],
    tasks: tasksResult.data || [],
    files: filesResult.data || [],
    profile: profileResult.data,
    error: prospectResult.error?.message || diagnosticResult.error?.message || notesResult.error?.message || activitiesResult.error?.message || tasksResult.error?.message || filesResult.error || null,
    isConfigured: true
  };
}
