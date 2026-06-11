import { notFound } from "next/navigation";

import { getPlaybook } from "@/features/knowledge/data";
import { PlaybookDetailView } from "@/features/knowledge/playbooks-page";

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await getPlaybook(id);
  if (!data) notFound();
  return <PlaybookDetailView playbook={data} />;
}
