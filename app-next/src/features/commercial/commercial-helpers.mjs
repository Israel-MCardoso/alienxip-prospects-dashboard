import { z } from "zod";

export const pipelineStatuses = [
  "frio",
  "contato_inicial",
  "diagnostico",
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

export function groupProspectsByPipelineStatus(prospects) {
  const grouped = Object.fromEntries(pipelineStatuses.map((status) => [status, []]));

  for (const prospect of prospects) {
    const status = pipelineStatuses.includes(prospect.status) ? prospect.status : "frio";
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
