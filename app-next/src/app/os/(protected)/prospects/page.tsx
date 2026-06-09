import { getProspects } from "@/features/prospects/data";
import { ProspectsCrm } from "@/features/prospects/prospects-crm";

export default async function ProspectsPage() {
  const { data, error, isConfigured } = await getProspects();

  return <ProspectsCrm prospects={data} error={error} isConfigured={isConfigured} />;
}
