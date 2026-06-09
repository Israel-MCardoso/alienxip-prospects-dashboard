"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CommercialTaskPriority, CommercialTaskStatus, ProjectPriority, ProjectStatus } from "@/types/database";
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
    revalidatePath(`/os/projects/${task.project_id}`);
  }

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
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
    revalidatePath(`/os/projects/${projectId}`);
  }

  revalidatePath("/os/tasks");
  revalidatePath("/os/calendar");
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

  revalidatePath("/os/projects");
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

  revalidatePath("/os/projects");
  revalidatePath(`/os/projects/${projectId}`);
}
