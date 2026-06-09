import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { calculateDashboardMetrics, groupActivitiesByPeriod } from "./workspace-helpers";

export type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
export type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"];
export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type TaskRow = Database["public"]["Tables"]["commercial_tasks"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ActivityFilters = {
  actor_id?: string;
  entity_type?: string;
  project_id?: string;
  prospect_id?: string;
  client_id?: string;
};

function filterEntityId(filters: ActivityFilters) {
  return filters.project_id || filters.prospect_id || filters.client_id || "";
}

export async function getActivities(filters: ActivityFilters = {}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as ActivityRow[], grouped: groupActivitiesByPeriod([]), error: "Supabase nao configurado.", isConfigured: false };

  let query = supabase.from("activities").select("*");
  if (filters.actor_id) query = query.eq("actor_id", filters.actor_id);
  if (filters.entity_type) query = query.eq("entity_type", filters.entity_type);
  const entityId = filterEntityId(filters);
  if (entityId) query = query.eq("entity_id", entityId);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  const activities = data || [];
  return { data: activities, grouped: groupActivitiesByPeriod(activities), error: error?.message || null, isConfigured: true };
}

export async function getWorkspaceReferenceData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      profiles: [] as ProfileRow[],
      prospects: [] as ProspectRow[],
      clients: [] as ClientRow[],
      projects: [] as ProjectRow[],
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }

  const [profiles, prospects, clients, projects] = await Promise.all([
    supabase.from("profiles").select("*").order("email", { ascending: true }),
    supabase.from("prospects").select("*").order("name", { ascending: true }),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("name", { ascending: true })
  ]);

  return {
    profiles: profiles.data || [],
    prospects: prospects.data || [],
    clients: clients.data || [],
    projects: projects.data || [],
    error: profiles.error?.message || prospects.error?.message || clients.error?.message || projects.error?.message || null,
    isConfigured: true
  };
}

export async function getDashboardOverview() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const emptyData = { prospects: [], clients: [], projects: [], tasks: [] };
    return {
      metrics: calculateDashboardMetrics(emptyData),
      activities: [] as ActivityRow[],
      myPending: [] as TaskRow[],
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id || null;
  const [prospects, clients, projects, tasks, activities] = await Promise.all([
    supabase.from("prospects").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("commercial_tasks").select("*"),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(12)
  ]);

  const dashboardData = {
    prospects: prospects.data || [],
    clients: clients.data || [],
    projects: projects.data || [],
    tasks: tasks.data || []
  };
  const openTasks = dashboardData.tasks.filter((task) => task.status !== "completed" && task.status !== "canceled");

  return {
    metrics: calculateDashboardMetrics(dashboardData, { userId }),
    activities: activities.data || [],
    myPending: userId ? openTasks.filter((task) => task.owner_id === userId || task.assigned_to === userId).slice(0, 8) : openTasks.slice(0, 8),
    error: prospects.error?.message || clients.error?.message || projects.error?.message || tasks.error?.message || activities.error?.message || null,
    isConfigured: true
  };
}

export async function getGlobalSearchData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      prospects: [] as ProspectRow[],
      companies: [] as CompanyRow[],
      clients: [] as ClientRow[],
      projects: [] as ProjectRow[],
      tasks: [] as TaskRow[],
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }

  const [prospects, companies, clients, projects, tasks] = await Promise.all([
    supabase.from("prospects").select("*").limit(200),
    supabase.from("companies").select("*").limit(200),
    supabase.from("clients").select("*").limit(200),
    supabase.from("projects").select("*").limit(200),
    supabase.from("commercial_tasks").select("*").limit(200)
  ]);

  return {
    prospects: prospects.data || [],
    companies: companies.data || [],
    clients: clients.data || [],
    projects: projects.data || [],
    tasks: tasks.data || [],
    error: prospects.error?.message || companies.error?.message || clients.error?.message || projects.error?.message || tasks.error?.message || null,
    isConfigured: true
  };
}
