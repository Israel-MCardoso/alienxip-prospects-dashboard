"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emptyToNull, formDataToProspectInput } from "./prospect-schema";

export async function createProspectAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const input = formDataToProspectInput(formData);

  const { error } = await supabase.from("prospects").insert({
    name: input.name,
    status: input.status,
    temperature: input.temperature,
    source: "manual",
    segment: emptyToNull(input.segment),
    city: emptyToNull(input.city),
    state: emptyToNull(input.state),
    instagram_url: emptyToNull(input.instagram_url),
    website_url: emptyToNull(input.website_url),
    whatsapp: emptyToNull(input.whatsapp),
    partner_name: emptyToNull(input.partner_name),
    partner_url: emptyToNull(input.partner_url),
    notes: emptyToNull(input.notes)
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/os/prospects");
  redirect("/os/prospects");
}

export async function updateProspectAction(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao esta configurado.");
  }

  const input = formDataToProspectInput(formData);

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

  revalidatePath("/os/prospects");
  redirect("/os/prospects");
}
