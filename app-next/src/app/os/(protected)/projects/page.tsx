import { getProjects, getTaskReferenceData } from "@/features/operations/data";
import { ProjectsList } from "@/features/operations/projects-list";

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; owner_id?: string }>;
}) {
  const filters = await searchParams;
  const [projects, refs] = await Promise.all([getProjects(filters), getTaskReferenceData()]);

  return (
    <ProjectsList
      projects={projects.data}
      clients={refs.clients}
      companies={refs.companies}
      profiles={refs.profiles}
      error={projects.error || refs.error}
    />
  );
}
