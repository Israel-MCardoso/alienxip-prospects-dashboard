import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type ActivityEntityType = "prospect" | "company" | "client" | "project" | "task" | "diagnostic" | "note" | "wiki" | "playbook" | "file";

export async function recordActivity(
  supabase: SupabaseClient<Database>,
  input: {
    entity_type: ActivityEntityType;
    entity_id: string;
    actor_id?: string | null;
    action: string;
    title: string;
    description?: string | null;
    metadata?: Json;
  }
) {
  const { error } = await supabase.from("activities").insert({
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    actor_id: input.actor_id || null,
    action: input.action,
    title: input.title,
    description: input.description || null,
    metadata: input.metadata || {}
  });

  if (error) {
    console.warn("Nao foi possivel registrar activity global.", error.message);
  }
}
