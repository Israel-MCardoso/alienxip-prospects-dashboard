import { notFound } from "next/navigation";

import { getProject } from "@/features/operations/data";
import { ProjectWorkspace } from "@/features/operations/project-workspace";
import { getEntityFiles, getProjectNotes } from "@/features/tech/data";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ project, tasks, activities }, notes, files] = await Promise.all([
    getProject(id),
    getProjectNotes(id),
    getEntityFiles("project", id)
  ]);
  if (!project) notFound();

  return <ProjectWorkspace project={project} tasks={tasks} activities={activities} notes={notes.data} files={files.data} />;
}
