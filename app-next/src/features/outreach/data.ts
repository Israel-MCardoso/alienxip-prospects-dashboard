import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { WebhookAuditLogRow, OutreachBatchRow } from "@/types/outreach";

export async function getWebhookAuditLogs() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      data: [] as WebhookAuditLogRow[],
      error: "Supabase não configurado."
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      data: [] as WebhookAuditLogRow[],
      error: "Usuario nao autenticado."
    };
  }
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("webhook_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50); // Fetch the latest 50 entries

  return {
    data: (data || []) as WebhookAuditLogRow[],
    error: error?.message || null
  };
}

export async function getOutreachBatches() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      data: [] as OutreachBatchRow[],
      error: "Supabase não configurado."
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      data: [] as OutreachBatchRow[],
      error: "Usuario nao autenticado."
    };
  }
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("outreach_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    data: (data || []) as OutreachBatchRow[],
    error: error?.message || null
  };
}
