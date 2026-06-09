import { getMyTasks, getTaskReferenceData, getTasks } from "@/features/operations/data";
import { TasksCenter } from "@/features/operations/tasks-center";

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; assigned_to?: string; due?: string }>;
}) {
  const filters = await searchParams;
  const [tasksResult, myTasksResult, refs] = await Promise.all([
    getTasks(filters),
    getMyTasks(),
    getTaskReferenceData()
  ]);

  return (
    <TasksCenter
      tasks={tasksResult.data}
      myTasks={myTasksResult.tasks}
      groupedMyTasks={myTasksResult.grouped}
      companies={refs.companies}
      clients={refs.clients}
      profiles={refs.profiles}
      projects={refs.projects}
      error={tasksResult.error || myTasksResult.error || refs.error}
    />
  );
}
