import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClient } from "@/features/commercial/data";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await getClient(id);
  if (!data) notFound();

  return (
    <Card>
      <CardHeader><CardTitle>Cliente {data.id}</CardTitle></CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div>Status: {data.status}</div>
        <div>Contrato: {data.contract_status}</div>
        <div>Contato: {data.main_contact_name || "-"}</div>
        <div>Email: {data.main_contact_email || "-"}</div>
        <div>Telefone: {data.main_contact_phone || "-"}</div>
        <div>Valor mensal: {data.monthly_value ?? "-"}</div>
      </CardContent>
    </Card>
  );
}
