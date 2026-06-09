"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/features/workspace/activity";
import { emptyToNull, formDataToProspectInput } from "./prospect-schema";
import { diagnosticSchema, noteSchema } from "./workspace-helpers";

export async function createProspectAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const input = formDataToProspectInput(formData);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: prospect, error } = await supabase.from("prospects").insert({
    name: input.name,
    status: input.status,
    temperature: input.temperature,
    source: "manual",
    owner_id: user?.id || null,
    responsible_user_id: user?.id || null,
    segment: emptyToNull(input.segment),
    city: emptyToNull(input.city),
    state: emptyToNull(input.state),
    instagram_url: emptyToNull(input.instagram_url),
    website_url: emptyToNull(input.website_url),
    whatsapp: emptyToNull(input.whatsapp),
    partner_name: emptyToNull(input.partner_name),
    partner_url: emptyToNull(input.partner_url),
    notes: emptyToNull(input.notes)
  }).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospect.id,
    actor_id: user?.id || null,
    action: "created",
    title: "Prospect criado",
    description: prospect.name,
    metadata: { source: "manual" }
  });

  revalidatePath("/os/prospects");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  redirect("/os/prospects");
}

export async function updateProspectAction(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const input = formDataToProspectInput(formData);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("prospects")
    .update({
      name: input.name,
      status: input.status,
      temperature: input.temperature,
      segment: emptyToNull(input.segment),
      city: emptyToNull(input.city),
      state: emptyToNull(input.state),
      instagram_url: emptyToNull(input.instagram_url),
      website_url: emptyToNull(input.website_url),
      whatsapp: emptyToNull(input.whatsapp),
      partner_name: emptyToNull(input.partner_name),
      partner_url: emptyToNull(input.partner_url),
      notes: emptyToNull(input.notes)
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("prospect_activities").insert({
    prospect_id: id,
    actor_id: user?.id || null,
    action_type: "updated",
    description: "Dados principais do prospect atualizados.",
    metadata: { source: "workspace" }
  });
  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: id,
    actor_id: user?.id || null,
    action: "updated",
    title: "Prospect atualizado",
    description: "Dados principais do prospect atualizados.",
    metadata: { source: "workspace" }
  });

  revalidatePath("/os/prospects");
  revalidatePath(`/os/prospects/${id}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  redirect("/os/prospects");
}

export async function saveDiagnosticAction(prospectId: string, diagnosticId: string | null, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const input = diagnosticSchema.parse({
    facebook_notes: formData.get("facebook_notes") || "",
    instagram_notes: formData.get("instagram_notes") || "",
    whatsapp_notes: formData.get("whatsapp_notes") || "",
    website_notes: formData.get("website_notes") || "",
    google_business_notes: formData.get("google_business_notes") || "",
    diagnosis_summary: formData.get("diagnosis_summary") || "",
    opportunities: formData.get("opportunities") || ""
  });

  const payload = {
    prospect_id: prospectId,
    facebook_notes: input.facebook_notes || null,
    instagram_notes: input.instagram_notes || null,
    whatsapp_notes: input.whatsapp_notes || null,
    website_notes: input.website_notes || null,
    google_business_notes: input.google_business_notes || null,
    diagnosis_summary: input.diagnosis_summary || null,
    opportunities: input.opportunities,
    created_by: user?.id || null
  };

  const result = diagnosticId
    ? await supabase.from("prospect_diagnostics").update(payload).eq("id", diagnosticId)
    : await supabase.from("prospect_diagnostics").insert(payload);

  if (result.error) throw new Error(result.error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: user?.id || null,
    action_type: diagnosticId ? "diagnostic_updated" : "diagnostic_created",
    description: diagnosticId ? "Diagnostico digital atualizado." : "Diagnostico digital criado.",
    metadata: { source: "workspace" }
  });
  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: user?.id || null,
    action: diagnosticId ? "diagnostic_updated" : "diagnostic_created",
    title: diagnosticId ? "Diagnostico atualizado" : "Diagnostico criado",
    description: diagnosticId ? "Diagnostico digital atualizado." : "Diagnostico digital criado.",
    metadata: { source: "workspace" }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function createNoteAction(prospectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const input = noteSchema.parse({
    content: formData.get("content") || "",
    type: formData.get("type") || "observacao"
  });

  const { error } = await supabase.from("prospect_notes").insert({
    prospect_id: prospectId,
    author_id: user?.id || null,
    content: input.content,
    type: input.type
  });

  if (error) throw new Error(error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: user?.id || null,
    action_type: "note_created",
    description: "Nota interna criada.",
    metadata: { note_type: input.type }
  });
  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: user?.id || null,
    action: "note_created",
    title: "Nota criada",
    description: "Nota interna criada.",
    metadata: { note_type: input.type }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/activity");
}

export async function updateNoteAction(prospectId: string, noteId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const input = noteSchema.parse({
    content: formData.get("content") || "",
    type: formData.get("type") || "observacao"
  });

  const { error } = await supabase
    .from("prospect_notes")
    .update({
      content: input.content,
      type: input.type
    })
    .eq("id", noteId)
    .eq("prospect_id", prospectId);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: user?.id || null,
    action: "note_updated",
    title: "Nota atualizada",
    description: "Nota interna atualizada.",
    metadata: { note_id: noteId, note_type: input.type }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/activity");
}
