import { getTechOverview } from "@/features/tech/data";
import { TechCenter } from "@/features/tech/tech-center";

export default async function TechPage() {
  const { bugs, incidents, backlog, roadmap, decisions, error } = await getTechOverview();
  return <TechCenter bugs={bugs} incidents={incidents} backlog={backlog} roadmap={roadmap} decisions={decisions} error={error} />;
}
