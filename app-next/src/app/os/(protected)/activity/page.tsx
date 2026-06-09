import { ActivityFeed } from "@/features/workspace/activity-feed";
import { getActivities, getWorkspaceReferenceData } from "@/features/workspace/data";

export default async function ActivityPage({
  searchParams
}: {
  searchParams: Promise<{ actor_id?: string; entity_type?: string; project_id?: string; prospect_id?: string; client_id?: string }>;
}) {
  const filters = await searchParams;
  const [activities, refs] = await Promise.all([getActivities(filters), getWorkspaceReferenceData()]);

  return (
    <ActivityFeed
      grouped={activities.grouped}
      profiles={refs.profiles}
      prospects={refs.prospects}
      projects={refs.projects}
      error={activities.error || refs.error}
    />
  );
}
