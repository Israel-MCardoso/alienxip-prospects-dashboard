import { z } from "zod";

export const pipelineStatuses = [
  "new",
  "qualified",
  "diagnostico",
  "contato_inicial",
  "meeting_scheduled",
  "proposta",
  "negociacao",
  "fechado",
  "perdido"
];

export const taskStatuses = ["pending", "in_progress", "completed", "canceled"];
export const taskPriorities = ["low", "medium", "high", "urgent"];

const optionalText = z.string().trim().optional().default("");

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  status: z.enum(taskStatuses).default("pending"),
  priority: z.enum(taskPriorities).default("medium"),
  due_date: z.string().trim().optional().default("")
});

export const conversionSchema = z.object({
  main_contact_name: optionalText,
  main_contact_email: z.string().trim().email().optional().or(z.literal("")).default(""),
  main_contact_phone: optionalText,
  monthly_value: z
    .union([z.string(), z.number()])
    .optional()
    .default("")
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null;
      const number = Number(String(value).replace(",", "."));
      return Number.isFinite(number) ? number : null;
    }),
  contract_status: z.enum(["draft", "active", "paused", "cancelled"]).default("draft")
});

export function getProspectPotentialValue(prospect) {
  let base = 1500;
  const segment = (prospect?.segment || "").toLowerCase();
  if (segment.includes("dentista") || segment.includes("odont")) {
    base = 2500;
  } else if (segment.includes("pet") || segment.includes("veteri")) {
    base = 2000;
  } else if (segment.includes("estetica") || segment.includes("beleza") || segment.includes("clinica")) {
    base = 1800;
  } else if (segment.includes("advogado") || segment.includes("jurid")) {
    base = 3000;
  } else if (segment.includes("restaurante") || segment.includes("alimen") || segment.includes("pizza") || segment.includes("burg")) {
    base = 1600;
  } else if (segment.includes("construtora") || segment.includes("engenha") || segment.includes("reform")) {
    base = 3500;
  }
  
  const score = prospect?.priority_score ?? 0;
  const multiplier = score ? (score / 100) + 0.5 : 1;
  return Math.round((base * multiplier) / 100) * 100;
}

export function groupProspectsByPipelineStatus(prospects) {
  const grouped = Object.fromEntries(pipelineStatuses.map((status) => [status, []]));

  for (const prospect of prospects) {
    const status = pipelineStatuses.includes(prospect.status) ? prospect.status : "new";
    grouped[status].push(prospect);
  }

  return grouped;
}

export function canConvertProspect(prospect) {
  return prospect.status === "fechado" && !prospect.converted_client_id;
}

export function buildCompanyClientFromProspect(prospect, conversion) {
  return {
    company: {
      name: prospect.name,
      legal_name: null,
      segment: prospect.segment || null,
      city: prospect.city || null,
      state: prospect.state || null,
      website_url: prospect.website_url || null,
      instagram_url: prospect.instagram_url || null,
      whatsapp: prospect.whatsapp || null,
      notes: prospect.notes || null
    },
    client: {
      status: "active",
      contract_status: conversion.contract_status || "draft",
      monthly_value: conversion.monthly_value,
      start_date: null,
      main_contact_name: conversion.main_contact_name || null,
      main_contact_email: conversion.main_contact_email || null,
      main_contact_phone: conversion.main_contact_phone || null
    }
  };
}
