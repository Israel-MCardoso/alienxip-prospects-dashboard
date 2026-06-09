import { getTechIncidents, getTechReferenceData } from "@/features/tech/data";
import { IncidentsPageView } from "@/features/tech/tech-pages";

export default async function IncidentsPage() {
  const [incidents, refs] = await Promise.all([getTechIncidents(), getTechReferenceData()]);
  return <IncidentsPageView incidents={incidents.data} projects={refs.projects} error={incidents.error || refs.error} />;
}
