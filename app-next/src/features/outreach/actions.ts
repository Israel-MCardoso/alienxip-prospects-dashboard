"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertOutreachOperator, dispatchOutreachBatch } from "./dispatch-service";

export async function pauseOutreachAction(prospectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: rawOutreach } = await supabase
    .from("prospect_outreach")
    .select("id")
    .eq("prospect_id", prospectId)
    .maybeSingle();

  const outreach = rawOutreach as unknown as { id: string } | null;
  if (!outreach) throw new Error("Automação de outreach não encontrada.");

  const { error } = await supabase
    .from("prospect_outreach")
    .update({
      status: "paused",
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", outreach.id);

  if (error) throw new Error(error.message);

  await supabase.from("outreach_events").insert({
    prospect_id: prospectId,
    outreach_id: outreach.id,
    event_type: "automation_paused",
    status: "paused",
    message: "Automação pausada manualmente pelo usuário."
  });

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: user.id,
    action_type: "updated",
    description: "Automação de outreach pausada manualmente."
  });

  revalidatePath("/os/outreach");
  revalidatePath(`/os/prospects/${prospectId}`);
}

export async function stopOutreachAction(prospectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: rawOutreach } = await supabase
    .from("prospect_outreach")
    .select("id")
    .eq("prospect_id", prospectId)
    .maybeSingle();

  const outreach = rawOutreach as unknown as { id: string } | null;
  if (!outreach) throw new Error("Automação de outreach não encontrada.");

  const { error } = await supabase
    .from("prospect_outreach")
    .update({
      status: "stopped",
      stopped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", outreach.id);

  if (error) throw new Error(error.message);

  await supabase.from("outreach_events").insert({
    prospect_id: prospectId,
    outreach_id: outreach.id,
    event_type: "automation_stopped",
    status: "stopped",
    message: "Automação parada manualmente pelo usuário."
  });

  await supabase.from("prospect_activities").insert({
    prospect_id: prospectId,
    actor_id: user.id,
    action_type: "updated",
    description: "Automação de outreach parada manualmente."
  });

  revalidatePath("/os/outreach");
  revalidatePath(`/os/prospects/${prospectId}`);
}

export async function resumeOutreachAction(prospectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  await assertOutreachOperator(user.id);

  await dispatchOutreachBatch({
    prospect_ids: [prospectId],
    automation_source: "sandbox",
    user_id: user.id,
    user_email: user.email ?? null
  });

  revalidatePath("/os/outreach");
  revalidatePath(`/os/prospects/${prospectId}`);
}

export async function testSdrSandboxAction(prospectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  await assertOutreachOperator(user.id);

  await dispatchOutreachBatch({
    prospect_ids: [prospectId],
    automation_source: "sandbox",
    user_id: user.id,
    user_email: user.email ?? null
  });

  revalidatePath("/os/outreach");
  revalidatePath(`/os/prospects/${prospectId}`);
}
