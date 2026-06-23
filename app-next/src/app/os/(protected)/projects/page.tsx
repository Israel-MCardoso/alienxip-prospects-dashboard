import { getProjects, getTaskReferenceData } from "@/features/operations/data";
import { ProjectsList } from "@/features/operations/projects-list";

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; owner_id?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10);
  const [projects, refs] = await Promise.all([getProjects(filters), getTaskReferenceData()]);

  const itemsPerPage = 10;
  const totalItems = projects.data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProjects = projects.data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <ProjectsList
      projects={paginatedProjects}
      clients={refs.clients}
      companies={refs.companies}
      profiles={refs.profiles}
      error={projects.error || refs.error}
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
    />
  );
}
