import { notFound } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompany, getClients } from "@/features/commercial/data";
import { getProjects } from "@/features/operations/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCompanyAction } from "@/features/commercial/actions";
import { statusLabel, formatDate } from "@/features/operations/format";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data }, clientsResult, projectsResult] = await Promise.all([
    getCompany(id),
    getClients(),
    getProjects()
  ]);

  if (!data) notFound();

  // Filter clients and projects for this company
  const companyClients = clientsResult.data.filter((c) => c.company_id === data.id);
  const companyProjects = projectsResult.data.filter((p) => p.company_id === data.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumbs */}
      <div className="text-xs text-muted-foreground mb-1">
        <Link href="/os/dashboard" className="hover:underline">Dashboard</Link>
        {" > "}
        <Link href="/os/companies" className="hover:underline">Empresas</Link>
        {" > "}
        <span className="text-white">{data.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresa: {data.name}</h1>
          <p className="text-sm text-muted-foreground">Razão Social: {data.legal_name || "-"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informações de Registro</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div><strong className="text-white">Razão Social:</strong> {data.legal_name || "-"}</div>
            <div><strong className="text-white">Segmento:</strong> {data.segment || "-"}</div>
            <div><strong className="text-white">Localização:</strong> {[data.city, data.state].filter(Boolean).join(" / ") || "-"}</div>
            <div>
              <strong className="text-white">Site:</strong>{" "}
              {data.website_url ? (
                <a href={data.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {data.website_url}
                </a>
              ) : "-"}
            </div>
            <div>
              <strong className="text-white">Instagram:</strong>{" "}
              {data.instagram_url ? (
                <a href={data.instagram_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {data.instagram_url}
                </a>
              ) : "-"}
            </div>
            <div><strong className="text-white">WhatsApp:</strong> {data.whatsapp || "-"}</div>
            <div><strong className="text-white">Notas:</strong> {data.notes || "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editar Empresa</CardTitle>
            <CardDescription>Atualizar detalhes de contato e cadastro.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCompanyAction.bind(null, data.id)} className="grid gap-3">
              <Input name="name" placeholder="Nome" defaultValue={data.name} required />
              <Input name="legal_name" placeholder="Razão social" defaultValue={data.legal_name || ""} />
              <Input name="segment" placeholder="Segmento" defaultValue={data.segment || ""} />
              <div className="grid grid-cols-2 gap-2">
                <Input name="city" placeholder="Cidade" defaultValue={data.city || ""} />
                <Input name="state" placeholder="Estado" defaultValue={data.state || ""} />
              </div>
              <Input name="website_url" placeholder="Site URL" defaultValue={data.website_url || ""} />
              <Input name="instagram_url" placeholder="Instagram URL" defaultValue={data.instagram_url || ""} />
              <Input name="whatsapp" placeholder="WhatsApp" defaultValue={data.whatsapp || ""} />
              <textarea name="notes" placeholder="Observações" defaultValue={data.notes || ""} className="min-h-20 rounded-lg border bg-background p-2 text-sm" />
              <Button type="submit">Salvar Alterações</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Clientes Vinculados</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {companyClients.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum cliente vinculado a esta empresa.</p> : null}
            {companyClients.map((client) => (
              <Link key={client.id} href={`/os/clients/${client.id}`} className="rounded-lg border p-3 hover:bg-muted/50 block">
                <div className="font-medium text-white">{client.main_contact_name || "Contato Principal"}</div>
                <div className="text-xs text-muted-foreground">status: {client.status} | contrato: {client.contract_status}</div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projetos Vinculados</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {companyProjects.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum projeto associado.</p> : null}
            {companyProjects.map((project) => (
              <Link key={project.id} href={`/os/projects/${project.id}`} className="rounded-lg border p-3 hover:bg-muted/50 block">
                <div className="font-medium text-white">{project.name}</div>
                <div className="text-xs text-muted-foreground">{statusLabel(project.status)} | prazo: {formatDate(project.due_date)}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
