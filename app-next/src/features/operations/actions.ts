"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CommercialTaskPriority, CommercialTaskStatus, ProjectPriority, ProjectStatus } from "@/types/database";
import { recordActivity } from "@/features/workspace/activity";
import { projectSchema, projectStatusUpdateSchema, taskSchema } from "./operations-helpers";

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

async function currentUserId() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id || null };
}

export async function createGeneralTaskAction(formData: FormData) {
  const { supabase, userId } = await currentUserId();
  const input = taskSchema.parse({
    prospect_id: formData.get("prospect_id") || "",
    company_id: formData.get("company_id") || "",
    client_id: formData.get("client_id") || "",
    project_id: formData.get("project_id") || "",
    assigned_to: formData.get("assigned_to") || "",
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    status: formData.get("status") || "pending",
    priority: formData.get("priority") || "medium",
    due_date: formData.get("due_date") || ""
  });

  const { data: task, error } = await supabase
    .from("commercial_tasks")
    .insert({
      prospect_id: nullable(input.prospect_id),
      company_id: nullable(input.company_id),
      client_id: nullable(input.client_id),
      project_id: nullable(input.project_id),
      owner_id: nullable(input.assigned_to) || userId,
      assigned_to: nullable(input.assigned_to) || userId,
      created_by: userId,
      title: input.title,
      description: nullable(input.description),
      status: input.status as CommercialTaskStatus,
      priority: input.priority as CommercialTaskPriority,
      due_date: nullable(input.due_date)
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (task.project_id) {
    await supabase.from("project_activities").insert({
      project_id: task.project_id,
      actor_id: userId,
      action_type: "task_created",
      description: "Tarefa criada no projeto.",
      metadata: { task_id: task.id, title: task.title }
    });
    await recordActivity(supabase, {
      entity_type: "project",
      entity_id: task.project_id,
      actor_id: userId,
      action: "task_created",
      title: "Tarefa criada",
      description: `Task ${task.title} criada.`,
      metadata: { task_id: task.id, title: task.title }
    });
    revalidatePath(`/os/projects/${task.project_id}`);
  }

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: task.id,
    actor_id: userId,
    action: "task_created",
    title: "Task criada",
    description: task.title,
    metadata: { project_id: task.project_id, prospect_id: task.prospect_id, client_id: task.client_id }
  });

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function completeGeneralTaskAction(taskId: string, projectId?: string | null) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("commercial_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  if (projectId) {
    await supabase.from("project_activities").insert({
      project_id: projectId,
      actor_id: userId,
      action_type: "task_completed",
      description: "Tarefa concluida no projeto.",
      metadata: { task_id: taskId }
    });
    await recordActivity(supabase, {
      entity_type: "project",
      entity_id: projectId,
      actor_id: userId,
      action: "task_completed",
      title: "Tarefa concluida",
      description: "Uma tarefa do projeto foi concluida.",
      metadata: { task_id: taskId }
    });
    revalidatePath(`/os/projects/${projectId}`);
  }

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: taskId,
    actor_id: userId,
    action: "task_completed",
    title: "Task concluida",
    description: "Tarefa marcada como concluida.",
    metadata: { project_id: projectId || null }
  });

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function createProjectAction(formData: FormData) {
  const { supabase, userId } = await currentUserId();
  const input = projectSchema.parse({
    client_id: formData.get("client_id") || "",
    company_id: formData.get("company_id") || "",
    name: formData.get("name") || "",
    description: formData.get("description") || "",
    status: formData.get("status") || "planning",
    priority: formData.get("priority") || "medium",
    start_date: formData.get("start_date") || "",
    due_date: formData.get("due_date") || "",
    owner_id: formData.get("owner_id") || ""
  });

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: nullable(input.client_id),
      company_id: nullable(input.company_id),
      name: input.name,
      description: nullable(input.description),
      status: input.status as ProjectStatus,
      priority: input.priority as ProjectPriority,
      start_date: nullable(input.start_date),
      due_date: nullable(input.due_date),
      owner_id: nullable(input.owner_id) || userId,
      created_by: userId
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("project_activities").insert({
    project_id: project.id,
    actor_id: userId,
    action_type: "project_created",
    description: "Projeto criado.",
    metadata: { status: project.status, priority: project.priority }
  });
  await recordActivity(supabase, {
    entity_type: "project",
    entity_id: project.id,
    actor_id: userId,
    action: "project_created",
    title: "Projeto criado",
    description: project.name,
    metadata: { status: project.status, priority: project.priority, client_id: project.client_id }
  });

  revalidatePath("/os/projects");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  if (project.client_id) revalidatePath(`/os/clients/${project.client_id}`);
}

