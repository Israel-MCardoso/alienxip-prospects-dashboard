"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProspectStatus } from "@/types/database";
import { recordActivity } from "@/features/workspace/activity";
import { emptyToNull, formDataToProspectInput, prospectStatuses } from "./prospect-schema";
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

export async function archiveProspectAction(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("prospects")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: id,
    actor_id: user?.id || null,
    action: "archived",
    title: "Prospect arquivado",
    description: "Prospect movido para o arquivo.",
    metadata: { status: "archived" }
  });

  revalidatePath("/os/prospects");
  revalidatePath(`/os/prospects/${id}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  redirect("/os/prospects");
}

export async function restoreProspectAction(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("prospects")
    .update({ status: "new" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: id,
    actor_id: user?.id || null,
    action: "restored",
    title: "Prospect restaurado",
    description: "Prospect restaurado para o status 'new'.",
    metadata: { status: "new" }
  });

  revalidatePath("/os/prospects");
  revalidatePath(`/os/prospects/${id}`);
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function duplicateProspectAction(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: { user } } = await supabase.auth.getUser();

  const { data: prospect, error: fetchError } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { data: newProspect, error: insertError } = await supabase
    .from("prospects")
    .insert({
      name: `Cópia de ${prospect.name}`,
      status: "new",
      temperature: prospect.temperature,
      source: prospect.source,
      segment: prospect.segment,
      city: prospect.city,
      state: prospect.state,
      instagram_url: prospect.instagram_url,
      website_url: prospect.website_url,
      whatsapp: prospect.whatsapp,
      owner_id: user?.id || null,
      responsible_user_id: user?.id || null,
      partner_name: prospect.partner_name,
      partner_url: prospect.partner_url,
      priority_score: prospect.priority_score,
      suggested_offer: prospect.suggested_offer,
      notes: prospect.notes
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: newProspect.id,
    actor_id: user?.id || null,
    action: "created",
    title: "Prospect duplicado",
    description: `Criada cópia de ${prospect.name}.`,
    metadata: { source: "duplicate", original_id: id }
  });

  revalidatePath("/os/prospects");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
  redirect(`/os/prospects/${newProspect.id}`);
}

export async function updateProspectStatusAction(id: string, status: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: { user } } = await supabase.auth.getUser();

  if (!prospectStatuses.includes(status as ProspectStatus)) {
    throw new Error(`Status inválido: ${status}`);
  }

  const { error } = await supabase
    .from("prospects")
    .update({ status: status as ProspectStatus })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: id,
    actor_id: user?.id || null,
    action_type: "status_changed",
    description: `Etapa comercial alterada.`,
    metadata: { status }
  });

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: id,
    actor_id: user?.id || null,
    action: "status_changed",
    title: "Etapa atualizada",
    description: `Etapa alterada para o status atualizado.`,
    metadata: { status }
  });

  revalidatePath("/os/prospects");
  revalidatePath(`/os/prospects/${id}`);
  revalidatePath("/os/prospects/pipeline");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function generateAiDiagnosticAction(prospectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the prospect details to make the diagnostics realistic
  const { data: prospect, error: fetchErr } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .single();

  if (fetchErr || !prospect) throw new Error("Prospect nao encontrado.");

  const segment = (prospect.segment || "").toLowerCase();
  
  // Segment-based mock AI findings
  let rating = 65;
  let summary = "Presença digital necessita de otimizações. Google Meu Negócio desatualizado.";
  let opportunities = [
    "Otimização do perfil de Google Meu Negócio para buscas locais",
    "Desenvolvimento de Landing Page de alta conversão focada em agendamentos",
    "Campanhas de tráfego pago no Meta Ads direcionando ao WhatsApp"
  ];
  let recommendedOffer = "Funil de agendamento local: Landing Page + Tráfego Pago + WhatsApp Automatizado.";
  
  if (segment.includes("dentista") || segment.includes("odont")) {
    rating = 58;
    summary = "Avaliação digital média. O consultório possui site institucional lento e perfil do Instagram sem posts focados em conversão de novos pacientes.";
    opportunities = [
      "Campanha local de Google Ads para termos de urgência ('dentista 24h', 'implante dentário')",
      "Otimização de SEO local e revisão de avaliações negativas no Google",
      "Automação de lembretes de consulta via WhatsApp integrado para reduzir faltas"
    ];
    recommendedOffer = "Presença de Autoridade: Otimização de Perfil Google + Landing Page Ultra Rápida + Campanha de Captação Local.";
  } else if (segment.includes("estetica") || segment.includes("beleza") || segment.includes("clinica")) {
    rating = 72;
    summary = "Instagram ativo com engajamento razoável, porém sem direcionamento claro de funil de vendas. WhatsApp responde de forma lenta.";
    opportunities = [
      "Criação de linktree personalizado direcionado para serviços específicos",
      "Campanhas de tráfego com criativos em vídeo mostrando 'antes e depois' no Instagram",
      "Treinamento comercial para respostas rápidas via WhatsApp com script de conversão"
    ];
    recommendedOffer = "Funil Visual: Campanha de Reels/Instagram Ads + Landing Page de Agendamento + CRM de Vendas.";
  } else if (segment.includes("pet") || segment.includes("veteri")) {
    rating = 60;
    summary = "Telefones e WhatsApp de contato inconsistentes. Google Meu Negócio sem avaliações recorrentes.";
    opportunities = [
      "Implementação de cartão virtual e link direto de WhatsApp no perfil",
      "Disparo de campanhas locais focadas em banho e tosa ou vacinação no Facebook Ads",
      "Automação de mensagens de pós-atendimento para incentivar avaliações de 5 estrelas"
    ];
    recommendedOffer = "Funil Recorrência: Landing Page de Assinatura/Plano Pet + Automação de Feedbacks + Tráfego de Geolocalização.";
  } else if (segment.includes("restaurante") || segment.includes("alimen")) {
    rating = 50;
    summary = "Perfil do Instagram sem cardápio digital acessível. Dependência exclusiva de plataformas de delivery externas (iFood), o que corrói as margens.";
    opportunities = [
      "Desenvolvimento de cardápio digital próprio sem taxas por pedido",
      "Configuração de automação de pedidos e respostas instantâneas no WhatsApp",
      "Campanhas de remarketing local nos horários de pico (almoço/jantar)"
    ];
    recommendedOffer = "Delivery Sem Taxas: Cardápio Digital Interativo + Automação de Pedidos via WhatsApp + Gestão de Tráfego Local.";
  }

  // Update prospect priority_score based on AI rating
  const finalPriorityScore = Math.max(20, Math.min(100, 100 - rating)); // Inverse: lower digital presence means higher priority/opportunity
  let finalTemp: "cold" | "warm" | "hot" = "warm";
  if (finalPriorityScore >= 80) finalTemp = "hot";
  else if (finalPriorityScore <= 40) finalTemp = "cold";

  await supabase
    .from("prospects")
    .update({ priority_score: finalPriorityScore, temperature: finalTemp, suggested_offer: recommendedOffer })
    .eq("id", prospectId);

  // Check if diagnostic already exists
  const { data: existingDiag } = await supabase
    .from("prospect_diagnostics")
    .select("id")
    .eq("prospect_id", prospectId)
    .maybeSingle();

  const payload = {
    prospect_id: prospectId,
    facebook_notes: "Instagram integrado, mas sem anúncios ativos.",
    instagram_notes: "Perfil institucional básico. Oportunidade de postar depoimentos e stories diários.",
    whatsapp_notes: "Respostas demoradas. Oportunidade de instalar fluxo de triagem automatizada.",
    website_notes: "Sem site próprio ou landing page otimizada. Apenas links genéricos.",
    google_business_notes: `Nota estimada: ${rating}/100. Poucas fotos e avaliações desatualizadas.`,
    diagnosis_summary: summary,
    opportunities: opportunities,
    created_by: user?.id || null
  };

  const result = existingDiag
    ? await supabase.from("prospect_diagnostics").update(payload).eq("id", existingDiag.id)
    : await supabase.from("prospect_diagnostics").insert(payload);

  if (result.error) throw new Error(result.error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: user?.id || null,
    action_type: "diagnostic_updated",
    description: "Diagnóstico IA gerado automaticamente.",
    metadata: { generated_by_ia: true, score: rating }
  });

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: user?.id || null,
    action: "diagnostic_updated",
    title: "Diagnóstico IA gerado",
    description: `Diagnóstico IA gerado com score digital ${rating}/100.`,
    metadata: { score: rating }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/prospects/pipeline");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}

export async function createProposalAction(prospectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data: { user } } = await supabase.auth.getUser();

  const title = String(formData.get("title") || "");
  const valueInput = formData.get("value") ? Number(formData.get("value")) : 0;
  const validUntil = String(formData.get("valid_until") || "");
  const content = String(formData.get("content") || "");

  if (!title) throw new Error("Título da proposta é obrigatório.");

  const { data: proposal, error } = await supabase
    .from("prospect_proposals")
    .insert({
      prospect_id: prospectId,
      title,
      value: valueInput,
      status: "draft",
      valid_until: emptyToNull(validUntil),
      content: emptyToNull(content),
      created_by: user?.id || null
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: user?.id || null,
    action_type: "status_changed", // or custom action type
    description: `Proposta comercial criada: "${title}"`,
    metadata: { proposal_id: proposal.id, value: valueInput }
  });

  await recordActivity(supabase, {
    entity_type: "prospect",
    entity_id: prospectId,
    actor_id: user?.id || null,
    action: "status_changed",
    title: "Proposta criada",
    description: `Proposta comercial "${title}" criada com valor de R$ ${valueInput}.`,
    metadata: { proposal_id: proposal.id }
  });

  revalidatePath(`/os/prospects/${prospectId}`);
  revalidatePath("/os/prospects/pipeline");
  revalidatePath("/os/activity");
  revalidatePath("/os/dashboard");
}
