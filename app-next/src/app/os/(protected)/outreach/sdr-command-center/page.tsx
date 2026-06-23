import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProspects } from "@/features/prospects/data";
import { getOutreachBatches, getWebhookAuditLogs } from "@/features/outreach/data";
import { SdrCommandCenter } from "@/features/outreach/sdr-command-center";

export default async function SdrCommandCenterPage() {
  const supabase = await createSupabaseServerClient();
  let userEmail: string | null = null;
  let isConfigured = false;

  if (supabase) {
    isConfigured = true;
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email || null;
  }

  const [
    { data: prospects, error: prospectsError },
    { data: auditLogs, error: auditError },
    { data: batches, error: batchesError }
  ] = await Promise.all([
    getProspects(),
    getWebhookAuditLogs(),
    getOutreachBatches()
  ]);

  return (
    <SdrCommandCenter
      prospects={prospects || []}
      auditLogs={auditLogs || []}
      batches={batches || []}
      error={prospectsError || auditError || batchesError}
      isConfigured={isConfigured}
      operatorEmail={userEmail}
    />
  );
}
