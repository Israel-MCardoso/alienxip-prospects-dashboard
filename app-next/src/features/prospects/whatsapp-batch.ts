/**
 * WhatsApp batch export — pure helpers shared by the server action and the
 * client drawer. No "use server"/"use client" directive so both layers can
 * import it. Generates a clean, filtered CSV of prospects for later manual
 * WhatsApp campaigns. This module never sends messages or calls any external
 * service — it only shapes and serializes data.
 */

// Quantity presets offered in the drawer, plus a custom option.
export const BATCH_QUANTITY_PRESETS = [20, 30, 40, 50] as const;

// Safe upper bound for a single exported batch. Custom quantities above this
// are rejected with a clear message instead of exporting an unbounded file.
export const MAX_BATCH_SIZE = 500;

export type WhatsappBatchFilters = {
  segment?: string;
  status?: string;
  city?: string;
  state?: string;
  source?: string;
  temperature?: string;
  limit: number;
};

// One exported prospect. Field names mirror the CSV column headers.
export type WhatsappBatchRow = {
  prospect_id: string;
  name: string;
  company: string;
  phone: string;
  segment: string;
  status: string;
  temperature: string;
  source: string;
  city: string;
  state: string;
  instagram_url: string;
  responsible_user: string;
  notes: string;
};

export type WhatsappBatchPreview = {
  totalFound: number;
  totalEligible: number;
  totalExported: number;
  ignored: {
    noPhone: number;
    invalidPhone: number;
    duplicate: number;
  };
  rows: WhatsappBatchRow[];
};

// CSV header order — must stay in sync with WhatsappBatchRow keys below.
export const WHATSAPP_CSV_COLUMNS: (keyof WhatsappBatchRow)[] = [
  "prospect_id",
  "name",
  "company",
  "phone",
  "segment",
  "status",
  "temperature",
  "source",
  "city",
  "state",
  "instagram_url",
  "responsible_user",
  "notes"
];

/**
 * Normalize a raw phone string into a digits-only WhatsApp-compatible
 * Brazilian number, keeping/adding the DDI 55. Returns null when the value
 * cannot be a valid BR phone (so callers can flag it as invalid).
 *
 * Rules:
 * - 10 digits (landline: DDD + 8) or 11 digits (mobile: DDD + 9) → prepend 55.
 *   This also correctly handles DDD 55 numbers (e.g. "55 9xxxx-xxxx").
 * - 12 or 13 digits already starting with 55 → kept as-is.
 * - anything else → null.
 */
export function normalizeBrazilPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }
  return null;
}

// Escape a single CSV field per RFC 4180: wrap in quotes when it contains a
// comma, quote, or line break, doubling any embedded quotes.
function escapeCsvField(value: string): string {
  const needsQuoting = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * Build the CSV text for a batch. UTF-8 BOM is prepended so Excel/Google
 * Sheets detect the encoding and render accents correctly. Rows are joined
 * with CRLF for broad spreadsheet compatibility.
 */
export function buildBatchCsv(rows: WhatsappBatchRow[]): string {
  const header = WHATSAPP_CSV_COLUMNS.join(",");
  const lines = rows.map((row) =>
    WHATSAPP_CSV_COLUMNS.map((col) => escapeCsvField(row[col] ?? "")).join(",")
  );
  const body = [header, ...lines].join("\r\n");
  return `﻿${body}`;
}

// File name like `lote-whatsapp-prospects-2026-06-30.csv`.
export function batchCsvFilename(date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `lote-whatsapp-prospects-${iso}.csv`;
}
