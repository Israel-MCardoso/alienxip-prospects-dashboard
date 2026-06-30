"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, ProspectSource, ProspectStatus, ProspectTemperature } from "@/types/database";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import {
  MAX_BATCH_SIZE,
  normalizeBrazilPhone,
  type WhatsappBatchFilters,
  type WhatsappBatchPreview,
  type WhatsappBatchRow
} from "./whatsapp-batch";

type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"];

const PROSPECT_SOURCES: ProspectSource[] = [
  "manual",
  "google_sheet",
  "referral",
  "instagram",
  "website",
  "other"
];

export type WhatsappBatchResult =
  | { ok: true; preview: WhatsappBatchPreview }
  | { ok: false; error: string };

/**
 * Build the eligible export list for a WhatsApp batch. Read-only: filters
 * prospects, normalizes/dedupes phones, resolves responsible-user names, and
 * applies the quantity limit. Never sends messages or marks prospects.
 */
export async function previewWhatsappBatchAction(
  filters: WhatsappBatchFilters
): Promise<WhatsappBatchResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase nao esta configurado." };
  }

  // Auth gate — only authenticated CRM users may export contact lists.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Usuario nao autenticado." };
  }

  const limit = Math.floor(filters.limit);
  if (!Number.isFinite(limit) || limit < 1) {
    return { ok: false, error: "Quantidade invalida. Use um numero maior ou igual a 1." };
  }
  if (limit > MAX_BATCH_SIZE) {
    return {
      ok: false,
      error: `Quantidade muito alta. O limite seguro por lote e ${MAX_BATCH_SIZE} prospects.`
    };
  }

  const db = createSupabaseAdminClient();
  let query = db
    .from("prospects")
    .select("*")
    .order("updated_at", { ascending: false });

  // Enum filters: exact match only when the value is a known enum member.
  if (filters.status && prospectStatuses.includes(filters.status as ProspectStatus)) {
    query = query.eq("status", filters.status as ProspectStatus);
  }
  if (filters.temperature && prospectTemperatures.includes(filters.temperature as ProspectTemperature)) {
    query = query.eq("temperature", filters.temperature as ProspectTemperature);
  }
  if (filters.source && PROSPECT_SOURCES.includes(filters.source as ProspectSource)) {
    query = query.eq("source", filters.source as ProspectSource);
  }
  // Free-text filters: case-insensitive exact match (no wildcards).
  if (filters.segment) {
    query = query.ilike("segment", filters.segment);
  }
  if (filters.city) {
    query = query.ilike("city", filters.city);
  }
  if (filters.state) {
    query = query.ilike("state", filters.state);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, error: error.message };
  }

  const prospects = (data || []) as ProspectRow[];

  // Resolve responsible-user names in one query.
  const responsibleIds = Array.from(
    new Set(prospects.map((p) => p.responsible_user_id).filter((id): id is string => Boolean(id)))
  );
  const nameById = new Map<string, string>();
  if (responsibleIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", responsibleIds);
    for (const profile of profiles || []) {
      nameById.set(profile.id, profile.full_name || profile.email || "");
    }
  }

  let noPhone = 0;
  let invalidPhone = 0;
  let duplicate = 0;
  const seenPhones = new Set<string>();
  const eligible: WhatsappBatchRow[] = [];

  for (const prospect of prospects) {
    const rawPhone = (prospect.whatsapp || "").trim();
    if (!rawPhone) {
      noPhone += 1;
      continue;
    }
    const phone = normalizeBrazilPhone(rawPhone);
    if (!phone) {
      invalidPhone += 1;
      continue;
    }
    if (seenPhones.has(phone)) {
      duplicate += 1;
      continue;
    }
    seenPhones.add(phone);

    eligible.push({
      prospect_id: prospect.id,
      name: prospect.name || "",
      company: prospect.company_name || "",
      phone,
      segment: prospect.segment || "",
      status: prospect.status || "",
      temperature: prospect.temperature || "",
      source: prospect.source || "",
      city: prospect.city || "",
      state: prospect.state || "",
      instagram_url: prospect.instagram_url || "",
      responsible_user: prospect.responsible_user_id
        ? nameById.get(prospect.responsible_user_id) || ""
        : "",
      notes: prospect.notes || ""
    });
  }

  const rows = eligible.slice(0, limit);

  return {
    ok: true,
    preview: {
      totalFound: prospects.length,
      totalEligible: eligible.length,
      totalExported: rows.length,
      ignored: { noPhone, invalidPhone, duplicate },
      rows
    }
  };
}
