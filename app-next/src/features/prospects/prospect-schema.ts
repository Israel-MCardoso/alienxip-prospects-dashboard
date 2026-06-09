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

export function formDataToProspectInput(formData: FormData): ProspectFormInput {
  return prospectFormSchema.parse({
    name: formData.get("name"),
    status: formData.get("status") || "new",
    temperature: formData.get("temperature") || "warm",
    segment: formData.get("segment") || "",
    city: formData.get("city") || "",
    state: formData.get("state") || "",
    instagram_url: formData.get("instagram_url") || "",
    website_url: formData.get("website_url") || "",
    whatsapp: formData.get("whatsapp") || "",
    partner_name: formData.get("partner_name") || "",
    partner_url: formData.get("partner_url") || "",
    notes: formData.get("notes") || ""
  });
}

export function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}
