import { DashboardCenter } from "@/features/workspace/dashboard-center";
import { getDashboardOverview } from "@/features/workspace/data";

export default async function DashboardPage() {
  const { metrics, activities, myPending, error } = await getDashboardOverview();
  return <DashboardCenter metrics={metrics} activities={activities} myPending={myPending} error={error} />;
}
