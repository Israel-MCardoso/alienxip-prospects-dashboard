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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Cliente {data.main_contact_name || data.id}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>Status: {data.status}</div>
          <div>Contrato: {data.contract_status}</div>
          <div>Contato: {data.main_contact_name || "-"}</div>
          <div>Email: {data.main_contact_email || "-"}</div>
          <div>Telefone: {data.main_contact_phone || "-"}</div>
          <div>Valor mensal: {data.monthly_value ?? "-"}</div>
        </CardContent>
      </Card>

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
            <div key={playbook.id} className="rounded-lg border p-3">
              <div className="font-medium">{playbook.title}</div>
              <div className="text-sm text-muted-foreground">{playbook.category}</div>
            </div>
          ))}
          {playbooks.data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum playbook publicado ainda.</p> : null}
        </CardContent>
      </Card>
      <FileList files={files.data} entityLabel="este cliente" entityType="client" entityId={data.id} />
    </div>
  );
}
