"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/features/workspace/activity";
import type {
  ProjectNoteType,
  TechBacklogStatus,
  TechBacklogType,
  TechBugStatus,
  TechIncidentStatus,
  TechPriority,
  TechRoadmapStatus,
  TechSeverity,
  TechnicalDecisionStatus
} from "@/types/database";
import {
  backlogItemSchema,
  bugSchema,
  incidentSchema,
  projectNoteSchema,
  roadmapItemSchema,
  technicalDecisionSchema
} from "./tech-helpers";

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

async function getClientAndUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id || null };
}

export async function createBugAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = bugSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("tech_bugs").insert({
    title: input.title,
    description: nullable(input.description),
    status: input.status as TechBugStatus,
    severity: input.severity as TechSeverity,
    priority: input.priority as TechPriority,
    project_id: nullable(input.project_id),
    client_id: nullable(input.client_id),
    company_id: nullable(input.company_id),
    assigned_to: nullable(input.assigned_to) || userId,
    reported_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "task", entity_id: data.id, actor_id: userId, action: "bug_created", title: "Bug criado", description: data.title, metadata: { severity: data.severity, priority: data.priority } });
  revalidatePath("/os/tech");
  revalidatePath("/os/tech/bugs");
  revalidatePath("/os/activity");
}

export async function createIncidentAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = incidentSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("tech_incidents").insert({
    title: input.title,
    description: nullable(input.description),
    status: input.status as TechIncidentStatus,
    severity: input.severity as TechSeverity,
    started_at: nullable(input.started_at),
    project_id: nullable(input.project_id),
    client_id: nullable(input.client_id),
    owner_id: nullable(input.owner_id) || userId,
    created_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "task", entity_id: data.id, actor_id: userId, action: "incident_created", title: "Incidente criado", description: data.title, metadata: { severity: data.severity, status: data.status } });
  revalidatePath("/os/tech");
  revalidatePath("/os/tech/incidents");
  revalidatePath("/os/activity");
}

export async function updateIncidentStatusAction(incidentId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const status = String(formData.get("status") || "investigating");
  const { error } = await supabase.from("tech_incidents").update({ status: status as TechIncidentStatus, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", incidentId);
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "task", entity_id: incidentId, actor_id: userId, action: "incident_status_changed", title: "Status de incidente atualizado", description: `Incidente mudou para ${status}.`, metadata: { status } });
  revalidatePath("/os/tech/incidents");
  revalidatePath("/os/activity");
}

export async function createBacklogItemAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = backlogItemSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("tech_backlog_items").insert({
    title: input.title,
    description: nullable(input.description),
    status: input.status as TechBacklogStatus,
    priority: input.priority as TechPriority,
    type: input.type as TechBacklogType,
    project_id: nullable(input.project_id),
    owner_id: nullable(input.owner_id) || userId,
    created_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "task", entity_id: data.id, actor_id: userId, action: "tech_backlog_created", title: "Backlog tecnico criado", description: data.title, metadata: { type: data.type, priority: data.priority } });
  revalidatePath("/os/tech/backlog");
  revalidatePath("/os/activity");
}

export async function createRoadmapItemAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = roadmapItemSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("tech_roadmap_items").insert({
    title: input.title,
    description: nullable(input.description),
    status: input.status as TechRoadmapStatus,
    priority: input.priority as TechPriority,
    target_date: nullable(input.target_date),
    project_id: nullable(input.project_id),
    owner_id: nullable(input.owner_id) || userId,
    created_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "task", entity_id: data.id, actor_id: userId, action: "tech_roadmap_created", title: "Roadmap tecnico criado", description: data.title, metadata: { priority: data.priority } });
  revalidatePath("/os/tech/roadmap");
  revalidatePath("/os/activity");
}

export async function createTechnicalDecisionAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = technicalDecisionSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("technical_decisions").insert({
    title: input.title,
    context: input.context,
    decision: input.decision,
    consequences: nullable(input.consequences),
    status: input.status as TechnicalDecisionStatus,
    project_id: nullable(input.project_id),
    created_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "task", entity_id: data.id, actor_id: userId, action: "technical_decision_created", title: "Decisao tecnica criada", description: data.title, metadata: { status: data.status } });
  revalidatePath("/os/tech/decisions");
  revalidatePath("/os/activity");
}

export async function createProjectNoteAction(projectId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = projectNoteSchema.parse({ project_id: projectId, ...Object.fromEntries(formData) });
  const { data, error } = await supabase.from("project_notes").insert({
    project_id: projectId,
    author_id: userId,
    title: input.title,
    content: input.content,
    type: input.type as ProjectNoteType
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "project", entity_id: projectId, actor_id: userId, action: "project_note_created", title: "Nota de projeto criada", description: data.title, metadata: { note_id: data.id, type: data.type } });
  revalidatePath(`/os/projects/${projectId}`);
  revalidatePath("/os/activity");
}

