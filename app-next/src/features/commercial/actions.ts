"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/features/workspace/activity";
import type { ClientStatus, CommercialTaskPriority, CommercialTaskStatus, ContractStatus, ProspectStatus } from "@/types/database";
import { buildCompanyClientFromProspect, conversionSchema, taskSchema } from "./commercial-helpers";

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

export async function createCompanyAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const name = String(formData.get("name") || "");
  const legal_name = String(formData.get("legal_name") || "");
  const segment = String(formData.get("segment") || "");
  const city = String(formData.get("city") || "");
  const state = String(formData.get("state") || "");
  const website_url = String(formData.get("website_url") || "");
  const instagram_url = String(formData.get("instagram_url") || "");
  const whatsapp = String(formData.get("whatsapp") || "");
  const notes = String(formData.get("notes") || "");

  if (!name) throw new Error("Nome da empresa e obrigatorio.");

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      legal_name: nullable(legal_name),
      segment: nullable(segment),
      city: nullable(city),
      state: nullable(state),
      website_url: nullable(website_url),
      instagram_url: nullable(instagram_url),
      whatsapp: nullable(whatsapp),
      notes: nullable(notes),
      owner_id: userData.user?.id || null
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "company",
    entity_id: data.id,
    actor_id: userData.user?.id || null,
    action: "company_created",
    title: "Empresa criada",
    description: data.name,
    metadata: { source: "manual" }
  });

  revalidatePath("/os/companies");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function updateCompanyAction(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const name = String(formData.get("name") || "");
  const legal_name = String(formData.get("legal_name") || "");
  const segment = String(formData.get("segment") || "");
  const city = String(formData.get("city") || "");
  const state = String(formData.get("state") || "");
  const website_url = String(formData.get("website_url") || "");
  const instagram_url = String(formData.get("instagram_url") || "");
  const whatsapp = String(formData.get("whatsapp") || "");
  const notes = String(formData.get("notes") || "");

  if (!name) throw new Error("Nome da empresa e obrigatorio.");

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      legal_name: nullable(legal_name),
      segment: nullable(segment),
      city: nullable(city),
      state: nullable(state),
      website_url: nullable(website_url),
      instagram_url: nullable(instagram_url),
      whatsapp: nullable(whatsapp),
      notes: nullable(notes)
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "company",
    entity_id: id,
    actor_id: userData.user?.id || null,
    action: "company_updated",
    title: "Empresa atualizada",
    description: name,
    metadata: { source: "manual" }
  });

  revalidatePath("/os/companies");
  revalidatePath(`/os/companies/${id}`);
  revalidatePath("/os/activity");
}

export async function createClientFromCompanyAction(companyId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Usuario nao autenticado.");

  const status = String(formData.get("status") || "active") as ClientStatus;
  const contract_status = String(formData.get("contract_status") || "draft") as ContractStatus;
  const main_contact_name = String(formData.get("main_contact_name") || "");
  const main_contact_email = String(formData.get("main_contact_email") || "");
  const main_contact_phone = String(formData.get("main_contact_phone") || "");
  const start_date = String(formData.get("start_date") || "");

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .single();

  if (companyError) throw new Error(companyError.message);
  if (!company) throw new Error("Empresa nao encontrada.");

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      company_id: company.id,
      status,
      contract_status,
      monthly_value: optionalNumber(formData.get("monthly_value")),
      start_date: nullable(start_date),
      main_contact_name: nullable(main_contact_name),
      main_contact_email: nullable(main_contact_email),
      main_contact_phone: nullable(main_contact_phone),
      owner_id: userId
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "client",
    entity_id: client.id,
    actor_id: userId,
    action: "client_created",
    title: "Cliente criado",
    description: main_contact_name || company.name,
    metadata: { company_id: company.id, source: "company_workspace" }
  });

  await recordActivity(supabase, {
    entity_type: "company",
    entity_id: company.id,
    actor_id: userId,
    action: "client_created",
    title: "Cliente vinculado",
    description: main_contact_name || "Novo cliente vinculado a empresa.",
    metadata: { client_id: client.id, source: "company_workspace" }
  });

  revalidatePath(`/os/companies/${company.id}`);
  revalidatePath(`/os/clients/${client.id}`);
  revalidatePath("/os/clients");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const status = String(formData.get("status") || "active") as ClientStatus;
  const contract_status = String(formData.get("contract_status") || "draft") as ContractStatus;
  const monthly_value = formData.get("monthly_value") ? Number(formData.get("monthly_value")) : null;
  const main_contact_name = String(formData.get("main_contact_name") || "");
  const main_contact_email = String(formData.get("main_contact_email") || "");
  const main_contact_phone = String(formData.get("main_contact_phone") || "");

  const { error } = await supabase
    .from("clients")
    .update({
      status,
      contract_status,
      monthly_value,
      main_contact_name: nullable(main_contact_name),
      main_contact_email: nullable(main_contact_email),
      main_contact_phone: nullable(main_contact_phone)
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "client",
    entity_id: id,
    actor_id: userData.user?.id || null,
    action: "client_updated",
    title: "Cliente atualizado",
    description: main_contact_name || id,
    metadata: { status, contract_status }
  });

  revalidatePath("/os/clients");
  revalidatePath(`/os/clients/${id}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function archiveClientAction(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("clients")
    .update({
      status: "former" as ClientStatus,
      contract_status: "cancelled" as ContractStatus
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "client",
    entity_id: id,
    actor_id: userData.user?.id || null,
    action: "client_archived",
    title: "Cliente arquivado",
    description: "Cliente definido como 'former' e contrato cancelado.",
    metadata: { status: "former", contract_status: "cancelled" }
  });

  revalidatePath("/os/clients");
  revalidatePath(`/os/clients/${id}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function restoreClientAction(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("clients")
    .update({
      status: "active" as ClientStatus,
      contract_status: "active" as ContractStatus
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "client",
    entity_id: id,
    actor_id: userData.user?.id || null,
    action: "client_restored",
    title: "Cliente restaurado",
    description: "Cliente reativado no workspace.",
    metadata: { status: "active", contract_status: "active" }
  });

  revalidatePath("/os/clients");
  revalidatePath(`/os/clients/${id}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}
