import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompany } from "@/features/commercial/data";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await getCompany(id);
  if (!data) notFound();

  return (
    <Card>
      <CardHeader><CardTitle>{data.name}</CardTitle></CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div>Razao social: {data.legal_name || "-"}</div>
        <div>Segmento: {data.segment || "-"}</div>
        <div>Localizacao: {[data.city, data.state].filter(Boolean).join(" / ") || "-"}</div>
        <div>Site: {data.website_url || "-"}</div>
        <div>Instagram: {data.instagram_url || "-"}</div>
        <div>WhatsApp: {data.whatsapp || "-"}</div>
        <div>Notas: {data.notes || "-"}</div>
      </CardContent>
    </Card>
  );
}
