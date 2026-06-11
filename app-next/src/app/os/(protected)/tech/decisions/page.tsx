import { getTechnicalDecisions, getTechReferenceData } from "@/features/tech/data";
import { DecisionsPageView } from "@/features/tech/tech-pages";

export default async function DecisionsPage() {
  const [items, refs] = await Promise.all([getTechnicalDecisions(), getTechReferenceData()]);
  return <DecisionsPageView items={items.data} projects={refs.projects} error={items.error || refs.error} />;
}
