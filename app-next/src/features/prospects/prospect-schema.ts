import { z } from "zod";

export const prospectStatuses = [
  "frio",
  "contato_inicial",
  "diagnostico",
  "proposta",
  "negociacao",
  "fechado",
  "perdido",
  "new",
  "qualified",
  "contacted",
  "meeting_scheduled",
  "proposal_sent",
  "won",
  "lost",
  "archived"
] as const;

export const prospectTemperatures = ["cold", "warm", "hot"] as const;

export const prospectFormSchema = z.object({
  name: z.string().trim().min(1, "Nome e obrigatorio."),
  status: z.enum(prospectStatuses),
  temperature: z.enum(prospectTemperatures),
  segment: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  instagram_url: z.string().trim().url().optional().or(z.literal("")),
  website_url: z.string().trim().url().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional(),
  partner_name: z.string().trim().optional(),
  partner_url: z.string().trim().url().optional().or(z.literal("")),
  notes: z.string().trim().optional()
});

export type ProspectFormInput = z.infer<typeof prospectFormSchema>;

// Normalize @handle, handle, or domain/path into a full Instagram URL.
// Empty string passthrough lets the optional field skip Zod's .url() check.
function normalizeInstagramUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  const handle = v.startsWith("@") ? v.slice(1) : v;
  const domainMatch = handle.match(/^(?:www\.)?instagram\.com\/(.+)/i);
  if (domainMatch) return `https://instagram.com/${domainMatch[1]}`;
  return `https://instagram.com/${handle}`;
}

// Add https:// to bare domains/paths; full URLs are returned unchanged.
function normalizeWebsiteUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

// Convert a ZodError into a single user-friendly string.
// Zod v4 uses code="invalid_format" + format="url" for URL failures.
export function formatZodError(e: z.ZodError): string {
  const fieldLabels: Record<string, string> = {
    name: "Nome",
    instagram_url: "Instagram",
    website_url: "Site",
    partner_url: "URL do parceiro",
  };
  const first = e.issues[0];
  if (!first) return "Verifique os dados do formulario.";
  const field = String(first.path[0] ?? "");
  const label = fieldLabels[field] ?? field;
  if ("format" in first && (first as { format?: string }).format === "url") {
    return `${label} invalido. Use uma URL completa (https://...) ou apenas o usuario (ex: @perfil).`;
  }
  if (first.code === "too_small") {
    return label ? `${label} e obrigatorio.` : "Campo obrigatorio nao preenchido.";
  }
  return label ? `${label}: ${first.message}` : first.message;
}

export function formDataToProspectInput(formData: FormData): ProspectFormInput {
  return prospectFormSchema.parse({
    name: formData.get("name"),
    status: formData.get("status") || "new",
    temperature: formData.get("temperature") || "warm",
    segment: formData.get("segment") || "",
    city: formData.get("city") || "",
    state: formData.get("state") || "",
    instagram_url: normalizeInstagramUrl(String(formData.get("instagram_url") || "")),
    website_url: normalizeWebsiteUrl(String(formData.get("website_url") || "")),
    whatsapp: formData.get("whatsapp") || "",
    partner_name: formData.get("partner_name") || "",
    partner_url: normalizeWebsiteUrl(String(formData.get("partner_url") || "")),
    notes: formData.get("notes") || ""
  });
}

export function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}