export async function updateProjectStatusAction(projectId: string, formData: FormData) {
  const { supabase, userId } = await currentUserId();
  const input = projectStatusUpdateSchema.parse({ status: formData.get("status") || "active" });

  const { error } = await supabase
    .from("projects")
    .update({
      status: input.status as ProjectStatus,
      completed_at: input.status === "completed" ? new Date().toISOString() : null
    })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  await supabase.from("project_activities").insert({
    project_id: projectId,
    actor_id: userId,
    action_type: input.status === "completed" ? "project_completed" : "project_status_changed",
    description: input.status === "completed" ? "Projeto concluido." : "Status do projeto atualizado.",
    metadata: { status: input.status }
  });
  await recordActivity(supabase, {
    entity_type: "project",
    entity_id: projectId,
    actor_id: userId,
    action: input.status === "completed" ? "project_completed" : "project_status_changed",
    title: input.status === "completed" ? "Projeto concluido" : "Status de projeto atualizado",
    description: `Projeto mudou para ${input.status}.`,
    metadata: { status: input.status }
  });

  revalidatePath("/os/projects");
  revalidatePath(`/os/projects/${projectId}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const name = String(formData.get("name") || "");
  const description = String(formData.get("description") || "");
  const status = String(formData.get("status") || "active") as ProjectStatus;
  const priority = String(formData.get("priority") || "medium") as ProjectPriority;
  const start_date = String(formData.get("start_date") || "");
  const due_date = String(formData.get("due_date") || "");
  const owner_id = String(formData.get("owner_id") || "");

  if (!name) throw new Error("Nome do projeto e obrigatorio.");

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description: nullable(description),
      status,
      priority,
      start_date: nullable(start_date),
      due_date: nullable(due_date),
      owner_id: nullable(owner_id) || userData.user?.id || null
    })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "project",
    entity_id: projectId,
    actor_id: userData.user?.id || null,
    action: "project_updated",
    title: "Projeto atualizado",
    description: name,
    metadata: { status, priority }
  });

  revalidatePath("/os/projects");
  revalidatePath(`/os/projects/${projectId}`);
  revalidatePath("/os/activity");
}

export async function duplicateProjectAction(projectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { data: newProject, error: insertError } = await supabase
    .from("projects")
    .insert({
      client_id: project.client_id,
      company_id: project.company_id,
      name: `Cópia de ${project.name}`,
      description: project.description,
      status: "planning" as ProjectStatus,
      priority: project.priority,
      start_date: project.start_date,
      due_date: project.due_date,
      owner_id: userData.user?.id || null,
      created_by: userData.user?.id || null
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);

  await recordActivity(supabase, {
    entity_type: "project",
    entity_id: newProject.id,
    actor_id: userData.user?.id || null,
    action: "project_created",
    title: "Projeto duplicado",
    description: `Criada cópia de ${project.name}`,
    metadata: { original_id: projectId }
  });

  revalidatePath("/os/projects");
  revalidatePath("/os/activity");
}

export async function archiveProjectAction(projectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("projects")
    .update({ status: "canceled" as ProjectStatus })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "project",
    entity_id: projectId,
    actor_id: userData.user?.id || null,
    action: "project_archived",
    title: "Projeto arquivado",
    description: "Status do projeto atualizado para cancelado.",
    metadata: { status: "canceled" }
  });

  revalidatePath("/os/projects");
  revalidatePath(`/os/projects/${projectId}`);
  revalidatePath("/os/activity");
}

export async function updateGeneralTaskAction(taskId: string, formData: FormData) {
  const { supabase, userId } = await currentUserId();
  const input = taskSchema.parse({
    prospect_id: formData.get("prospect_id") || "",
    company_id: formData.get("company_id") || "",
    client_id: formData.get("client_id") || "",
    project_id: formData.get("project_id") || "",
    assigned_to: formData.get("assigned_to") || "",
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    status: formData.get("status") || "pending",
    priority: formData.get("priority") || "medium",
    due_date: formData.get("due_date") || ""
  });

  const { error } = await supabase
    .from("commercial_tasks")
    .update({
      prospect_id: nullable(input.prospect_id),
      company_id: nullable(input.company_id),
      client_id: nullable(input.client_id),
      project_id: nullable(input.project_id),
      assigned_to: nullable(input.assigned_to) || userId,
      title: input.title,
      description: nullable(input.description),
      status: input.status as CommercialTaskStatus,
      priority: input.priority as CommercialTaskPriority,
      due_date: nullable(input.due_date),
      completed_at: input.status === "completed" ? new Date().toISOString() : null
    })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: taskId,
    actor_id: userId,
    action: "task_updated",
    title: "Task atualizada",
    description: input.title,
    metadata: { status: input.status, priority: input.priority }
  });

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  if (input.project_id) revalidatePath(`/os/projects/${input.project_id}`);
}

export async function duplicateGeneralTaskAction(taskId: string) {
  const { supabase, userId } = await currentUserId();
  const { data: task, error: fetchError } = await supabase
    .from("commercial_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { data: newTask, error: insertError } = await supabase
    .from("commercial_tasks")
    .insert({
      prospect_id: task.prospect_id,
      company_id: task.company_id,
      client_id: task.client_id,
      project_id: task.project_id,
      owner_id: userId,
      assigned_to: task.assigned_to,
      title: `Copia de ${task.title}`,
      description: task.description,
      status: "pending" as CommercialTaskStatus,
      priority: task.priority,
      due_date: task.due_date,
      created_by: userId
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: newTask.id,
    actor_id: userId,
    action: "task_created",
    title: "Task duplicada",
    description: `Criada copia de ${task.title}`,
    metadata: { original_id: taskId }
  });

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  if (task.project_id) revalidatePath(`/os/projects/${task.project_id}`);
}

export async function archiveGeneralTaskAction(taskId: string) {
  const { supabase, userId } = await currentUserId();
  const { data: task, error: fetchError } = await supabase
    .from("commercial_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from("commercial_tasks")
    .update({ status: "canceled" as CommercialTaskStatus })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "task",
    entity_id: taskId,
    actor_id: userId,
    action: "task_archived",
    title: "Task cancelada",
    description: `Tarefa cancelada/arquivada: ${task.title}`,
    metadata: { status: "canceled" }
  });

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  if (task.project_id) revalidatePath(`/os/projects/${task.project_id}`);
}

