"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // Dispatch logic using server-side local fetch or direct webhook invocation
  const publicUrl = process.env.MOTHERXIP_PUBLIC_URL || "http://localhost:3000";
  
  // Call dispatch API route internally to ensure identical validation/dispatch flow
  const response = await fetch(`${publicUrl}/api/outreach/dispatch`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Forward the user's cookies to authenticate internal request
      cookie: (await import("next/headers")).cookies().toString()
    },
    body: JSON.stringify({ prospect_ids: [prospectId], automation_source: "sandbox" })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha no reenvio: ${errorText}`);
  }

  const result = await response.json();
  const dispatchResult = result.results?.[0];
  if (dispatchResult && !dispatchResult.success) {
    throw new Error(dispatchResult.error || "Falha no dispatch.");
  }

  revalidatePath("/os/outreach");
  revalidatePath(`/os/prospects/${prospectId}`);
}

export async function testSdrSandboxAction(prospectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const publicUrl = process.env.MOTHERXIP_PUBLIC_URL || "http://localhost:3000";
  const response = await fetch(`${publicUrl}/api/outreach/dispatch`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: (await import("next/headers")).cookies().toString()
    },
    body: JSON.stringify({ prospect_ids: [prospectId], automation_source: "sandbox" })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha no teste SDR Sandbox: ${errorText}`);
  }

  revalidatePath("/os/outreach");
  revalidatePath(`/os/prospects/${prospectId}`);
}
