import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { groupTasksByDateBucket } from "./operations-helpers";

export type TaskRow = Database["public"]["Tables"]["commercial_tasks"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectActivityRow = Database["public"]["Tables"]["project_activities"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type TaskFilters = {
  q?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due?: string;
  project_id?: string;
  client_id?: string;
};

export type ProjectFilters = {
  q?: string;
  status?: string;
  priority?: string;
  owner_id?: string;
  client_id?: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getProfiles() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as ProfileRow[], error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("profiles").select("*").order("email", { ascending: true });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getTaskReferenceData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      companies: [] as CompanyRow[],
      clients: [] as ClientRow[],
      profiles: [] as ProfileRow[],
      projects: [] as ProjectRow[],
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }

  const [companies, clients, profiles, projects] = await Promise.all([
    supabase.from("companies").select("*").order("name", { ascending: true }),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("email", { ascending: true }),
    supabase.from("projects").select("*").order("updated_at", { ascending: false })
  ]);

  return {
    companies: companies.data || [],
    clients: clients.data || [],
    profiles: profiles.data || [],
    projects: projects.data || [],
    error: companies.error?.message || clients.error?.message || profiles.error?.message || projects.error?.message || null,
    isConfigured: true
  };
}

export async function getTasks(filters: TaskFilters = {}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as TaskRow[], error: "Supabase nao configurado.", isConfigured: false };

  let query = supabase.from("commercial_tasks").select("*");
  if (filters.assigned_to === "me") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) query = query.or(`assigned_to.eq.${userData.user.id},owner_id.eq.${userData.user.id}`);
  } else if (filters.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to);
  }
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.status) query = query.eq("status", filters.status as TaskRow["status"]);
  if (filters.priority) query = query.eq("priority", filters.priority as TaskRow["priority"]);
  if (filters.project_id) query = query.eq("project_id", filters.project_id);
  if (filters.client_id) query = query.eq("client_id", filters.client_id);
  if (filters.due === "overdue") query = query.lt("due_date", todayISO()).neq("status", "completed");
  if (filters.due === "today") query = query.eq("due_date", todayISO());
  if (filters.due === "none") query = query.is("due_date", null);

  const { data, error } = await query.order("due_date", { ascending: true, nullsFirst: false }).order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getMyTasks() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { tasks: [] as TaskRow[], grouped: groupTasksByDateBucket([]), error: "Supabase nao configurado.", isConfigured: false };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { tasks: [] as TaskRow[], grouped: groupTasksByDateBucket([]), error: "Usuario nao autenticado.", isConfigured: true };

  const { data, error } = await supabase
    .from("commercial_tasks")
    .select("*")
    .eq("assigned_to", userData.user.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true, nullsFirst: false });

  const tasks = data || [];
  return { tasks, grouped: groupTasksByDateBucket(tasks), error: error?.message || null, isConfigured: true };
}

export async function getCalendarTasks() {
  const result = await getTasks();
  return { ...result, grouped: groupTasksByDateBucket(result.data) };
}

export async function getProjects(filters: ProjectFilters = {}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as ProjectRow[], error: "Supabase nao configurado.", isConfigured: false };

  let query = supabase.from("projects").select("*");
  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  if (filters.status) query = query.eq("status", filters.status as ProjectRow["status"]);
  if (filters.priority) query = query.eq("priority", filters.priority as ProjectRow["priority"]);
  if (filters.owner_id === "me") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) query = query.eq("owner_id", userData.user.id);
  } else if (filters.owner_id) {
    query = query.eq("owner_id", filters.owner_id);
  }
  if (filters.client_id) query = query.eq("client_id", filters.client_id);

  const { data, error } = await query.order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getProject(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { project: null, tasks: [] as TaskRow[], activities: [] as ProjectActivityRow[], error: "Supabase nao configurado.", isConfigured: false };
  }

  const [project, tasks, activities] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("commercial_tasks").select("*").eq("project_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("project_activities").select("*").eq("project_id", id).order("created_at", { ascending: false })
  ]);

  return {
    project: project.data,
    tasks: tasks.data || [],
    activities: activities.data || [],
    error: project.error?.message || tasks.error?.message || activities.error?.message || null,
    isConfigured: true
  };
}

export async function getClientProjects(clientId: string) {
  return getProjects({ client_id: clientId });
}
