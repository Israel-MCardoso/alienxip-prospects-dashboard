import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

interface ExistingOutreach {
  id: string;
  prospect_id: string;
  status: string;
  metadata: Record<string, unknown> | null;
}

export interface DispatchParams {
  prospect_ids: string[];
  automation_source?: string;
  user_id: string;
  user_email: string | null;
}

export interface DispatchResult {
  batch_id: string;
  status: "dispatched" | "partially_dispatched" | "failed" | "completed";
  total_requested: number;
  total_dispatched: number;
  total_skipped: number;
  skipped_details: Array<{ prospect_id: string; name: string; reason: string }>;
  duration_ms: number;
}

const ACTIVE_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "waiting_reply",
  "replied",
  "negotiating",
  "meeting_scheduled"
];

const OPERATOR_ROLES = ["operator", "admin", "owner"] as const;

/**
 * Verifies that userId has operator-level permission.
 * Throws "Permissão negada. Requer operador." if not.
 * Shared by the API route and Server Actions so the rule lives in one place.
 */
export async function assertOutreachOperator(userId: string): Promise<void> {
  const db = createSupabaseAdminClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const isOperator = profile && (OPERATOR_ROLES as readonly string[]).includes(profile.role ?? "");
  if (!isOperator) {
    throw new Error("Permissão negada. Requer operador.");
  }
}

/**
 * Core batch dispatch logic — server-only, no HTTP self-fetch.
 * Called directly by Server Actions and the /api/outreach/dispatch route handler.
 * publicUrl is the callback URL sent TO n8n so it can call back into this app — not a self-fetch.
 */
