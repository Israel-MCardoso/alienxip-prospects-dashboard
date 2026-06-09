export function isOwnedBy(item, userId) {
  if (!item || !userId) return false;
  return item.owner_id === userId || item.assigned_to === userId || item.responsible_user_id === userId;
}

export function filterOwnedItems(items, userId) {
  return items.filter((item) => isOwnedBy(item, userId));
}

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(dateISO, days) {
  const date = new Date(`${dateISO}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function groupActivitiesByPeriod(activities, todayISO = new Date().toISOString().slice(0, 10)) {
  const yesterdayISO = addDays(todayISO, -1);
  const weekStartISO = addDays(todayISO, -7);
  const grouped = { today: [], yesterday: [], last7: [] };

  for (const activity of activities) {
    const date = toDateOnly(activity.created_at);
    if (date === todayISO) grouped.today.push(activity);
    else if (date === yesterdayISO) grouped.yesterday.push(activity);
    else if (date && date >= weekStartISO && date < yesterdayISO) grouped.last7.push(activity);
  }

  return grouped;
}

function isTaskOpen(task) {
  return task.status !== "completed" && task.status !== "canceled";
}

function isActiveProspect(prospect) {
  return !["perdido", "lost", "archived"].includes(prospect.status);
}

function isCurrentMonth(value, todayISO) {
  const date = toDateOnly(value);
  return Boolean(date && date.slice(0, 7) === todayISO.slice(0, 7));
}

export function calculateDashboardMetrics(data, options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const userId = options.userId || null;
  const openTasks = data.tasks.filter(isTaskOpen);

  return {
    activeProspects: data.prospects.filter(isActiveProspect).length,
    activeClients: data.clients.filter((client) => client.status === "active").length,
    activeProjects: data.projects.filter((project) => project.status === "active").length,
    openTasks: openTasks.length,
    overdueTasks: openTasks.filter((task) => task.due_date && task.due_date < today).length,
    todayTasks: openTasks.filter((task) => task.due_date === today).length,
    monthConversions: data.prospects.filter((prospect) => isCurrentMonth(prospect.converted_at, today)).length,
    completedProjects: data.projects.filter((project) => project.status === "completed" && isCurrentMonth(project.completed_at, today)).length,
    myOpenTasks: userId ? openTasks.filter((task) => isOwnedBy(task, userId)).length : 0,
    myOverdueTasks: userId ? openTasks.filter((task) => isOwnedBy(task, userId) && task.due_date && task.due_date < today).length : 0,
    myActiveProspects: userId ? data.prospects.filter((prospect) => isOwnedBy(prospect, userId) && isActiveProspect(prospect)).length : 0,
    myActiveProjects: userId ? data.projects.filter((project) => isOwnedBy(project, userId) && project.status === "active").length : 0
  };
}

function includesTerm(value, term) {
  return String(value || "").toLowerCase().includes(term);
}

function result(type, title, href, description = "") {
  return { type, title, href, description };
}

export function buildGlobalSearchResults(query, data, limit = 12) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return [];

  const results = [
    ...data.prospects
      .filter((item) => includesTerm(item.name, term))
      .map((item) => result("prospect", item.name, `/os/prospects/${item.id}`, item.segment || "")),
    ...data.companies
      .filter((item) => includesTerm(item.name, term))
      .map((item) => result("company", item.name, `/os/companies/${item.id}`, item.segment || "")),
    ...data.clients
      .filter((item) => includesTerm(item.main_contact_name || item.main_contact_email || item.id, term))
      .map((item) => result("client", item.main_contact_name || item.main_contact_email || item.id, `/os/clients/${item.id}`, item.contract_status || "")),
    ...data.projects
      .filter((item) => includesTerm(item.name, term))
      .map((item) => result("project", item.name, `/os/projects/${item.id}`, item.status || "")),
    ...data.tasks
      .filter((item) => includesTerm(item.title, term))
      .map((item) => result("task", item.title, item.project_id ? `/os/projects/${item.project_id}` : "/os/tasks", item.status || ""))
  ];

  return results.slice(0, limit);
}
