import { notFound } from "next/navigation";

import { getProject, getTaskReferenceData } from "@/features/operations/data";
import { ProjectWorkspace } from "@/features/operations/project-workspace";
import { getEntityFiles, getProjectNotes } from "@/features/tech/data";
import { getProjectWikiLinks } from "@/features/knowledge/data";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ project, tasks, activities }, notes, files, wikiLinks, refs] = await Promise.all([
    getProject(id),
    getProjectNotes(id),
    getEntityFiles("project", id),
    getProjectWikiLinks(id),
    getTaskReferenceData()
  ]);
  if (!project) notFound();

  return (
    <ProjectWorkspace
      project={project}
      tasks={tasks}
      activities={activities}
      notes={notes.data}
      files={files.data}
      wikiPages={wikiLinks.pages}
      allWikiPages={wikiLinks.allPages}
      clients={refs.clients}
      companies={refs.companies}
      profiles={refs.profiles}
    />
  );
}
