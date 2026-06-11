import { notFound } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClient } from "@/features/commercial/data";
import { getClientProjects, getTaskReferenceData } from "@/features/operations/data";
import { formatDate, statusLabel } from "@/features/operations/format";
import { ProjectForm } from "@/features/operations/project-form";
import { FileList } from "@/features/tech/file-list";
import { getEntityFiles } from "@/features/tech/data";
import { getPlaybooks } from "@/features/knowledge/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClientAction, archiveClientAction, restoreClientAction } from "@/features/commercial/actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data }, projectsResult, refs, files, playbooks] = await Promise.all([
    getClient(id),
    getClientProjects(id),
    getTaskReferenceData(),
    getEntityFiles("client", id),
    getPlaybooks({ status: "published" })
  ]);
  if (!data) notFound();

  const company = refs.companies.find((c) => c.id === data.company_id);
  const companyName = company?.name || "-";

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumbs */}
      <div className="text-xs text-muted-foreground mb-1">
        <Link href="/os/dashboard" className="hover:underline">Dashboard</Link>
        {" > "}
        <Link href="/os/clients" className="hover:underline">Clientes</Link>
        {" > "}
        <span className="text-white">{data.main_contact_name || companyName}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cliente: {data.main_contact_name || companyName}</h1>
          <p className="text-sm text-muted-foreground">
            Status: {statusLabel(data.status)} | Empresa vinculada:{" "}
            <Link href={`/os/companies/${data.company_id}`} className="text-primary hover:underline">
              {companyName}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          {data.status === "former" ? (
            <form action={restoreClientAction.bind(null, data.id)}>
              <Button variant="outline" size="sm" type="submit">Restaurar Cliente</Button>
            </form>
          ) : (
            <form action={archiveClientAction.bind(null, data.id)}>
              <Button variant="outline" size="sm" type="submit">Arquivar Cliente</Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informações do Cliente</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              <strong>Empresa:</strong>{" "}
              <Link href={`/os/companies/${data.company_id}`} className="text-primary hover:underline">
                {companyName}
              </Link>
            </div>
            <div><strong>Status:</strong> {data.status}</div>
            <div><strong>Contrato:</strong> {data.contract_status}</div>
            <div><strong>Contato Principal:</strong> {data.main_contact_name || "-"}</div>
            <div><strong>Email:</strong> {data.main_contact_email || "-"}</div>
            <div><strong>Telefone:</strong> {data.main_contact_phone || "-"}</div>
            <div><strong>Valor Mensal:</strong> {data.monthly_value ?? "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editar Cliente</CardTitle>
            <CardDescription>Atualizar informações e contrato.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateClientAction.bind(null, data.id)} className="grid gap-3">
              <Input name="main_contact_name" placeholder="Contato principal" defaultValue={data.main_contact_name || ""} />
              <Input name="main_contact_email" placeholder="Email" defaultValue={data.main_contact_email || ""} />
              <Input name="main_contact_phone" placeholder="Telefone" defaultValue={data.main_contact_phone || ""} />
              <Input name="monthly_value" type="number" placeholder="Valor mensal" defaultValue={data.monthly_value || ""} />
              <div className="grid grid-cols-2 gap-2">
                <select name="status" defaultValue={data.status} className="h-8 rounded-lg border bg-background px-2 text-sm">
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="former">former</option>
                </select>
                <select name="contract_status" defaultValue={data.contract_status} className="h-8 rounded-lg border bg-background px-2 text-sm">
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <Button type="submit">Salvar Alterações</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projetos do cliente</CardTitle>
          <CardDescription>{projectsResult.data.length} projeto(s) vinculado(s)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {projectsResult.data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum projeto vinculado.</p> : null}
          {projectsResult.data.map((project) => (
            <Link key={project.id} href={`/os/projects/${project.id}`} className="rounded-lg border p-3 hover:bg-muted/50">
              <div className="font-medium">{project.name}</div>
              <div className="text-sm text-muted-foreground">{statusLabel(project.status)} | prazo: {formatDate(project.due_date)}</div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Criar projeto para este cliente</CardTitle></CardHeader>
        <CardContent>
          <ProjectForm
            clients={refs.clients}
            companies={refs.companies}
            profiles={refs.profiles}
            defaults={{ client_id: data.id, company_id: data.company_id }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Playbooks relacionados</CardTitle><CardDescription>Processos úteis para atendimento e operação do cliente.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {playbooks.data.slice(0, 5).map((playbook) => (
            <Link
              key={playbook.id}
              href={`/os/playbooks/${playbook.id}`}
              className="rounded-lg border p-3 hover:bg-muted/50 block transition-colors"
            >
              <div className="font-medium text-white hover:text-primary transition-colors">{playbook.title}</div>
              <div className="text-sm text-muted-foreground">{playbook.category}</div>
            </Link>
          ))}
          {playbooks.data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum playbook publicado ainda.</p> : null}
        </CardContent>
      </Card>
      <FileList files={files.data} entityLabel="este cliente" entityType="client" entityId={data.id} />
    </div>
  );
}
