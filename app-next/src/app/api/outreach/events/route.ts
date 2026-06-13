import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json, OutreachStatus, OutreachChannel } from "@/types/database";

// Helper to sanitize payload to prevent logging sensitive details
function sanitizePayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const sanitized = { ...payload } as Record<string, unknown>;

  // Mask phone/whatsapp numbers
  if (typeof sanitized.phone === "string") {
    sanitized.phone = maskPhone(sanitized.phone);
  }
  if (typeof sanitized.whatsapp === "string") {
    sanitized.whatsapp = maskPhone(sanitized.whatsapp);
  }

  // Limit message length to 200 chars to avoid database bloat
  if (typeof sanitized.message === "string") {
    sanitized.message = limitMessage(sanitized.message);
  }

  // Remove any tokens, credentials or keys
  const sensitiveKeys = [
    "secret",
    "token",
    "password",
    "apikey",
    "authorization",
    "service_role",
    "webhook_secret"
  ];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

function maskPhone(phone: string): string {
  const str = String(phone);
  if (str.length <= 4) return "****";
  const start = str.substring(0, 4);
  const end = str.substring(str.length - 2);
  return `${start}******${end}`;
}

function limitMessage(msg: string): string {
  if (msg.length > 200) {
    return msg.substring(0, 200) + "...";
  }
  return msg;
}

const outreachStatusRank: Record<string, number> = {
  not_started: 0,
  queued: 1,
  sent: 2,
  delivered: 3,
  waiting_reply: 4,
  replied: 5,
  negotiating: 6,
  meeting_scheduled: 7,
  disqualified: 7,
  failed: 8,
  paused: 8,
  stopped: 8
};

function shouldAdvanceStatus(currentStatus: string | null | undefined, nextStatus: string) {
  const currentRank = outreachStatusRank[currentStatus || "not_started"] ?? 0;
  const nextRank = outreachStatusRank[nextStatus] ?? 0;
  return nextRank >= currentRank;
}

function statusesAtOrBelow(nextStatus: string): OutreachStatus[] {
  const nextRank = outreachStatusRank[nextStatus] ?? 0;
  return Object.entries(outreachStatusRank)
    .filter(([, rank]) => rank <= nextRank)
    .map(([status]) => status as OutreachStatus);
}

