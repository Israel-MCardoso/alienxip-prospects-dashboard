type OutreachLike = {
  status?: string | null;
  channel?: string | null;
  automation_source?: string | null;
  n8n_execution_id?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  meeting_scheduled_at?: string | null;
  meeting_title?: string | null;
  error_message?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type EventLike = {
  event_type?: string | null;
  status?: string | null;
  channel?: string | null;
  message?: string | null;
  n8n_execution_id?: string | null;
  metadata?: unknown;
  created_at?: string | null;
};

export type SdrProspectLike = {
  id?: string | null;
  name?: string | null;
  nome?: string | null;
  empresa?: string | null;
  company_name?: string | null;
  city?: string | null;
  cidade?: string | null;
  segment?: string | null;
  segmento?: string | null;
  temperature?: string | null;
  temperatura?: string | null;
  status?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  telefone?: string | null;
  do_not_contact?: boolean | null;
  updated_at?: string | null;
  prospect_outreach?: OutreachLike[] | null;
  outreach_events?: EventLike[] | null;
};

export type SdrFilters = {
  city?: string;
  segment?: string;
  temperature?: string;
  crmStatus?: string;
  automationStatus?: string;
  meetingScheduled?: boolean;
  optOut?: boolean;
  validPhone?: boolean;
  waitingReply?: boolean;
  failure?: boolean;
};

const ACTIVE_STATUSES = new Set(["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"]);
const BLOCKED_STATUSES = new Set(["opt_out", "stopped", "paused", "meeting_scheduled", "failed", "disqualified"]);

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function includesNormalized(value: unknown, query: string | undefined) {
  const needle = normalizeText(query);
  return !needle || normalizeText(value).includes(needle);
}

export function getProspectCompany(prospect: SdrProspectLike) {
  return prospect.name || prospect.nome || prospect.empresa || prospect.company_name || "Prospect sem nome";
}

export function getProspectCity(prospect: SdrProspectLike) {
  return prospect.city || prospect.cidade || "";
}

export function getProspectSegment(prospect: SdrProspectLike) {
  return prospect.segment || prospect.segmento || "";
}

export function getProspectTemperature(prospect: SdrProspectLike) {
  return prospect.temperature || prospect.temperatura || "";
}

export function getProspectPhone(prospect: SdrProspectLike) {
  return prospect.whatsapp || prospect.phone || prospect.telefone || "";
}

export function getCurrentOutreach(prospect: SdrProspectLike) {
  return prospect.prospect_outreach?.[0] || null;
}

export function hasValidSdrPhone(prospect: SdrProspectLike) {
  const digits = getProspectPhone(prospect).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function filterSdrLeads(prospects: SdrProspectLike[], filters: SdrFilters) {
  return prospects.filter((prospect) => {
    const outreach = getCurrentOutreach(prospect);
    const automationStatus = outreach?.status || "not_started";

    if (!includesNormalized(getProspectCity(prospect), filters.city)) return false;
    if (!includesNormalized(getProspectSegment(prospect), filters.segment)) return false;
    if (filters.temperature && normalizeText(getProspectTemperature(prospect)) !== normalizeText(filters.temperature)) return false;
    if (filters.crmStatus && normalizeText(prospect.status) !== normalizeText(filters.crmStatus)) return false;
    if (filters.automationStatus && normalizeText(automationStatus) !== normalizeText(filters.automationStatus)) return false;
    if (filters.meetingScheduled && automationStatus !== "meeting_scheduled") return false;
    if (filters.optOut && automationStatus !== "opt_out") return false;
    if (filters.validPhone && !hasValidSdrPhone(prospect)) return false;
    if (filters.waitingReply && automationStatus !== "waiting_reply") return false;
    if (filters.failure && automationStatus !== "failed") return false;

    return true;
  });
}

export function isEligibleForSdrAutomation(prospect: SdrProspectLike) {
  const outreach = getCurrentOutreach(prospect);
  const status = outreach?.status || "not_started";

  if (!prospect.id) return { eligible: false, reason: "Prospect sem ID" };
  if (!hasValidSdrPhone(prospect)) return { eligible: false, reason: "Telefone invalido" };
  if (prospect.do_not_contact) return { eligible: false, reason: "Marcado como nao contatar" };
  if (BLOCKED_STATUSES.has(status)) return { eligible: false, reason: `Status bloqueado: ${status}` };

  return { eligible: true, reason: "Elegivel para sandbox SDR" };
}

export function getEligibleLeads(prospects: SdrProspectLike[]) {
  return prospects.filter((prospect) => isEligibleForSdrAutomation(prospect).eligible);
}

export function buildSdrDashboardMetrics(prospects: SdrProspectLike[], batches: Array<{ status?: string | null }> = []) {
  const outreachRows = prospects.map(getCurrentOutreach).filter(Boolean) as OutreachLike[];

  return {
    eligible: getEligibleLeads(prospects).length,
    inAutomation: outreachRows.length,
    activeConversations: outreachRows.filter((row) => ["replied", "waiting_reply", "negotiating"].includes(row.status || "")).length,
    waitingReply: outreachRows.filter((row) => row.status === "waiting_reply").length,
    negotiations: outreachRows.filter((row) => row.status === "negotiating").length,
    meetingsScheduled: outreachRows.filter((row) => row.status === "meeting_scheduled").length,
    optOut: outreachRows.filter((row) => row.status === "opt_out").length,
    failures: outreachRows.filter((row) => row.status === "failed").length,
    activeBatches: batches.filter((batch) => ["created", "dispatched", "partially_dispatched"].includes(batch.status || "")).length
  };
}

export function buildTimeline(prospect: SdrProspectLike) {
  const events = (prospect.outreach_events || []).map((event) => ({
    event_type: event.event_type || event.status || "evento",
    status: event.status || event.event_type || "not_started",
    message: event.message || null,
    n8n_execution_id: event.n8n_execution_id || null,
    created_at: event.created_at || new Date(0).toISOString()
  }));

  const outreach = getCurrentOutreach(prospect);
  if (outreach?.status) {
    events.push({
      event_type: "current_status",
      status: outreach.status,
      message: outreach.last_message_preview || outreach.error_message || null,
      n8n_execution_id: outreach.n8n_execution_id || null,
      created_at: outreach.updated_at || outreach.last_message_at || outreach.created_at || new Date(0).toISOString()
    });
  }

  return events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function buildConversationInbox(prospects: SdrProspectLike[]) {
  return prospects
    .map((prospect) => {
      const outreach = getCurrentOutreach(prospect);
      return {
        prospect_id: prospect.id || "",
        company: getProspectCompany(prospect),
        origin: outreach?.channel || "whatsapp",
        message: outreach?.last_message_preview || "",
        status: outreach?.status || "not_started",
        n8n_execution_id: outreach?.n8n_execution_id || null,
        datetime: outreach?.last_message_at || outreach?.updated_at || prospect.updated_at || null
      };
    })
    .filter((row) => ["waiting_reply", "replied", "negotiating"].includes(row.status))
    .sort((a, b) => new Date(b.datetime || 0).getTime() - new Date(a.datetime || 0).getTime());
}

export function buildMeetingDetections(prospects: SdrProspectLike[]) {
  return prospects
    .map((prospect) => {
      const outreach = getCurrentOutreach(prospect);
      return {
        prospect_id: prospect.id || "",
        company: getProspectCompany(prospect),
        suggested_date: outreach?.meeting_scheduled_at || null,
        origin: outreach?.channel || "whatsapp",
        status: outreach?.status || "not_started"
      };
    })
    .filter((meeting) => meeting.status === "meeting_scheduled");
}

export function buildSdrBatchRows(batches: Array<{
  batch_id?: string | null;
  status?: string | null;
  automation_source?: string | null;
  total_requested?: number | null;
  total_dispatched?: number | null;
  total_skipped?: number | null;
  created_by_email?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}>) {
  return batches.map((batch) => ({
    batch_id: String(batch.batch_id || ""),
    status: String(batch.status || ""),
    environment: String(batch.automation_source || "sandbox"),
    total_requested: Number(batch.total_requested || 0),
    total_dispatched: Number(batch.total_dispatched || 0),
    total_skipped: Number(batch.total_skipped || 0),
    operator: String(batch.created_by_email || batch.created_by || "operador nao identificado"),
    created_at: String(batch.created_at || "")
  }));
}

export function createHumanTakeoverEvent(input: { prospectId: string; operatorEmail?: string | null }) {
  return {
    prospect_id: input.prospectId,
    event_type: "human_takeover",
    status: "paused",
    automation_should_stop: true,
    operator_email: input.operatorEmail || "operador local",
    created_at: new Date().toISOString()
  };
}

export function getSdrHealthMonitor(prospects: SdrProspectLike[], auditLogs: Array<{ status?: string | null; error_message?: string | null; created_at?: string | null }> = []) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const active = prospects.filter((prospect) => ACTIVE_STATUSES.has(getCurrentOutreach(prospect)?.status || ""));
  const ageHours = (prospect: SdrProspectLike) => (now - new Date(getCurrentOutreach(prospect)?.updated_at || prospect.updated_at || now).getTime()) / hour;

  return {
    stuck24h: active.filter((prospect) => ageHours(prospect) >= 24 && ageHours(prospect) < 48).length,
    stuck48h: active.filter((prospect) => ageHours(prospect) >= 48 && ageHours(prospect) < 72).length,
    stuck72h: active.filter((prospect) => ageHours(prospect) >= 72).length,
    deadLetters: auditLogs.filter((log) => normalizeText(log.status).includes("dead")).length,
    recentFailures: auditLogs.filter((log) => normalizeText(log.status).includes("fail") || Boolean(log.error_message)).length
  };
}

export function productionDispatchAllowed() {
  return false;
}
