import { getProspects } from "@/features/prospects/data";
import { ProspectsCrm } from "@/features/prospects/prospects-crm";

export default async function ProspectsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; temperature?: string; mine?: string }>;
}) {
  const filters = await searchParams;
  const { data, error, isConfigured } = await getProspects(filters);

  return <ProspectsCrm prospects={data} error={error} isConfigured={isConfigured} />;
}
