"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/features/workspace/activity";
import type { ClientStatus, CommercialTaskPriority, CommercialTaskStatus, ContractStatus, ProspectStatus } from "@/types/database";
import { buildCompanyClientFromProspect, conversionSchema, taskSchema } from "./commercial-helpers";

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function createTaskAction(prospectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");

  const { data: userData } = await supabase.auth.getUser();
  const input = taskSchema.parse({
    title: formData.get("title") || "",
    description: formData.get("description") || "",
    status: formData.get("status") || "pending",
    priority: formData.get("priority") || "medium",
    due_date: formData.get("due_date") || ""
  });

  const { error } = await supabase.from("commercial_tasks").insert({
    prospect_id: prospectId,
    owner_id: userData.user?.id || null,
    assigned_to: userData.user?.id || null,
    created_by: userData.user?.id || null,
    title: input.title,
    description: nullable(input.description),
    status: input.status as CommercialTaskStatus,
    priority: input.priority as CommercialTaskPriority,
    due_date: nullable(input.due_date)
  });

  if (error) throw new Error(error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: userData.user?.id || null,
    action_type: "task_created",
    description: "Follow-up/tarefa criada.",
    metadata: { title: input.title, priority: input.priority }
  });
  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: userData.user?.id || null,
    action: "task_created",
    title: "Task criada",
    description: input.title,
    metadata: { priority: input.priority }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/prospects/pipeline");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function completeTaskAction(prospectId: string, taskId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("commercial_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: userData.user?.id || null,
    action_type: "task_completed",
    description: "Follow-up/tarefa concluida.",
    metadata: { task_id: taskId }
  });
  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: userData.user?.id || null,
    action: "task_completed",
    title: "Task concluida",
    description: "Follow-up/tarefa concluida.",
    metadata: { task_id: taskId }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/prospects/pipeline");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function convertProspectAction(prospectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const conversion = conversionSchema.parse({
    main_contact_name: formData.get("main_contact_name") || "",
    main_contact_email: formData.get("main_contact_email") || "",
    main_contact_phone: formData.get("main_contact_phone") || "",
    monthly_value: formData.get("monthly_value") || "",
    contract_status: formData.get("contract_status") || "draft"
  });

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .single();

  if (prospectError) throw new Error(prospectError.message);
  if (prospect.converted_client_id) {
    revalidatePath(`/os/prospects/${prospectId}`);
    return;
  }

  const payload = buildCompanyClientFromProspect(prospect, conversion);
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ ...payload.company, owner_id: userData.user?.id || null })
    .select("*")
    .single();

  if (companyError) throw new Error(companyError.message);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      company_id: company.id,
      status: (payload.client.status || "active") as ClientStatus,
      contract_status: (payload.client.contract_status || "draft") as ContractStatus,
      monthly_value: payload.client.monthly_value,
      start_date: payload.client.start_date,
      main_contact_name: payload.client.main_contact_name,
      main_contact_email: payload.client.main_contact_email,
      main_contact_phone: payload.client.main_contact_phone,
      owner_id: userData.user?.id || null
    })
    .select("*")
    .single();

  if (clientError) throw new Error(clientError.message);

  await supabase
    .from("prospects")
    .update({
      status: "fechado" as ProspectStatus,
      owner_id: userData.user?.id || null,
      converted_company_id: company.id,
      converted_client_id: client.id,
      converted_at: new Date().toISOString()
    })
    .eq("id", prospectId);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: userData.user?.id || null,
    action_type: "converted_to_client",
    description: "Prospect convertido em empresa/cliente.",
    metadata: { company_id: company.id, client_id: client.id }
  });
  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: userData.user?.id || null,
    action: "converted_to_client",
    title: "Prospect convertido em cliente",
    description: "Prospect convertido em empresa/cliente.",
    metadata: { company_id: company.id, client_id: client.id }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/clients");
  revalidatePath("/os/companies");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}
