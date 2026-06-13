import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  // 1. Validate authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Validate role has operator permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isOperator = profile && (profile.role === "operator" || profile.role === "admin" || profile.role === "owner");
  if (!isOperator) {
    return NextResponse.json({ error: "Permissão negada. Requer operador." }, { status: 403 });
  }

  const db = createSupabaseAdminClient();

  // 3. Parse input body
  let body: { prospect_ids: string[]; automation_source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { prospect_ids, automation_source = "sandbox" } = body;
  if (!Array.isArray(prospect_ids) || prospect_ids.length === 0) {
    return NextResponse.json({ error: "Lista prospect_ids inválida ou vazia." }, { status: 400 });
  }

  const isSandbox = automation_source === "sandbox";
  const targetEnv = isSandbox ? "sandbox" : "production";

  // 4. Environmental Limits Verification
  if (targetEnv === "production" && prospect_ids.length > 100) {
    return NextResponse.json({
      error: `Limite de lote excedido. Em produção, você pode enviar no máximo 100 leads por vez (solicitado: ${prospect_ids.length}).`
    }, { status: 400 });
  }

  if (targetEnv === "sandbox" && prospect_ids.length > 2) {
    return NextResponse.json({
      error: `Limite de lote excedido. Em sandbox, você pode enviar no máximo 2 leads por vez nesta validação inicial (solicitado: ${prospect_ids.length}).`
    }, { status: 400 });
  }

  const batch_id = `batch-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // 5. Query all prospects in batch in a single query
    const { data: prospects, error: prospectsError } = await db
      .from("prospects")
      .select("*")
      .in("id", prospect_ids);

    if (prospectsError || !prospects) {
      return NextResponse.json({ error: prospectsError?.message || "Prospects não encontrados." }, { status: 404 });
    }

    // 6. Query existing outreach settings in batch in a single query
    const { data: existingOutreaches, error: outreachQueryError } = await db
      .from("prospect_outreach")
      .select("id, prospect_id, status, metadata")
      .in("prospect_id", prospect_ids);

    if (outreachQueryError) {
      return NextResponse.json({ error: outreachQueryError.message }, { status: 500 });
    }

    interface ExistingOutreach {
      id: string;
      prospect_id: string;
      status: string;
      metadata: Record<string, unknown> | null;
    }

    const existingMap = new Map<string, ExistingOutreach>();
    if (existingOutreaches) {
      existingOutreaches.forEach((eo) => {
        existingMap.set(eo.prospect_id, eo as unknown as ExistingOutreach);
      });
    }

    const activeStatuses = [
      "queued",
      "sent",
      "delivered",
      "waiting_reply",
      "replied",
      "negotiating",
      "meeting_scheduled"
    ];

    const eligibleProspects: typeof prospects = [];
    const skippedDetails: Array<{ prospect_id: string; name: string; reason: string }> = [];

    // 7. Validate and partition prospects
    for (const prospect of prospects) {
      // 7.1 Phone validation
      const phoneClean = (prospect.whatsapp || "").replace(/\D/g, "");
      if (!phoneClean || phoneClean.length < 8 || phoneClean.length > 15) {
        skippedDetails.push({
          prospect_id: prospect.id,
          name: prospect.name,
          reason: "WhatsApp ausente ou com formato de dígitos inválido (requer de 8 a 15 dígitos)."
        });
        continue;
      }

      // 7.2 Idempotency: active outreach verification
      const existing = existingMap.get(prospect.id);
      if (existing && activeStatuses.includes(existing.status)) {
        skippedDetails.push({
          prospect_id: prospect.id,
          name: prospect.name,
          reason: `Automação já está ativa (status atual: ${existing.status}).`
        });
        continue;
      }

      eligibleProspects.push(prospect);
    }

    let n8nTriggered = false;
    let n8nStatus: number | null = null;
    let n8nErrorMsg = "";
    const upsertedIdMap: Record<string, string> = {};

    if (eligibleProspects.length > 0) {
      // 8. Bulk Upsert prospect_outreach configurations
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
        // Reuse database ID if it exists to avoid conflicts
        if (existing) {
          basePayload.id = existing.id;
        }
        return basePayload;
      });

      const existingOutreachPayloads = outreachPayloads.filter((payload) => payload.id);
      const newOutreachPayloads = outreachPayloads.filter((payload) => !payload.id);
      const persistedOutreaches: Array<{ id: string; prospect_id: string }> = [];

      for (const payload of existingOutreachPayloads) {
        const { id, ...updatePayload } = payload;
        const { data: updatedOutreach, error: updateError } = await db
          .from("prospect_outreach")
          .update(updatePayload)
          .eq("id", id as string)
          .select("id, prospect_id")
          .single();

        if (updateError || !updatedOutreach) {
          throw new Error(updateError?.message || "Erro ao atualizar configuração de outreach.");
        }

        persistedOutreaches.push(updatedOutreach);
      }

      if (newOutreachPayloads.length > 0) {
        const { data: insertedOutreaches, error: insertError } = await db
          .from("prospect_outreach")
          .insert(newOutreachPayloads)
          .select("id, prospect_id");

        if (insertError || !insertedOutreaches) {
          throw new Error(insertError?.message || "Erro ao inserir configurações de outreach em lote.");
        }

        persistedOutreaches.push(...insertedOutreaches);
      }

      persistedOutreaches.forEach((uo) => {
        upsertedIdMap[uo.prospect_id] = uo.id;
      });

      // 9. Bulk Insert outreach_events
      const eventPayloads: Database["public"]["Tables"]["outreach_events"]["Insert"][] = eligibleProspects.map((p) => ({
        prospect_id: p.id,
        outreach_id: upsertedIdMap[p.id],
        event_type: "dispatch",
        status: "queued" as const,
        channel: "whatsapp" as const,
        message: "Lead enviado em lote para fila de prospecção n8n.",
        metadata: { batch_id } as Json
      }));

      const { error: eventsError } = await db
        .from("outreach_events")
        .insert(eventPayloads);

      if (eventsError) {
        console.error("Erro ao inserir eventos em lote:", eventsError);
      }

      // 10. Bulk Insert prospect_activities
      const activityPayloads = eligibleProspects.map((p) => ({
        prospect_id: p.id,
        actor_id: user.id,
        action_type: "updated" as const,
        description: `Prospect enviado para automação de outreach n8n no lote [${batch_id}].`
      }));

      const { error: activitiesError } = await db
        .from("prospect_activities")
        .insert(activityPayloads);

      if (activitiesError) {
        console.error("Erro ao inserir logs de atividades em lote:", activitiesError);
      }

      // 11. Send single batch payload to n8n webhook
      const n8nWebhookUrl = process.env.N8N_OUTREACH_WEBHOOK_URL;
      const publicUrl = process.env.MOTHERXIP_PUBLIC_URL || "http://localhost:3000";

      if (n8nWebhookUrl) {
        const batchLeads = eligibleProspects.map((p) => {
          const phoneClean = (p.whatsapp || "").replace(/\D/g, "");
          return {
            outreach_id: upsertedIdMap[p.id],
            prospect_id: p.id,
            name: p.name,
            company_name: p.name,
            segment: p.segment,
            city: p.city,
            phone: phoneClean,
            whatsapp: p.whatsapp,
            temperature: p.temperature,
            priority_score: p.priority_score ?? 0
          };
        });

        const n8nPayload = {
          batch_id,
          automation_source: targetEnv,
          callback_url: `${publicUrl}/api/outreach/events`,
          leads: batchLeads
        };

        try {
          const n8nRes = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(n8nPayload)
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

      // 12. Handle n8n trigger failure gracefully (Rollback configurations to failed in bulk)
      if (!n8nTriggered) {
        const rollbackErrorStr = `Falha ao acionar webhook n8n: ${n8nErrorMsg}`;
        console.warn(rollbackErrorStr);

        await db
          .from("prospect_outreach")
          .update({
            status: "failed",
            error_message: rollbackErrorStr,
            updated_at: new Date().toISOString()
          })
          .in("prospect_id", eligibleProspects.map(p => p.id));

        const rollbackEvents: Database["public"]["Tables"]["outreach_events"]["Insert"][] = eligibleProspects.map((p) => ({
          prospect_id: p.id,
          outreach_id: upsertedIdMap[p.id],
          event_type: "automation_failed",
          status: "failed" as const,
          channel: "whatsapp" as const,
          message: rollbackErrorStr,
          metadata: { batch_id } as Json
        }));

        await db.from("outreach_events").insert(rollbackEvents);

        const rollbackActivities = eligibleProspects.map((p) => ({
          prospect_id: p.id,
          actor_id: user.id,
          action_type: "updated" as const,
          description: `Falha no lote de outreach [${batch_id}]: ${n8nErrorMsg}`
        }));

        await db.from("prospect_activities").insert(rollbackActivities);
      }
    }

    // 13. Write batch log tracking metadata
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    let finalStatus: "dispatched" | "partially_dispatched" | "failed" | "completed" = "completed";
    if (eligibleProspects.length > 0) {
      if (n8nTriggered) {
        finalStatus = skippedDetails.length > 0 ? "partially_dispatched" : "dispatched";
      } else {
        finalStatus = "failed";
      }
    }

    const batchRow = {
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
        dispatched_ids: n8nTriggered ? eligibleProspects.map(p => p.id) : []
      },
      created_by: user.id,
      created_by_email: user.email || null,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date(endTime).toISOString(),
      duration_ms: duration
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.from("outreach_batches").insert(batchRow as any);

    return NextResponse.json({
      success: true,
      batch_id,
      status: finalStatus,
      total_requested: prospect_ids.length,
      total_dispatched: batchRow.total_dispatched,
      total_skipped: batchRow.total_skipped,
      skipped_details: skippedDetails,
      duration_ms: duration
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Erro geral no endpoint de dispatch de lote:", error);

    // Write a failed batch log if database is accessible
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
        created_by: user.id,
        created_by_email: user.email || null,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString(),
        duration_ms: endTime - startTime
      } as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (dbErr) {
      console.error("Falha ao persistir log de erro do lote:", dbErr);
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
