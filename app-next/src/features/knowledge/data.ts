import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type WikiPageRow = Database["public"]["Tables"]["wiki_pages"]["Row"];
export type PlaybookRow = Database["public"]["Tables"]["playbooks"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type ProjectWikiLinkRow = Database["public"]["Tables"]["project_wiki_links"]["Row"];

export async function getWikiPages(filters?: { q?: string; category?: string; status?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as WikiPageRow[], error: "Supabase nao configurado.", isConfigured: false };
  let query = supabase.from("wiki_pages").select("*");
  if (filters?.q) query = query.or(`title.ilike.%${filters.q}%,content.ilike.%${filters.q}%`);
  if (filters?.category) query = query.eq("category", filters.category as WikiPageRow["category"]);
  if (filters?.status) query = query.eq("status", filters.status as WikiPageRow["status"]);
  const { data, error } = await query.order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getWikiPageBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: null, error: "Supabase nao configurado.", isConfigured: false };
  const { data, error } = await supabase.from("wiki_pages").select("*").eq("slug", slug).single();
  return { data, error: error?.message || null, isConfigured: true };
}

export async function getPlaybooks(filters?: { q?: string; category?: string; status?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as PlaybookRow[], error: "Supabase nao configurado.", isConfigured: false };
  let query = supabase.from("playbooks").select("*");
  if (filters?.q) query = query.or(`title.ilike.%${filters.q}%,content.ilike.%${filters.q}%`);
  if (filters?.category) query = query.eq("category", filters.category as PlaybookRow["category"]);
  if (filters?.status) query = query.eq("status", filters.status as PlaybookRow["status"]);
  const { data, error } = await query.order("updated_at", { ascending: false });
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getFiles(filters?: { q?: string; entity_type?: string; file_type?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { data: [] as FileRow[], error: "Supabase nao configurado.", isConfigured: false };
  let query = supabase.from("files").select("*");
  if (filters?.q) query = query.ilike("file_name", `%${filters.q}%`);
  if (filters?.entity_type) query = query.eq("entity_type", filters.entity_type);
  if (filters?.file_type) query = query.ilike("file_type", `%${filters.file_type}%`);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  return { data: data || [], error: error?.message || null, isConfigured: true };
}

export async function getKnowledgeSearchData() {
  const [wiki, playbooks, files] = await Promise.all([getWikiPages(), getPlaybooks(), getFiles()]);
  return {
    wikiPages: wiki.data,
    playbooks: playbooks.data,
    files: files.data,
    error: wiki.error || playbooks.error || files.error,
    isConfigured: wiki.isConfigured && playbooks.isConfigured && files.isConfigured
  };
}

export async function getProjectWikiLinks(projectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { links: [] as ProjectWikiLinkRow[], pages: [] as WikiPageRow[], allPages: [] as WikiPageRow[], error: "Supabase nao configurado.", isConfigured: false };
  const [links, allPages] = await Promise.all([
    supabase.from("project_wiki_links").select("*").eq("project_id", projectId),
    supabase.from("wiki_pages").select("*").order("title", { ascending: true })
  ]);
  const linkedIds = new Set((links.data || []).map((link) => link.wiki_page_id));
  return {
    links: links.data || [],
    pages: (allPages.data || []).filter((page) => linkedIds.has(page.id)),
    allPages: allPages.data || [],
    error: links.error?.message || allPages.error?.message || null,
    isConfigured: true
  };
}
