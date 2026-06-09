import { getTechBacklog, getTechReferenceData } from "@/features/tech/data";
import { BacklogPageView } from "@/features/tech/tech-pages";

export default async function BacklogPage() {
  const [items, refs] = await Promise.all([getTechBacklog(), getTechReferenceData()]);
  return <BacklogPageView items={items.data} projects={refs.projects} error={items.error || refs.error} />;
}
