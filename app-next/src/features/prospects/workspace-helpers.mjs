import { z } from "zod";

const textField = z.string().trim().optional().default("");

export const diagnosticSchema = z.object({
  facebook_notes: textField,
  instagram_notes: textField,
  whatsapp_notes: textField,
  website_notes: textField,
  google_business_notes: textField,
  diagnosis_summary: textField,
  opportunities: z
    .union([z.string(), z.array(z.string())])
    .default("")
    .transform((value) => {
      const items = Array.isArray(value) ? value : value.split(/\r?\n|,/);
      return items.map((item) => item.trim()).filter(Boolean);
    })
});

export const noteSchema = z.object({
  content: z.string().trim().min(1, "Nota e obrigatoria."),
  type: z.enum(["observacao", "follow_up", "reuniao", "decisao", "risco"])
});

export function activityLabel(actionType) {
  const labels = {
    created: "Prospect criado",
    updated: "Prospect atualizado",
    imported: "Prospect importado",
    diagnostic_created: "Diagnostico criado",
    diagnostic_updated: "Diagnostico atualizado",
    note_created: "Nota criada",
    status_changed: "Status alterado"
  };

  return labels[actionType] || actionType;
}

export function formatActivityDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(value)).replace(",", "");
}
