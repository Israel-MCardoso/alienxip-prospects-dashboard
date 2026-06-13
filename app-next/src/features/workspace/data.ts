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

export type TechBugRow = Database["public"]["Tables"]["tech_bugs"]["Row"];
export type TechIncidentRow = Database["public"]["Tables"]["tech_incidents"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type PlaybookRow = Database["public"]["Tables"]["playbooks"]["Row"];

export async function getDashboardOverview() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const emptyData = { prospects: [], clients: [], projects: [], tasks: [] };
    return {
      metrics: {
        ...calculateDashboardMetrics(emptyData),
        leadsEmAutomacao: 0,
        aguardandoResposta: 0,
        responderam: 0,
        negociando: 0,
        reunioesMarcadas: 0,
        taxaResposta: 0,
        taxaConversao: 0
      },
      activities: [] as ActivityRow[],
      myPending: [] as TaskRow[],
      bugs: [] as TechBugRow[],
      incidents: [] as TechIncidentRow[],
      recentFiles: [] as FileRow[],
      recentPlaybooks: [] as PlaybookRow[],
      profiles: [] as ProfileRow[],
      prospects: [] as ProspectRow[],
      clients: [] as ClientRow[],
      projects: [] as ProjectRow[],
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id || null;
  const [prospects, clients, projects, tasks, activities, bugs, incidents, files, playbooks, profiles, outreach] = await Promise.all([
    supabase.from("prospects").select("id, name, status, temperature, owner_id, responsible_user_id, segment, converted_at, priority_score"),
    supabase.from("clients").select("id, company_id, status, contract_status, main_contact_name, main_contact_email"),
    supabase.from("projects").select("id, name, status, priority, owner_id, created_by, completed_at"),
    supabase.from("commercial_tasks").select("id, prospect_id, client_id, project_id, owner_id, assigned_to, title, description, status, priority, due_date"),
    supabase.from("activities").select("id, entity_type, entity_id, actor_id, action, title, description, metadata, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("tech_bugs").select("id, title, status, severity, priority, project_id, client_id, company_id, assigned_to"),
    supabase.from("tech_incidents").select("id, title, description, status, severity, started_at, resolved_at, project_id, client_id, owner_id"),
    supabase.from("files").select("id, file_name, bucket, path, file_type, file_size, entity_type, entity_id, created_at").is("removed_at", null).order("created_at", { ascending: false }).limit(8),
    supabase.from("playbooks").select("id, title, description, category, status, created_at").eq("status", "published").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id, full_name, email"),
    supabase.from("prospect_outreach").select("id, prospect_id, status")
  ]);

  const dashboardData = {
    prospects: (prospects.data || []) as unknown as ProspectRow[],
    clients: (clients.data || []) as unknown as ClientRow[],
    projects: (projects.data || []) as unknown as ProjectRow[],
    tasks: (tasks.data || []) as unknown as TaskRow[]
  };
  const openTasks = dashboardData.tasks.filter((task) => task.status !== "completed" && task.status !== "canceled");

  // Calculate Outreach KPIs
  const outreachList = outreach.data || [];
  const leadsEmAutomacao = outreachList.filter(o => ["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status)).length;
  const aguardandoResposta = outreachList.filter(o => o.status === "waiting_reply").length;
  const responderam = outreachList.filter(o => o.status === "replied").length;
  const negociando = outreachList.filter(o => o.status === "negotiating").length;
  const reunioesMarcadas = outreachList.filter(o => o.status === "meeting_scheduled").length;

  const totalContacted = outreachList.filter(o => !["not_started", "queued"].includes(o.status)).length;
  const taxaResposta = totalContacted > 0 ? Math.round((responderam / totalContacted) * 100) : 0;
  const taxaConversao = totalContacted > 0 ? Math.round((reunioesMarcadas / totalContacted) * 100) : 0;

  const errorMsg = prospects.error?.message ||
    clients.error?.message ||
    projects.error?.message ||
    tasks.error?.message ||
    activities.error?.message ||
    bugs.error?.message ||
    incidents.error?.message ||
    files.error?.message ||
    playbooks.error?.message ||
    profiles.error?.message ||
    outreach.error?.message ||
    null;

  const metrics = {
    ...calculateDashboardMetrics(dashboardData, { userId }),
    leadsEmAutomacao,
    aguardandoResposta,
    responderam,
    negociando,
    reunioesMarcadas,
    taxaResposta,
    taxaConversao
  };

  return {
    metrics,
    activities: (activities.data || []) as unknown as ActivityRow[],
    myPending: userId ? openTasks.filter((task) => task.owner_id === userId || task.assigned_to === userId).slice(0, 8) : openTasks.slice(0, 8),
    bugs: (bugs.data || []) as unknown as TechBugRow[],
    incidents: (incidents.data || []) as unknown as TechIncidentRow[],
    recentFiles: (files.data || []) as unknown as FileRow[],
    recentPlaybooks: (playbooks.data || []) as unknown as PlaybookRow[],
    profiles: (profiles.data || []) as unknown as ProfileRow[],
    prospects: (prospects.data || []) as unknown as ProspectRow[],
    clients: (clients.data || []) as unknown as ClientRow[],
    projects: (projects.data || []) as unknown as ProjectRow[],
    error: errorMsg,
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
