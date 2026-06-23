import { getMyTasks, getTaskReferenceData, getTasks } from "@/features/operations/data";
import { TasksCenter } from "@/features/operations/tasks-center";

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; assigned_to?: string; due?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10);
  const [tasksResult, myTasksResult, refs] = await Promise.all([
    getTasks(filters),
    getMyTasks(),
    getTaskReferenceData()
  ]);

  const itemsPerPage = 10;
  const totalItems = tasksResult.data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTasks = tasksResult.data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <TasksCenter
      tasks={paginatedTasks}
      myTasks={myTasksResult.tasks}
      groupedMyTasks={myTasksResult.grouped}
      companies={refs.companies}
      clients={refs.clients}
      profiles={refs.profiles}
      projects={refs.projects}
      error={tasksResult.error || myTasksResult.error || refs.error}
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
    />
  );
}
