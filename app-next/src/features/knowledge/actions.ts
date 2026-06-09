"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/features/workspace/activity";
import type { KnowledgeCategory, KnowledgeStatus } from "@/types/database";
import { fileMetadataSchema, normalizeStoragePath, playbookSchema, storageBucketName, wikiPageSchema } from "./knowledge-helpers";

function nullable(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

async function getClientAndUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id || null };
}

export async function createWikiPageAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = wikiPageSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("wiki_pages").insert({
    title: input.title,
    slug: input.slug,
    content: input.content,
    category: input.category as KnowledgeCategory,
    status: input.status as KnowledgeStatus,
    created_by: userId,
    updated_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "wiki", entity_id: data.id, actor_id: userId, action: "wiki_created", title: "Wiki criada", description: data.title, metadata: { slug: data.slug } });
  revalidatePath("/os/wiki");
  revalidatePath("/os/activity");
}

export async function updateWikiPageAction(id: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = wikiPageSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("wiki_pages").update({
    title: input.title,
    slug: input.slug,
    content: input.content,
    category: input.category as KnowledgeCategory,
    status: input.status as KnowledgeStatus,
    updated_by: userId
  }).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "wiki", entity_id: data.id, actor_id: userId, action: "wiki_updated", title: "Wiki atualizada", description: data.title, metadata: { slug: data.slug } });
  revalidatePath("/os/wiki");
  revalidatePath(`/os/wiki/${data.slug}`);
  redirect(`/os/wiki/${data.slug}`);
}

export async function updateWikiStatusAction(id: string, status: KnowledgeStatus) {
  const { supabase, userId } = await getClientAndUser();
  const { data, error } = await supabase.from("wiki_pages").update({ status, updated_by: userId }).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "wiki", entity_id: data.id, actor_id: userId, action: status === "published" ? "wiki_published" : "wiki_archived", title: status === "published" ? "Wiki publicada" : "Wiki arquivada", description: data.title, metadata: { status } });
  revalidatePath("/os/wiki");
  revalidatePath(`/os/wiki/${data.slug}`);
}

export async function createPlaybookAction(formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const input = playbookSchema.parse(Object.fromEntries(formData));
  const { data, error } = await supabase.from("playbooks").insert({
    title: input.title,
    description: nullable(input.description),
    content: input.content,
    category: input.category as KnowledgeCategory,
    status: input.status as KnowledgeStatus,
    created_by: userId,
    updated_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "playbook", entity_id: data.id, actor_id: userId, action: "playbook_created", title: "Playbook criado", description: data.title, metadata: { category: data.category } });
  revalidatePath("/os/playbooks");
  revalidatePath("/os/activity");
}

export async function uploadEntityFileAction(entityType: string, entityId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Arquivo invalido.");

  const path = normalizeStoragePath(entityType, entityId, file.name);
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(storageBucketName).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });
  if (uploadError) throw new Error(uploadError.message);

  const input = fileMetadataSchema.parse({
    bucket: storageBucketName,
    path,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    entity_type: entityType,
    entity_id: entityId
  });

  const { data, error } = await supabase.from("files").insert({
    bucket: input.bucket,
    path: input.path || path,
    file_name: input.file_name,
    file_type: nullable(input.file_type),
    file_size: input.file_size,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    uploaded_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "file", entity_id: data.id, actor_id: userId, action: "file_uploaded", title: "Arquivo enviado", description: data.file_name, metadata: { entity_type: entityType, entity_id: entityId } });
  revalidatePath("/os/files");
  revalidatePath(`/os/${entityType}s/${entityId}`);
  revalidatePath("/os/activity");
}

export async function linkWikiToProjectAction(projectId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const wikiPageId = String(formData.get("wiki_page_id") || "");
  if (!wikiPageId) throw new Error("Pagina wiki obrigatoria.");
  const { error } = await supabase.from("project_wiki_links").insert({ project_id: projectId, wiki_page_id: wikiPageId, created_by: userId });
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "project", entity_id: projectId, actor_id: userId, action: "wiki_linked", title: "Wiki vinculada ao projeto", description: "Pagina wiki vinculada ao projeto.", metadata: { wiki_page_id: wikiPageId } });
  revalidatePath(`/os/projects/${projectId}`);
}
