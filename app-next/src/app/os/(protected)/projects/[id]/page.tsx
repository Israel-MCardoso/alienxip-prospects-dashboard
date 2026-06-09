import { notFound } from "next/navigation";

import { getProject } from "@/features/operations/data";
import { ProjectWorkspace } from "@/features/operations/project-workspace";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, tasks, activities } = await getProject(id);
  if (!project) notFound();

  return <ProjectWorkspace project={project} tasks={tasks} activities={activities} />;
}
