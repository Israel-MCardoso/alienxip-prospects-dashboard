import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type TechBugRow = Database["public"]["Tables"]["tech_bugs"]["Row"];
export type TechIncidentRow = Database["public"]["Tables"]["tech_incidents"]["Row"];
export type TechBacklogRow = Database["public"]["Tables"]["tech_backlog_items"]["Row"];
export type TechRoadmapRow = Database["public"]["Tables"]["tech_roadmap_items"]["Row"];
export type TechnicalDecisionRow = Database["public"]["Tables"]["technical_decisions"]["Row"];
export type ProjectNoteRow = Database["public"]["Tables"]["project_notes"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getTechReferenceData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { projects: [] as ProjectRow[], clients: [] as ClientRow[], companies: [] as CompanyRow[], profiles: [] as ProfileRow[], error: "Supabase nao configurado.", isConfigured: false };
  }

  const [projects, clients, companies, profiles] = await Promise.all([
    supabase.from("projects").select("*").order("name", { ascending: true }),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("companies").select("*").order("name", { ascending: true }),
    supabase.from("profiles").select("*").order("email", { ascending: true })
  ]);

  return {
    projects: projects.data || [],
    clients: clients.data || [],
    companies: companies.data || [],
    profiles: profiles.data || [],
    error: projects.error?.message || clients.error?.message || companies.error?.message || profiles.error?.message || null,
    isConfigured: true
  };
}

export async function getTechOverview() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { bugs: [], incidents: [], backlog: [], roadmap: [], decisions: [], error: "Supabase nao configurado.", isConfigured: false };
  const [bugs, incidents, backlog, roadmap, decisions] = await Promise.all([
    supabase.from("tech_bugs").select("*").order("updated_at", { ascending: false }).limit(20),
    supabase.from("tech_incidents").select("*").order("updated_at", { ascending: false }).limit(20),
    supabase.from("tech_backlog_items").select("*").order("updated_at", { ascending: false }).limit(20),
    supabase.from("tech_roadmap_items").select("*").order("updated_at", { ascending: false }).limit(20),
    supabase.from("technical_decisions").select("*").order("updated_at", { ascending: false }).limit(20)
  ]);
  return {
    bugs: bugs.data || [],
    incidents: incidents.data || [],
    backlog: backlog.data || [],
    roadmap: roadmap.data || [],
    decisions: decisions.data || [],
    error: bugs.error?.message || incidents.error?.message || backlog.error?.message || roadmap.error?.message || decisions.error?.message || null,
    isConfigured: true
  };
}

export async function getTechBugs(filters?: { status?: string; severity?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as TechBugRow[], error: "Supabase nao configurado.", isConfigured: false };
  let query = supabase.from("tech_bugs").select("*");
  if (filters?.status) query = query.eq("status", filters.status as TechBugRow["status"]);
  if (filters?.severity) query = query.eq("severity", filters.severity as TechBugRow["severity"]);
  const { data, error } = await query.order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getTechIncidents() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as TechIncidentRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("tech_incidents").select("*").order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getTechBacklog() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as TechBacklogRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("tech_backlog_items").select("*").order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getTechRoadmap() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as TechRoadmapRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("tech_roadmap_items").select("*").order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getTechnicalDecisions() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as TechnicalDecisionRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("technical_decisions").select("*").order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getProjectNotes(projectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as ProjectNoteRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("project_notes").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getEntityFiles(entityType: string, entityId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as FileRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getTechSearchData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { bugs: [], incidents: [], backlog: [], roadmap: [], decisions: [], projectNotes: [], error: "Supabase nao configurado.", isConfigured: false };
  const [bugs, incidents, backlog, roadmap, decisions, projectNotes] = await Promise.all([
    supabase.from("tech_bugs").select("*").limit(100),
    supabase.from("tech_incidents").select("*").limit(100),
    supabase.from("tech_backlog_items").select("*").limit(100),
    supabase.from("tech_roadmap_items").select("*").limit(100),
    supabase.from("technical_decisions").select("*").limit(100),
    supabase.from("project_notes").select("*").limit(100)
  ]);
  return {
    bugs: bugs.data || [],
    incidents: incidents.data || [],
    backlog: backlog.data || [],
    roadmap: roadmap.data || [],
    decisions: decisions.data || [],
    projectNotes: projectNotes.data || [],
    error: bugs.error?.message || incidents.error?.message || backlog.error?.message || roadmap.error?.message || decisions.error?.message || projectNotes.error?.message || null,
    isConfigured: true
  };
}
