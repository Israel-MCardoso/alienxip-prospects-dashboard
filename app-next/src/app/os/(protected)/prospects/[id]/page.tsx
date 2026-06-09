import { notFound } from "next/navigation";

import { getProspectWorkspace } from "@/features/prospects/data";
import { ProspectWorkspace } from "@/features/prospects/prospect-workspace";

export default async function ProspectWorkspacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { prospect, diagnostic, notes, activities, tasks, isConfigured, error } = await getProspectWorkspace(id);

  if (!isConfigured || error || !prospect) {
    notFound();
  }

  return (
    <ProspectWorkspace
      prospect={prospect}
      diagnostic={diagnostic}
      notes={notes}
      activities={activities}
      tasks={tasks}
    />
  );
}
