import { Suspense } from "react";
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
    <Suspense fallback={
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="h-28 rounded-lg bg-card/40 border border-border" />
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-card/40 border border-border" />
          ))}
        </div>
        <div className="h-40 rounded-lg bg-card/40 border border-border" />
      </div>
    }>
      <SdrCommandCenter
        prospects={prospects || []}
        auditLogs={auditLogs || []}
        batches={batches || []}
        error={prospectsError || auditError || batchesError}
        isConfigured={isConfigured}
        operatorEmail={userEmail}
      />
    </Suspense>
  );
}
