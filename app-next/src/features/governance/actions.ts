"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/features/workspace/activity";
import type { KnowledgeCategory, KnowledgeReviewStatus, KnowledgeStatus } from "@/types/database";
import { duplicatePlaybookDraft, markFileRemoved, officialKnowledgeTemplates } from "./governance-helpers";
import { slugify } from "@/features/knowledge/knowledge-helpers";

async function getClientAndUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase nao esta configurado.");
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id || null };
}

export async function duplicatePlaybookAction(playbookId: string) {
  const { supabase, userId } = await getClientAndUser();
  const { data: original, error: fetchError } = await supabase.from("playbooks").select("*").eq("id", playbookId).single();
  if (fetchError) throw new Error(fetchError.message);
  const draft = duplicatePlaybookDraft(original);
  const { data, error } = await supabase.from("playbooks").insert({
    ...draft,
    category: draft.category as KnowledgeCategory,
    status: draft.status as KnowledgeStatus,
    review_status: draft.review_status as KnowledgeReviewStatus,
    created_by: userId,
    updated_by: userId
  }).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "playbook", entity_id: data.id, actor_id: userId, action: "playbook_duplicated", title: "Playbook duplicado", description: data.title, metadata: { original_id: playbookId } });
  revalidatePath("/os/playbooks");
}

export async function updatePlaybookStatusAction(playbookId: string, status: KnowledgeStatus) {
  const { supabase, userId } = await getClientAndUser();
  const { data, error } = await supabase.from("playbooks").update({ status, updated_by: userId }).eq("id", playbookId).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "playbook", entity_id: data.id, actor_id: userId, action: status === "published" ? "playbook_published" : "playbook_archived", title: status === "published" ? "Playbook publicado" : "Playbook arquivado", description: data.title, metadata: { status } });
  revalidatePath("/os/playbooks");
  revalidatePath(`/os/playbooks/${playbookId}`);
}

export async function updateKnowledgeReviewAction(kind: "wiki" | "playbook", id: string, reviewStatus: KnowledgeReviewStatus) {
  const { supabase, userId } = await getClientAndUser();
  const table = kind === "wiki" ? "wiki_pages" : "playbooks";
  const { error } = await supabase.from(table).update({ review_status: reviewStatus, reviewed_at: new Date().toISOString(), reviewed_by: userId }).eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: kind, entity_id: id, actor_id: userId, action: `${kind}_review_updated`, title: "Review atualizado", description: `Status de revisão: ${reviewStatus}`, metadata: { review_status: reviewStatus } });
  revalidatePath(kind === "wiki" ? "/os/wiki" : "/os/playbooks");
}

export async function removeFileAction(fileId: string, formData: FormData) {
  const { supabase, userId } = await getClientAndUser();
  const reason = String(formData.get("removal_reason") || "Removido pela operação.");
  const metadata = markFileRemoved({ id: fileId }, userId, reason);
  const { data, error } = await supabase.from("files").update(metadata).eq("id", fileId).select("*").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, { entity_type: "file", entity_id: fileId, actor_id: userId, action: "file_removed", title: "Arquivo removido", description: data.file_name, metadata: { reason } });
  revalidatePath("/os/files");
}

export async function seedOfficialTemplatesAction() {
  const { supabase, userId } = await getClientAndUser();
  for (const template of officialKnowledgeTemplates) {
    const slug = slugify(template.title);
    const { data: existing } = await supabase.from("wiki_pages").select("id").eq("slug", slug).maybeSingle();
    if (existing) continue;
    await supabase.from("wiki_pages").insert({
      title: template.title,
      slug,
      content: template.content,
      category: template.category as KnowledgeCategory,
      status: "published" as KnowledgeStatus,
      review_status: "needs_review" as KnowledgeReviewStatus,
      created_by: userId,
      updated_by: userId
    });
  }
  await recordActivity(supabase, { entity_type: "wiki", entity_id: userId || "00000000-0000-0000-0000-000000000000", actor_id: userId, action: "knowledge_templates_seeded", title: "Templates oficiais criados", description: "Templates oficiais da ALIENXIP foram inseridos sem duplicar.", metadata: { count: officialKnowledgeTemplates.length } });
  revalidatePath("/os/wiki");
}
