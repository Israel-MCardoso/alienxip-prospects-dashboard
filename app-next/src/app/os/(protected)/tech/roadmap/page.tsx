import { getTechRoadmap, getTechReferenceData } from "@/features/tech/data";
import { RoadmapPageView } from "@/features/tech/tech-pages";

export default async function RoadmapPage() {
  const [items, refs] = await Promise.all([getTechRoadmap(), getTechReferenceData()]);
  return <RoadmapPageView items={items.data} projects={refs.projects} error={items.error || refs.error} />;
}