export async function POST(request: Request) {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Supabase Admin não configurado." }, { status: 500 });
  }

  // 1. Webhook security validation
  const secretHeader = request.headers.get("x-motherxip-webhook-secret");
  const expectedSecret = process.env.MOTHERXIP_WEBHOOK_SECRET;
  const isSecretValid = expectedSecret && secretHeader === expectedSecret;

  interface WebhookEventPayload {
    prospect_id?: string;
    event_type?: string;
    status?: string;
    channel?: string;
    message?: string;
    n8n_execution_id?: string;
    meeting_scheduled_at?: string;
    meeting_link?: string;
    meeting_title?: string;
    metadata?: Record<string, unknown>;
  }

  interface WebhookBatchPayload {
    events?: WebhookEventPayload[];
    [key: string]: unknown;
  }

  // Try to parse body
  let body: WebhookBatchPayload | null = null;
  let parseError = false;
  try {
    body = await request.json() as WebhookBatchPayload;
  } catch {
    parseError = true;
  }

  // Handle unauthorized requests
  if (!isSecretValid) {
    try {
      await adminClient.from("webhook_audit_logs").insert({
        execution_id: (body?.n8n_execution_id as string) || (body?.events?.[0]?.n8n_execution_id as string) || null,
        event_type: (body?.event_type as string) || (body?.events?.[0]?.event_type as string) || null,
        status: "invalid_secret",
        secret_validated: false,
        duplicate_ignored: false,
        payload: body ? (sanitizePayload(body) as Json) : ({ error: "Não autorizado: secret inválido" } as Json)
      });
    } catch (auditErr) {
      console.error("Erro ao gravar auditoria para secret inválido:", auditErr);
    }
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Handle parse errors
  if (parseError) {
    try {
      await adminClient.from("webhook_audit_logs").insert({
        status: "invalid_json",
        secret_validated: true,
        duplicate_ignored: false,
        payload: { error: "JSON inválido." } as Json
      });
    } catch (auditErr) {
      console.error("Erro ao gravar auditoria para JSON inválido:", auditErr);
    }
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  // 2. Normalize input: single vs batch events array
  let eventsToProcess: WebhookEventPayload[] = [];
  const auditLogsToInsert: Database["public"]["Tables"]["webhook_audit_logs"]["Insert"][] = [];

  if (body && Array.isArray(body.events)) {
    eventsToProcess = body.events;
  } else if (body && typeof body === "object") {
    eventsToProcess = [body as unknown as WebhookEventPayload];
  }

  if (eventsToProcess.length === 0) {
    try {
      await adminClient.from("webhook_audit_logs").insert({
        status: "missing_fields",
        secret_validated: true,
        duplicate_ignored: false,
        payload: sanitizePayload(body) as Json
      });
    } catch (auditErr) {
      console.error("Erro ao gravar auditoria de lote vazio:", auditErr);
    }
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  try {
    // 3. Batch Idempotency & Deduplication
    const executionIds = eventsToProcess.map(e => e.n8n_execution_id).filter(Boolean) as string[];
    const existingDuplicates = new Set<string>();

    if (executionIds.length > 0) {
      const { data: existingEvents, error: checkError } = await adminClient
        .from("outreach_events")
        .select("n8n_execution_id, event_type")
        .in("n8n_execution_id", executionIds);

      if (checkError) {
        throw new Error(`Erro ao verificar duplicidades: ${checkError.message}`);
      }

      if (existingEvents) {
        existingEvents.forEach(ee => {
          if (ee.n8n_execution_id) {
            existingDuplicates.add(`${ee.n8n_execution_id}_${ee.event_type}`);
          }
        });
      }
    }

    const uniqueValidEvents: WebhookEventPayload[] = [];

    // Filter duplicates and invalid entries
    for (const event of eventsToProcess) {
      const prospect_id = event.prospect_id;
      const event_type = event.event_type;
      const status = event.status;

      if (!prospect_id || !status || !event_type) {
        auditLogsToInsert.push({
          execution_id: event.n8n_execution_id || null,
          event_type: event_type || null,
          status: "missing_fields",
          secret_validated: true,
          duplicate_ignored: false,
          payload: sanitizePayload(event) as Json
        });
        continue;
      }

      const duplicateKey = `${event.n8n_execution_id}_${event_type}`;
      if (event.n8n_execution_id && existingDuplicates.has(duplicateKey)) {
        auditLogsToInsert.push({
          execution_id: event.n8n_execution_id,
          event_type,
          status: "duplicate_ignored",
          secret_validated: true,
          duplicate_ignored: true,
          payload: sanitizePayload(event) as Json
        });
        continue;
      }

      uniqueValidEvents.push(event);
    }

    // 4. Batch Process Valid Events
    if (uniqueValidEvents.length > 0) {
      const prospectIds = uniqueValidEvents.map(e => e.prospect_id).filter(Boolean) as string[];
      
      // Query existing outreach settings in bulk
      const { data: outreaches, error: outreachError } = await adminClient
        .from("prospect_outreach")
        .select("id, prospect_id, status, metadata")
        .in("prospect_id", prospectIds);

      if (outreachError) {
        throw new Error(`Erro ao buscar configurações de outreach: ${outreachError.message}`);
      }

      interface OutreachConfig {
        id: string;
        prospect_id: string;
        status: string | null;
        metadata: Record<string, unknown> | null;
      }

      const outreachMap = new Map<string, OutreachConfig>();
      if (outreaches) {
        outreaches.forEach(o => {
          outreachMap.set(o.prospect_id, o as unknown as OutreachConfig);
        });
      }

      // Group outreach updates by prospect_id (keep the latest chronologically)
      const outreachPayloadsMap = new Map<string, Record<string, unknown>>();

      for (const event of uniqueValidEvents) {
        const existing = outreachMap.get(event.prospect_id as string);
        const advancesStatus = shouldAdvanceStatus(existing?.status, event.status as string);
        const outreachPayload: Record<string, unknown> = {
          prospect_id: event.prospect_id,
          status: advancesStatus ? event.status : existing?.status,
          channel: event.channel || "whatsapp",
          updated_at: new Date().toISOString()
        };

        if (existing) {
          outreachPayload.id = existing.id;
        }

        if (advancesStatus && event.n8n_execution_id) outreachPayload.n8n_execution_id = event.n8n_execution_id;
        if (advancesStatus && event.meeting_scheduled_at) outreachPayload.meeting_scheduled_at = event.meeting_scheduled_at;
        if (advancesStatus && event.meeting_link) outreachPayload.meeting_link = event.meeting_link;
        if (advancesStatus && event.meeting_title) outreachPayload.meeting_title = event.meeting_title;

        if (advancesStatus && event.status === "failed") {
          outreachPayload.error_message = event.message || "Erro na automação.";
        } else if (advancesStatus) {
          outreachPayload.error_message = null;
        }

        if (advancesStatus && event.status === "paused") outreachPayload.paused_at = new Date().toISOString();
        if (advancesStatus && event.status === "stopped") outreachPayload.stopped_at = new Date().toISOString();

        if (advancesStatus && event.message) {
          outreachPayload.last_message_preview = event.message;
          outreachPayload.last_message_at = new Date().toISOString();
        }

        // Merge metadata
        outreachPayload.metadata = {
          ...(typeof existing?.metadata === "object" ? (existing.metadata as Record<string, unknown>) : {}),
          ...(typeof event.metadata === "object" ? (event.metadata as Record<string, unknown>) : {})
        };

        outreachPayloadsMap.set(event.prospect_id as string, outreachPayload);
      }

      // 4.1 Persist prospect_outreach configurations without requiring a unique prospect_id constraint.
      const outreachPayloads = Array.from(outreachPayloadsMap.values()) as Database["public"]["Tables"]["prospect_outreach"]["Insert"][];
      const existingOutreachPayloads = outreachPayloads.filter((payload) => "id" in payload && payload.id);
      const newOutreachPayloads = outreachPayloads.filter((payload) => !("id" in payload) || !payload.id);
      const persistedOutreaches: Array<{ id: string; prospect_id: string }> = [];

      for (const payload of existingOutreachPayloads) {
        const { id, ...updatePayload } = payload;
        let updateQuery = adminClient
          .from("prospect_outreach")
          .update(updatePayload)
          .eq("id", id as string);

        if (typeof updatePayload.status === "string") {
          updateQuery = updateQuery.in("status", statusesAtOrBelow(updatePayload.status));
        }

        const { data: updatedOutreaches, error: updateError } = await updateQuery
          .select("id, prospect_id");

        if (updateError) {
          throw new Error(`Erro ao atualizar configuração de outreach: ${updateError?.message}`);
        }

        persistedOutreaches.push(
          updatedOutreaches?.[0] || {
            id: id as string,
            prospect_id: updatePayload.prospect_id as string
          }
        );
      }

      if (newOutreachPayloads.length > 0) {
        const { data: insertedOutreaches, error: insertError } = await adminClient
          .from("prospect_outreach")
          .insert(newOutreachPayloads)
          .select("id, prospect_id");

        if (insertError || !insertedOutreaches) {
          throw new Error(`Erro ao inserir configurações de outreach em lote: ${insertError?.message}`);
        }

        persistedOutreaches.push(...insertedOutreaches);
      }

      const generatedIdMap = new Map<string, string>();
      persistedOutreaches.forEach(uo => {
        generatedIdMap.set(uo.prospect_id, uo.id);
      });

      // 4.2 Bulk Insert outreach_events
      const eventInserts = uniqueValidEvents.map((event) => ({
        prospect_id: event.prospect_id as string,
        outreach_id: generatedIdMap.get(event.prospect_id as string) || null,
        event_type: event.event_type as string,
        status: event.status as OutreachStatus,
        channel: (event.channel || "whatsapp") as OutreachChannel,
        message: event.message || `Evento de automação: ${event.event_type}`,
        n8n_execution_id: event.n8n_execution_id || null,
        metadata: (event.metadata || {}) as Json
      })) as Database["public"]["Tables"]["outreach_events"]["Insert"][];

      const { error: eventInsertsError } = await adminClient
        .from("outreach_events")
        .insert(eventInserts);

      if (eventInsertsError) {
        throw new Error(`Erro ao inserir eventos de timeline em lote: ${eventInsertsError.message}`);
      }

      // 4.3 Bulk Insert prospect_activities
      const activityInserts = uniqueValidEvents.map((event) => ({
        prospect_id: event.prospect_id,
        actor_id: null,
        action_type: "updated" as const,
        description: `Automação Outreach: Evento [${event.event_type}] recebido com status [${event.status}].`
      }));

      const { error: activityInsertsError } = await adminClient
        .from("prospect_activities")
        .insert(activityInserts);

      if (activityInsertsError) {
        console.error("Erro ao registrar atividades em lote:", activityInsertsError);
      }

      // 4.4 Prepare successful execution audit logs
      uniqueValidEvents.forEach((event) => {
        auditLogsToInsert.push({
          execution_id: event.n8n_execution_id || null,
          event_type: event.event_type,
          status: "processed",
          secret_validated: true,
          duplicate_ignored: false,
          payload: sanitizePayload(event) as Json
        });
      });
    }

    // 5. Insert all audit logs in batch (combines duplicates, errors, and successes)
    if (auditLogsToInsert.length > 0) {
      const { error: auditLogsError } = await adminClient
        .from("webhook_audit_logs")
        .insert(auditLogsToInsert);

      if (auditLogsError) {
        console.error("Erro ao inserir registros de auditoria em lote:", auditLogsError);
      }
    }

    return NextResponse.json({ success: true, processed: uniqueValidEvents.length });

  } catch (processingError: unknown) {
    const errorMsg = processingError instanceof Error ? processingError.message : String(processingError);
    console.error("Erro ao processar lote de webhooks de eventos outreach:", processingError);

    // Try logging the failure in audit log
    try {
      await adminClient.from("webhook_audit_logs").insert({
        execution_id: (body?.n8n_execution_id as string) || null,
        event_type: (body?.event_type as string) || null,
        status: "error",
        secret_validated: true,
        duplicate_ignored: false,
        payload: sanitizePayload(body) as Json,
        error_message: errorMsg
      });
    } catch (auditErr) {
      console.error("Erro ao registrar falha de auditoria geral:", auditErr);
    }

    return NextResponse.json({ error: errorMsg || "Erro interno de processamento de lote." }, { status: 500 });
  }
}