export async function dispatchOutreachBatch({
  prospect_ids,
  automation_source = "sandbox",
  user_id,
  user_email
}: DispatchParams): Promise<DispatchResult> {
  const startTime = Date.now();
  const db = createSupabaseAdminClient();
  const isSandbox = automation_source === "sandbox";
  const targetEnv = isSandbox ? "sandbox" : "production";
  const batch_id = `batch-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let n8nTriggered = false;
  let n8nStatus: number | null = null;
  let n8nErrorMsg = "";
  const upsertedIdMap: Record<string, string> = {};
  const skippedDetails: Array<{ prospect_id: string; name: string; reason: string }> = [];

  try {
    // 1. Query all prospects in batch
    const { data: prospects, error: prospectsError } = await db
      .from("prospects")
      .select("*")
      .in("id", prospect_ids);

    if (prospectsError || !prospects) {
      throw new Error(prospectsError?.message || "Prospects não encontrados.");
    }

    // 2. Query existing outreach settings in batch
    const { data: existingOutreaches, error: outreachQueryError } = await db
      .from("prospect_outreach")
      .select("id, prospect_id, status, metadata")
      .in("prospect_id", prospect_ids);

    if (outreachQueryError) {
      throw new Error(outreachQueryError.message);
    }

    const existingMap = new Map<string, ExistingOutreach>();
    if (existingOutreaches) {
      existingOutreaches.forEach((eo) => {
        existingMap.set(eo.prospect_id, eo as unknown as ExistingOutreach);
      });
    }

    const eligibleProspects: typeof prospects = [];

    // 3. Validate and partition prospects
    for (const prospect of prospects) {
      const phoneClean = (prospect.whatsapp || "").replace(/\D/g, "");
      if (!phoneClean || phoneClean.length < 8 || phoneClean.length > 15) {
        skippedDetails.push({
          prospect_id: prospect.id,
          name: prospect.name,
          reason: "WhatsApp ausente ou com formato de dígitos inválido (requer de 8 a 15 dígitos)."
        });
        continue;
      }

      const existing = existingMap.get(prospect.id);
      if (existing && ACTIVE_STATUSES.includes(existing.status)) {
        skippedDetails.push({
          prospect_id: prospect.id,
          name: prospect.name,
          reason: `Automação já está ativa (status atual: ${existing.status}).`
        });
        continue;
      }

      eligibleProspects.push(prospect);
    }

    if (eligibleProspects.length > 0) {
      // 4. Bulk upsert prospect_outreach configurations
      const outreachPayloads: Database["public"]["Tables"]["prospect_outreach"]["Insert"][] = eligibleProspects.map((p) => {
        const existing = existingMap.get(p.id);
        const basePayload: Database["public"]["Tables"]["prospect_outreach"]["Insert"] = {
          prospect_id: p.id,
          status: "queued",
          channel: "whatsapp",
          automation_source: targetEnv,
          error_message: null,
          last_message_preview: null,
          last_message_at: null,
          n8n_execution_id: null,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(typeof existing?.metadata === "object" ? (existing.metadata as Record<string, unknown>) : {}),
            batch_id
          } as Json
        };
        if (existing) {
          basePayload.id = existing.id;
        }
        return basePayload;
      });

      const existingPayloads = outreachPayloads.filter((p) => p.id);
      const newPayloads = outreachPayloads.filter((p) => !p.id);
      const persistedOutreaches: Array<{ id: string; prospect_id: string }> = [];

      for (const payload of existingPayloads) {
        const { id, ...updatePayload } = payload;
        const { data: updated, error: updateError } = await db
          .from("prospect_outreach")
          .update(updatePayload)
          .eq("id", id as string)
          .select("id, prospect_id")
          .single();

        if (updateError || !updated) {
          throw new Error(updateError?.message || "Erro ao atualizar configuração de outreach.");
        }
        persistedOutreaches.push(updated);
      }

      if (newPayloads.length > 0) {
        const { data: inserted, error: insertError } = await db
          .from("prospect_outreach")
          .insert(newPayloads)
          .select("id, prospect_id");

        if (insertError || !inserted) {
          throw new Error(insertError?.message || "Erro ao inserir configurações de outreach em lote.");
        }
        persistedOutreaches.push(...inserted);
      }

      persistedOutreaches.forEach((uo) => {
        upsertedIdMap[uo.prospect_id] = uo.id;
      });

      // 5. Bulk insert outreach_events
      const eventPayloads: Database["public"]["Tables"]["outreach_events"]["Insert"][] = eligibleProspects.map((p) => ({
        prospect_id: p.id,
        outreach_id: upsertedIdMap[p.id],
        event_type: "dispatch",
        status: "queued" as const,
        channel: "whatsapp" as const,
        message: "Lead enviado em lote para fila de prospecção n8n.",
        metadata: { batch_id } as Json
      }));

      const { error: eventsError } = await db.from("outreach_events").insert(eventPayloads);
      if (eventsError) {
        console.error("Erro ao inserir eventos em lote:", eventsError);
      }

      // 6. Bulk insert prospect_activities
      const { error: activitiesError } = await db.from("prospect_activities").insert(
        eligibleProspects.map((p) => ({
          prospect_id: p.id,
          actor_id: user_id,
          action_type: "updated" as const,
          description: `Prospect enviado para automação de outreach n8n no lote [${batch_id}].`
        }))
      );
      if (activitiesError) {
        console.error("Erro ao inserir logs de atividades em lote:", activitiesError);
      }

      // 7. Send batch payload to n8n webhook
      const n8nWebhookUrl = process.env.N8N_OUTREACH_WEBHOOK_URL;
      const publicUrl = process.env.MOTHERXIP_PUBLIC_URL || "http://localhost:3000";

      if (n8nWebhookUrl) {
        try {
          const n8nRes = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              batch_id,
              automation_source: targetEnv,
              callback_url: `${publicUrl}/api/outreach/events`,
              leads: eligibleProspects.map((p) => ({
                outreach_id: upsertedIdMap[p.id],
                prospect_id: p.id,
                name: p.name,
                company_name: p.name,
                segment: p.segment,
                city: p.city,
                phone: (p.whatsapp || "").replace(/\D/g, ""),
                whatsapp: p.whatsapp,
                temperature: p.temperature,
                priority_score: p.priority_score ?? 0
              }))
            })
          });

          n8nStatus = n8nRes.status;
          if (n8nRes.ok) {
            n8nTriggered = true;
          } else {
            n8nErrorMsg = `n8n respondeu com status: ${n8nRes.status} ${n8nRes.statusText}`;
          }
        } catch (err) {
          n8nErrorMsg = err instanceof Error ? err.message : String(err);
        }
      } else {
        n8nErrorMsg = "N8N_OUTREACH_WEBHOOK_URL não configurado no ambiente.";
      }

      // 8. Rollback to failed if n8n was not triggered
      if (!n8nTriggered) {
        const rollbackErrorStr = `Falha ao acionar webhook n8n: ${n8nErrorMsg}`;
        console.warn(rollbackErrorStr);

        await db
          .from("prospect_outreach")
          .update({ status: "failed", error_message: rollbackErrorStr, updated_at: new Date().toISOString() })
          .in("prospect_id", eligibleProspects.map((p) => p.id));

        await db.from("outreach_events").insert(
          eligibleProspects.map((p) => ({
            prospect_id: p.id,
            outreach_id: upsertedIdMap[p.id],
            event_type: "automation_failed",
            status: "failed" as const,
            channel: "whatsapp" as const,
            message: rollbackErrorStr,
            metadata: { batch_id } as Json
          } satisfies Database["public"]["Tables"]["outreach_events"]["Insert"]))
        );

        await db.from("prospect_activities").insert(
          eligibleProspects.map((p) => ({
            prospect_id: p.id,
            actor_id: user_id,
            action_type: "updated" as const,
            description: `Falha no lote de outreach [${batch_id}]: ${n8nErrorMsg}`
          }))
        );
      }
    }

    // 9. Write batch log
    const endTime = Date.now();
    const duration = endTime - startTime;
    const finalStatus: DispatchResult["status"] = eligibleProspects.length === 0
      ? "completed"
      : n8nTriggered
        ? skippedDetails.length > 0 ? "partially_dispatched" : "dispatched"
        : "failed";

    /* eslint-disable @typescript-eslint/no-explicit-any */
    await db.from("outreach_batches").insert({
      batch_id,
      automation_source: targetEnv,
      status: finalStatus,
      total_requested: prospect_ids.length,
      total_valid: eligibleProspects.length,
      total_skipped: skippedDetails.length,
      total_dispatched: n8nTriggered ? eligibleProspects.length : 0,
      n8n_response_status: n8nStatus,
      error_message: n8nTriggered ? null : n8nErrorMsg || "Nenhum lead elegível processado.",
      metadata: {
        prospect_ids,
        skipped_details: skippedDetails,
        dispatched_ids: n8nTriggered ? eligibleProspects.map((p) => p.id) : []
      },
      created_by: user_id,
      created_by_email: user_email,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date(endTime).toISOString(),
      duration_ms: duration
    } as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      batch_id,
      status: finalStatus,
      total_requested: prospect_ids.length,
      total_dispatched: n8nTriggered ? eligibleProspects.length : 0,
      total_skipped: skippedDetails.length,
      skipped_details: skippedDetails,
      duration_ms: duration
    };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Erro no dispatch de outreach em lote:", error);

    try {
      const endTime = Date.now();
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await db.from("outreach_batches").insert({
        batch_id,
        automation_source: targetEnv,
        status: "failed",
        total_requested: prospect_ids.length,
        total_valid: 0,
        total_skipped: prospect_ids.length,
        total_dispatched: 0,
        error_message: errorMsg,
        created_by: user_id,
        created_by_email: user_email,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString(),
        duration_ms: endTime - startTime
      } as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (dbErr) {
      console.error("Falha ao persistir log de erro do lote:", dbErr);
    }

    throw error;
  }
}
