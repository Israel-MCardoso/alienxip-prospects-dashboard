import { z } from "zod";

export const projectStatuses = ["planning", "active", "paused", "completed", "canceled"];
export const projectPriorities = ["low", "medium", "high", "urgent"];

const optionalText = z.string().trim().optional().default("");
const optionalDate = z.string().trim().optional().default("");

export const projectSchema = z.object({
  client_id: optionalText,
  company_id: optionalText,
  name: z.string().trim().min(1, "Nome do projeto e obrigatorio."),
  description: optionalText,
  status: z.enum(projectStatuses).default("planning"),
  priority: z.enum(projectPriorities).default("medium"),
  start_date: optionalDate,
  due_date: optionalDate,
  owner_id: optionalText
});

export const taskSchema = z.object({
  prospect_id: optionalText,
  company_id: optionalText,
  client_id: optionalText,
  project_id: optionalText,
  assigned_to: optionalText,
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  status: z.enum(["pending", "in_progress", "completed", "canceled"]).default("pending"),
  priority: z.enum(projectPriorities).default("medium"),
  due_date: optionalDate
});

export const projectStatusUpdateSchema = z.object({
  status: z.enum(projectStatuses)
});

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function groupTasksByDateBucket(tasks, todayISO = isoDate(new Date())) {
  const grouped = {
    overdue: [],
    today: [],
    next7: [],
    unscheduled: []
  };
  const today = toDateOnly(todayISO);
  const next7 = new Date(today);
  next7.setDate(next7.getDate() + 7);

  for (const task of tasks) {
    if (task.status === "completed" || task.status === "canceled") continue;
    const due = toDateOnly(task.due_date);

    if (!due) {
      grouped.unscheduled.push(task);
    } else if (due < today) {
      grouped.overdue.push(task);
    } else if (isoDate(due) === todayISO) {
      grouped.today.push(task);
    } else if (due <= next7) {
      grouped.next7.push(task);
    }
  }

  return grouped;
}

export function groupProjectsByStatus(projects) {
  const grouped = Object.fromEntries(projectStatuses.map((status) => [status, []]));

  for (const project of projects) {
    const status = projectStatuses.includes(project.status) ? project.status : "planning";
    grouped[status].push(project);
  }

  return grouped;
}

export function calculateProjectProgress(tasks) {
  if (!tasks.length) return 0;
  const completed = tasks.filter((task) => task.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}
