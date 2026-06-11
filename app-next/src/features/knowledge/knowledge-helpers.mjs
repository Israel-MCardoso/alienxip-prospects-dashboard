import { z } from "zod";

export const storageBucketName = "alienxip-files";
export const wikiStatuses = ["draft", "published", "archived"];
export const playbookStatuses = ["draft", "published", "archived"];
export const wikiCategories = ["vendas", "prospeccao", "desenvolvimento", "design", "operacao", "suporte", "financeiro", "geral"];

const optionalText = z.string().trim().optional().default("");

export const wikiPageSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  slug: z.string().trim().min(1, "Slug e obrigatorio."),
  content: z.string().trim().min(1, "Conteudo e obrigatorio."),
  category: z.enum(wikiCategories).default("geral"),
  status: z.enum(wikiStatuses).default("draft")
});

export const playbookSchema = z.object({
  title: z.string().trim().min(1, "Titulo e obrigatorio."),
  description: optionalText,
  content: z.string().trim().min(1, "Conteudo e obrigatorio."),
  category: z.enum(wikiCategories).default("geral"),
  status: z.enum(playbookStatuses).default("draft")
});

export const fileMetadataSchema = z.object({
  bucket: z.string().trim().optional().default(storageBucketName),
  path: optionalText,
  file_name: z.string().trim().min(1, "Nome do arquivo e obrigatorio."),
  file_type: optionalText,
  file_size: z
    .union([z.string(), z.number()])
    .optional()
    .default(0)
    .transform((value) => {
      const size = Number(value);
      return Number.isFinite(size) ? size : 0;
    }),
  entity_type: z.string().trim().min(1, "Tipo da entidade e obrigatorio."),
  entity_id: z.string().trim().min(1, "Entidade e obrigatoria.")
});

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeStoragePath(entityType, entityId, fileName) {
  return `${slugify(entityType)}/${entityId}/${slugify(fileName).replace(/-([a-z0-9]+)$/, ".$1")}`;
}

function includesTerm(value, term) {
  return String(value || "").toLowerCase().includes(term);
}

function result(type, title, href, description = "") {
  return { type, title, href, description };
}

export function buildKnowledgeSearchResults(query, data, limit = 12) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return [];

  return [
    ...data.wikiPages
      .filter((item) => includesTerm(item.title, term) || includesTerm(item.content, term))
      .map((item) => result("wiki", item.title, `/os/wiki/${item.slug}`, item.category || "")),
    ...data.playbooks
      .filter((item) => includesTerm(item.title, term) || includesTerm(item.content, term))
      .map((item) => result("playbook", item.title, "/os/playbooks", item.category || "")),
    ...data.files
      .filter((item) => includesTerm(item.file_name, term))
      .map((item) => result("file", item.file_name, "/os/files", item.entity_type || ""))
  ].slice(0, limit);
}