export async function updateBugAction(bugId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = bugSchema.parse(Object.fromEntries(formData));
  const { error } = await supabase
    .from("tech_bugs")
    .update({
      title: input.title,
      description: nullable(input.description),
      status: input.status as TechBugStatus,
      severity: input.severity as TechSeverity,
      priority: input.priority as TechPriority,
      project_id: nullable(input.project_id),
      client_id: nullable(input.client_id),
      company_id: nullable(input.company_id),
      assigned_to: nullable(input.assigned_to) || userId,
      resolved_at: ["fixed", "closed"].includes(input.status) ? new Date().toISOString() : null
    })
    .eq("id", bugId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: bugId,
    actor_id: userId,
    action: "bug_updated",
    title: "Bug atualizado",
    description: input.title,
    metadata: { status: input.status, severity: input.severity }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/bugs");
  revalidatePath("/os/activity");
}

export async function archiveBugAction(bugId: string) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase
    .from("tech_bugs")
    .update({ status: "closed" as TechBugStatus, resolved_at: new Date().toISOString() })
    .eq("id", bugId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: bugId,
    actor_id: userId,
    action: "bug_archived",
    title: "Bug arquivado",
    description: "Status do bug alterado para fechado.",
    metadata: { status: "closed" }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/bugs");
  revalidatePath("/os/activity");
}

export async function updateIncidentAction(incidentId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = incidentSchema.parse(Object.fromEntries(formData));
  const { error } = await supabase
    .from("tech_incidents")
    .update({
      title: input.title,
      description: nullable(input.description),
      status: input.status as TechIncidentStatus,
      severity: input.severity as TechSeverity,
      started_at: nullable(input.started_at),
      resolved_at: input.status === "resolved" ? new Date().toISOString() : null,
      project_id: nullable(input.project_id),
      client_id: nullable(input.client_id),
      owner_id: nullable(input.owner_id) || userId
    })
    .eq("id", incidentId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: incidentId,
    actor_id: userId,
    action: "incident_updated",
    title: "Incidente atualizado",
    description: input.title,
    metadata: { status: input.status, severity: input.severity }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/incidents");
  revalidatePath("/os/activity");
}

export async function archiveIncidentAction(incidentId: string) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase
    .from("tech_incidents")
    .update({ status: "resolved" as TechIncidentStatus, resolved_at: new Date().toISOString() })
    .eq("id", incidentId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: incidentId,
    actor_id: userId,
    action: "incident_archived",
    title: "Incidente resolvido/arquivado",
    description: "Status do incidente atualizado para resolvido.",
    metadata: { status: "resolved" }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/incidents");
  revalidatePath("/os/activity");
}

export async function updateBacklogItemAction(itemId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = backlogItemSchema.parse(Object.fromEntries(formData));
  const { error } = await supabase
    .from("tech_backlog_items")
    .update({
      title: input.title,
      description: nullable(input.description),
      status: input.status as TechBacklogStatus,
      priority: input.priority as TechPriority,
      type: input.type as TechBacklogType,
      project_id: nullable(input.project_id),
      owner_id: nullable(input.owner_id) || userId
    })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: itemId,
    actor_id: userId,
    action: "tech_backlog_updated",
    title: "Backlog tecnico atualizado",
    description: input.title,
    metadata: { status: input.status, priority: input.priority }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/backlog");
  revalidatePath("/os/activity");
}

export async function archiveBacklogItemAction(itemId: string) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase
    .from("tech_backlog_items")
    .update({ status: "archived" as TechBacklogStatus })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: itemId,
    actor_id: userId,
    action: "tech_backlog_archived",
    title: "Backlog tecnico arquivado",
    description: "Item de backlog arquivado.",
    metadata: { status: "archived" }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/backlog");
  revalidatePath("/os/activity");
}

export async function updateRoadmapItemAction(itemId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = roadmapItemSchema.parse(Object.fromEntries(formData));
  const { error } = await supabase
    .from("tech_roadmap_items")
    .update({
      title: input.title,
      description: nullable(input.description),
      status: input.status as TechRoadmapStatus,
      priority: input.priority as TechPriority,
      target_date: nullable(input.target_date),
      project_id: nullable(input.project_id),
      owner_id: nullable(input.owner_id) || userId
    })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: itemId,
    actor_id: userId,
    action: "tech_roadmap_updated",
    title: "Roadmap tecnico atualizado",
    description: input.title,
    metadata: { status: input.status, priority: input.priority }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/roadmap");
  revalidatePath("/os/activity");
}

export async function archiveRoadmapItemAction(itemId: string) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase
    .from("tech_roadmap_items")
    .update({ status: "canceled" as TechRoadmapStatus })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: itemId,
    actor_id: userId,
    action: "tech_roadmap_archived",
    title: "Roadmap tecnico cancelado",
    description: "Item de roadmap cancelado.",
    metadata: { status: "canceled" }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/roadmap");
  revalidatePath("/os/activity");
}

export async function updateTechnicalDecisionAction(decisionId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = technicalDecisionSchema.parse(Object.fromEntries(formData));
  const { error } = await supabase
    .from("technical_decisions")
    .update({
      title: input.title,
      context: input.context,
      decision: input.decision,
      consequences: nullable(input.consequences),
      status: input.status as TechnicalDecisionStatus,
      project_id: nullable(input.project_id)
    })
    .eq("id", decisionId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: decisionId,
    actor_id: userId,
    action: "technical_decision_updated",
    title: "Decisão técnica atualizada",
    description: input.title,
    metadata: { status: input.status }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/decisions");
  revalidatePath("/os/activity");
}

export async function archiveTechnicalDecisionAction(decisionId: string) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase
    .from("technical_decisions")
    .update({ status: "deprecated" as TechnicalDecisionStatus })
    .eq("id", decisionId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: decisionId,
    actor_id: userId,
    action: "technical_decision_deprecated",
    title: "Decisão técnica depreciada",
    description: "Decisão técnica marcada como depreciada.",
    metadata: { status: "deprecated" }
  });

  revalidatePath("/os/tech");
  revalidatePath("/os/tech/decisions");
  revalidatePath("/os/activity");
}
