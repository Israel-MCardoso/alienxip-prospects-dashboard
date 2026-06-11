import { getTechBugs, getTechReferenceData } from "@/features/tech/data";
import { BugsPageView } from "@/features/tech/tech-pages";

export default async function BugsPage({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string }> }) {
  const filters = await searchParams;
  const [bugs, refs] = await Promise.all([getTechBugs(filters), getTechReferenceData()]);
  return <BugsPageView bugs={bugs.data} projects={refs.projects} error={bugs.error || refs.error} />;
}
