import { z } from "zod";

export const bugStatuses = ["open", "triage", "in_progress", "fixed", "wont_fix", "closed"];
export const incidentStatuses = ["investigating", "identified", "monitoring", "resolved"];
export const severityLevels = ["low", "medium", "high", "critical"];
export const priorityLevels = ["low", "medium", "high", "urgent"];
export const backlogTypes = ["refactor", "infrastructure", "feature", "debt", "security", "performance"];
export const roadmapStatuses = ["planned", "in_progress", "shipped", "paused", "canceled"];
export const technicalDecisionStatuses = ["proposed", "accepted", "deprecated", "superseded"];
export const projectNoteTypes = ["general", "technical", "meeting", "risk", "decision"];

const optionalText = z.string().trim().optional().default("");
const optionalDate = z.string().trim().optional().default("");

export const bugSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  status: z.enum(bugStatuses).default("open"),
  severity: z.enum(severityLevels).default("medium"),
  priority: z.enum(priorityLevels).default("medium"),
  project_id: optionalText,
  client_id: optionalText,
  company_id: optionalText,
  assigned_to: optionalText
});

export const incidentSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  status: z.enum(incidentStatuses).default("investigating"),
  severity: z.enum(severityLevels).default("medium"),
  started_at: optionalDate,
  project_id: optionalText,
  client_id: optionalText,
  owner_id: optionalText
});

export const backlogItemSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  status: z.enum(["open", "planned", "in_progress", "done", "archived"]).default("open"),
  priority: z.enum(priorityLevels).default("medium"),
  type: z.enum(backlogTypes).default("debt"),
  project_id: optionalText,
  owner_id: optionalText
});

export const roadmapItemSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  status: z.enum(roadmapStatuses).default("planned"),
  priority: z.enum(priorityLevels).default("medium"),
  target_date: optionalDate,
  project_id: optionalText,
  owner_id: optionalText
});

export const technicalDecisionSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  context: z.string().trim().min(1, "Contexto e obrigatorio."),
  decision: z.string().trim().min(1, "Decisao e obrigatoria."),
  consequences: optionalText,
  status: z.enum(technicalDecisionStatuses).default("proposed"),
  project_id: optionalText
});

export const projectNoteSchema = z.object({
  project_id: z.string().trim().min(1, "Projeto e obrigatorio."),
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  content: z.string().trim().min(1, "Conteudo e obrigatorio."),
  type: z.enum(projectNoteTypes).default("general")
});

const severityScore = { low: 10, medium: 30, high: 60, critical: 90 };
const priorityScore = { low: 5, medium: 10, high: 20, urgent: 10 };

export function normalizeSeverityPriority(severity = "medium", priority = "medium") {
  const score = Math.min(100, (severityScore[severity] || 30) + (priorityScore[priority] || 10));
  const label = score >= 90 ? "Critico" : score >= 70 ? "Alto" : score >= 40 ? "Medio" : "Baixo";
  return { severity, priority, score, label };
}

function includesTerm(value, term) {
  return String(value || "").toLowerCase().includes(term);
}

function result(type, title, href, description = "") {
  return { type, title, href, description };
}

export function buildTechSearchResults(query, data, limit = 12) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return [];

  return [
    ...data.bugs.filter((item) => includesTerm(item.title, term)).map((item) => result("bug", item.title, "/os/tech/bugs", item.severity || "")),
    ...data.incidents.filter((item) => includesTerm(item.title, term)).map((item) => result("incident", item.title, "/os/tech/incidents", item.severity || "")),
    ...data.backlog.filter((item) => includesTerm(item.title, term)).map((item) => result("backlog", item.title, "/os/tech/backlog", item.type || "")),
    ...data.roadmap.filter((item) => includesTerm(item.title, term)).map((item) => result("roadmap", item.title, "/os/tech/roadmap", item.status || "")),
    ...data.decisions.filter((item) => includesTerm(item.title, term) || includesTerm(item.decision, term)).map((item) => result("decision", item.title, "/os/tech/decisions", item.status || "")),
    ...data.projectNotes.filter((item) => includesTerm(item.title, term) || includesTerm(item.content, term)).map((item) => result("project_note", item.title, `/os/projects/${item.project_id}`, item.type || ""))
  ].slice(0, limit);
}

export const documentedRlsRules = [
  "read: authenticated users can read operational tech records",
  "insert: authenticated users can create records with created_by = auth.uid()",
  "update: owner_id, assigned_to, created_by or admin users can update records",
  "delete: no broad delete policy; admin-only when delete is introduced"
];
