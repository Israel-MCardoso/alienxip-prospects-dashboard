import { z } from "zod";

export const reviewStatuses = ["needs_review", "approved", "outdated"];
export const governanceRoles = ["admin", "operator", "viewer"];

export const searchResultSchema = z.object({
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional().default(""),
  url: z.string().min(1),
  rank: z.number().default(0),
  created_at: z.string().nullable().optional().default(null)
});

export function assertSearchResultShape(row) {
  return searchResultSchema.parse(row);
}

export function calculateSearchRank(query, row) {
  const term = String(query || "").trim().toLowerCase();
  const title = String(row.title || "").toLowerCase();
  const subtitle = String(row.subtitle || "").toLowerCase();
  if (!term) return 0;
  if (title === term) return 1;
  if (title.startsWith(term)) return 0.9;
  if (title.includes(term)) return 0.75;
  if (subtitle.includes(term)) return 0.45;
  return 0.1;
}

const permissions = {
  admin: {
    read: ["*"],
    create: ["*"],
    update: ["*"],
    delete: ["*"]
  },
  operator: {
    read: ["*"],
    create: ["prospects", "tasks", "projects", "wiki", "playbooks", "files"],
    update: ["prospects", "tasks", "projects", "wiki", "playbooks", "files"],
    delete: []
  },
  viewer: {
    read: ["*"],
    create: [],
    update: [],
    delete: []
  }
};

export function canPerform(role, action, resource) {
  const allowed = permissions[role]?.[action] || [];
  return allowed.includes("*") || allowed.includes(resource);
}

export function duplicatePlaybookDraft(playbook) {
  return {
    title: `Cópia de ${playbook.title}`,
    description: playbook.description || "",
    content: playbook.content || "",
    category: playbook.category || "geral",
    status: "draft",
    review_status: "needs_review"
  };
}

export function markFileRemoved(file, userId, reason, timestamp = new Date().toISOString()) {
  return {
    ...file,
    removed_at: timestamp,
    removed_by: userId,
    removal_reason: reason || "Removido sem motivo informado."
  };
}

export function normalizeReviewStatus(value) {
  return {
    review_status: reviewStatuses.includes(value) ? value : "needs_review"
  };
}

export const officialKnowledgeTemplates = [
  {
    title: "Processo de Prospecção",
    category: "prospeccao",
    content: "Objetivo\n\nEtapas\n\nCritérios de qualificação\n\nPróxima ação"
  },
  {
    title: "Diagnóstico Digital",
    category: "prospeccao",
    content: "Presença digital\n\nCanais\n\nOportunidades\n\nRecomendação"
  },
  {
    title: "Entrega Landing Page",
    category: "desenvolvimento",
    content: "Briefing\n\nDesign\n\nImplementação\n\nQA\n\nPublicação"
  },
  {
    title: "Onboarding Cliente",
    category: "operacao",
    content: "Boas-vindas\n\nAcessos\n\nKickoff\n\nPlano de 30 dias"
  },
  {
    title: "Deploy Produção",
    category: "desenvolvimento",
    content: "Checklist pré-deploy\n\nBuild\n\nSmoke test\n\nRollback"
  },
  {
    title: "Postmortem de Incidente",
    category: "suporte",
    content: "Resumo\n\nImpacto\n\nCausa raiz\n\nCorreções\n\nPrevenção"
  },
  {
    title: "Criação de Projeto",
    category: "operacao",
    content: "Escopo\n\nResponsável\n\nTarefas iniciais\n\nRiscos"
  }
];
