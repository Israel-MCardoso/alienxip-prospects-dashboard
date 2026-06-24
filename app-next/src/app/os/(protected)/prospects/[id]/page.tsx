import { notFound } from "next/navigation";

import { getProspectWorkspace } from "@/features/prospects/data";
import { ProspectWorkspace } from "@/features/prospects/prospect-workspace";
import { getTaskReferenceData } from "@/features/operations/data";

export default async function ProspectWorkspacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ prospect, diagnostic, notes, activities, tasks, files, proposals, isConfigured, error, outreach, outreachEvents }, refs] = await Promise.all([
    getProspectWorkspace(id),
    getTaskReferenceData()
  ]);

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
      files={files}
      proposals={proposals}
      profiles={refs.profiles}
      clients={refs.clients}
      companies={refs.companies}
      outreach={outreach}
      outreachEvents={outreachEvents}
    />
  );
}
