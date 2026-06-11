import { notFound } from "next/navigation";

import { ProspectForm } from "@/features/prospects/prospect-form";
import { getProspect } from "@/features/prospects/data";

export default async function EditProspectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error, isConfigured } = await getProspect(id);

  if (!data && isConfigured && !error) {
    notFound();
  }

  return <ProspectForm prospect={data} isConfigured={isConfigured} />;
}
