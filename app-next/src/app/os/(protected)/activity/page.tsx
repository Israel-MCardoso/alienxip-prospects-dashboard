import { ActivityFeed } from "@/features/workspace/activity-feed";
import { getActivities, getWorkspaceReferenceData } from "@/features/workspace/data";
import { groupActivitiesByPeriod } from "@/features/workspace/workspace-helpers";

export default async function ActivityPage({
  searchParams
}: {
  searchParams: Promise<{ actor_id?: string; entity_type?: string; project_id?: string; prospect_id?: string; client_id?: string; company_id?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10);
  const [activities, refs] = await Promise.all([getActivities(filters), getWorkspaceReferenceData()]);

  const itemsPerPage = 10;
  const totalItems = activities.data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = activities.data.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const grouped = groupActivitiesByPeriod(paginatedData);

  return (
    <ActivityFeed
      grouped={grouped}
      profiles={refs.profiles}
      prospects={refs.prospects}
      projects={refs.projects}
      error={activities.error || refs.error}
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
    />
  );
}
