import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, ProspectStatus, ProspectTemperature } from "@/types/database";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import { getEntityFiles } from "@/features/tech/data";
import type { ProspectOutreachRow, OutreachEventRow } from "@/types/outreach";

export type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"] & {
  prospect_outreach?: ProspectOutreachRow[] | null;
};
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProspectDiagnosticRow = Database["public"]["Tables"]["prospect_diagnostics"]["Row"];
export type ProspectNoteRow = Database["public"]["Tables"]["prospect_notes"]["Row"];
export type ProspectActivityRow = Database["public"]["Tables"]["prospect_activities"]["Row"];
export type CommercialTaskRow = Database["public"]["Tables"]["commercial_tasks"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type ProspectProposalRow = {
  id: string;
  prospect_id: string;
  title: string;
  value: number;
  status: string;
  valid_until: string | null;
  content: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProspects(filters?: {
  q?: string;
  status?: string;
  temperature?: string;
  mine?: string;
  outreach?: string;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      data: [] as ProspectRow[],
      error: "Supabase nao configurado. Configure .env.local para carregar prospects reais.",
      isConfigured: false
    };
  }
  const db = createSupabaseAdminClient();

  let query = db
    .from("prospects")
    .select("*, prospect_outreach(*)")
    .order("updated_at", { ascending: false });

  if (filters?.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  if (filters?.status && prospectStatuses.includes(filters.status as ProspectStatus)) {
    query = query.eq("status", filters.status as ProspectStatus);
  }

  if (filters?.temperature && prospectTemperatures.includes(filters.temperature as ProspectTemperature)) {
    query = query.eq("temperature", filters.temperature as ProspectTemperature);
  }

  if (filters?.mine === "1") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) {
      query = query.or(`owner_id.eq.${userData.user.id},responsible_user_id.eq.${userData.user.id}`);
    }
  }

  const { data: rawData, error } = await query;
  let data = (rawData || []) as unknown as ProspectRow[];

  if (filters?.outreach) {
    data = data.filter((p) => {
      const hasPhone = p.whatsapp && p.whatsapp.replace(/\D/g, "").length >= 8;
      const outreach = p.prospect_outreach?.[0] || null;

      if (filters.outreach === "ready") {
        // Pronto para automação: WhatsApp/telefone com 8-15 dígitos e status inativo ou sem registro
        const isInactive = !outreach || ["not_started", "stopped", "failed", "disqualified", "paused"].includes(outreach.status);
        return hasPhone && isInactive;
      }
      if (filters.outreach === "active") {
        // Em automação: status ativo
        return outreach && ["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(outreach.status);
      }
      if (filters.outreach === "meeting") {
        // Reunião marcada
        return outreach && outreach.status === "meeting_scheduled";
      }
      if (filters.outreach === "failed") {
        // Falhou
        return outreach && outreach.status === "failed";
      }
      return true;
    });
  }

  return {
    data,
    error: error?.message || null,
    isConfigured: true
  };
}

export async function getProspect(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { data: null, error: "Supabase nao configurado.", isConfigured: false };
  }
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("prospects")
    .select("*, prospect_outreach(*)")
    .eq("id", id)
    .single();

  return {
    data,
    error: error?.message || null,
    isConfigured: true
  };
}

export async function getProspectWorkspace(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      prospect: null,
      diagnostic: null,
      notes: [] as ProspectNoteRow[],
      activities: [] as ProspectActivityRow[],
      tasks: [] as CommercialTaskRow[],
      files: [] as FileRow[],
      proposals: [] as ProspectProposalRow[],
      profile: null,
      outreach: null as ProspectOutreachRow | null,
      outreachEvents: [] as OutreachEventRow[],
      error: "Supabase nao configurado.",
      isConfigured: false
    };
  }
  const db = createSupabaseAdminClient();

  const [
    prospectResult,
    diagnosticResult,
    notesResult,
    activitiesResult,
    tasksResult,
    filesResult,
    userResult,
    outreachResult,
    outreachEventsResult,
    proposalsResult,
    allProfilesResult
  ] = await Promise.all([
    supabase.from("prospects").select("*").eq("id", id).single(),
    supabase.from("prospect_diagnostics").select("*").eq("prospect_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("prospect_notes").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
    supabase.from("prospect_activities").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
    supabase.from("commercial_tasks").select("*").eq("prospect_id", id).order("due_date", { ascending: true }),
    getEntityFiles("prospect", id),
    supabase.auth.getUser(),
    db.from("prospect_outreach").select("*").eq("prospect_id", id).maybeSingle(),
    db.from("outreach_events").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
    (async () => {
      try {
        return await supabase.from("prospect_proposals").select("*").eq("prospect_id", id).order("created_at", { ascending: false });
      } catch {
        return { data: null, error: null };
      }
    })(),
    db.from("profiles").select("id, full_name, email, role, is_active").eq("is_active", true).order("email", { ascending: true })
  ]);

  const proposals: ProspectProposalRow[] = (proposalsResult.data as unknown as ProspectProposalRow[]) || [];

  const userId = userResult.data.user?.id;
  const profileResult = userId
    ? await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
    : { data: null };

  const errorMsg = prospectResult.error?.message ||
    diagnosticResult.error?.message ||
    notesResult.error?.message ||
    activitiesResult.error?.message ||
    tasksResult.error?.message ||
    filesResult.error ||
    outreachResult.error?.message ||
    outreachEventsResult.error?.message ||
    allProfilesResult.error?.message ||
    null;

  return {
    prospect: prospectResult.data,
    diagnostic: diagnosticResult.data,
    notes: notesResult.data || [],
    activities: activitiesResult.data || [],
    tasks: tasksResult.data || [],
    files: filesResult.data || [],
    proposals,
    profile: profileResult.data,
    profiles: (allProfilesResult.data || []) as ProfileRow[],
    outreach: (outreachResult.data || null) as unknown as ProspectOutreachRow | null,
    outreachEvents: (outreachEventsResult.data || []) as unknown as OutreachEventRow[],
    error: errorMsg,
    isConfigured: true
  };
}
