import { DashboardCenter } from "@/features/workspace/dashboard-center";
import { getDashboardOverview } from "@/features/workspace/data";

export default async function DashboardPage() {
  const {
    metrics,
    activities,
    myPending,
    bugs,
    incidents,
    recentFiles,
    recentPlaybooks,
    profiles,
    prospects,
    clients,
    projects,
    error
  } = await getDashboardOverview();

  return (
    <DashboardCenter
      metrics={metrics}
      activities={activities}
      myPending={myPending}
      bugs={bugs}
      incidents={incidents}
      recentFiles={recentFiles}
      recentPlaybooks={recentPlaybooks}
      profiles={profiles}
      prospects={prospects}
      clients={clients}
      projects={projects}
      error={error}
    />
  );
}
