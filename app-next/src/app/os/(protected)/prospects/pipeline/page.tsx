import { getPipelineProspects } from "@/features/commercial/data";
import { PipelineBoard } from "@/features/commercial/pipeline-board";

export default async function PipelinePage() {
  const { prospects, tasks, error } = await getPipelineProspects();

  return <PipelineBoard prospects={prospects} tasks={tasks} error={error} />;
}
