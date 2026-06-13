import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProspects } from "@/features/prospects/data";
import { getWebhookAuditLogs, getOutreachBatches } from "@/features/outreach/data";
import { OutreachCenter } from "@/features/outreach/outreach-center";

export default async function OutreachPage() {
  const supabase = await createSupabaseServerClient();
  let userRole: string | null = null;
  let isConfigured = false;

  if (supabase) {
    isConfigured = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        userRole = profile.role;
      }
    }
  }

  // Fetch prospects, webhook audit logs, and batches in parallel
  const [
    { data: prospects, error: prospectsError },
    { data: auditLogs, error: auditError },
    { data: batches, error: batchesError }
  ] = await Promise.all([
    getProspects(),
    getWebhookAuditLogs(),
    getOutreachBatches()
  ]);

  const error = prospectsError || auditError || batchesError;

  return (
    <OutreachCenter
      prospects={prospects || []}
      auditLogs={auditLogs || []}
      batches={batches || []}
      error={error}
      isConfigured={isConfigured}
      userRole={userRole}
    />
  );
}
