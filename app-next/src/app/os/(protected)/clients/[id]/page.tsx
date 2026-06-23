import { notFound } from "next/navigation";
import Link from "next/link";

import {
  RecordActionsPanel,
  RecordHeader,
  RecordLayout,
  RecordPropertiesPanel,
  RecordTimeline,
  type RecordTimelineItem,
  type RecordProperty
} from "@/components/records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { archiveClientAction, restoreClientAction, updateClientAction } from "@/features/commercial/actions";
import { getClient } from "@/features/commercial/data";
import { getPlaybooks } from "@/features/knowledge/data";
import { createGeneralTaskAction } from "@/features/operations/actions";
import { getClientProjects, getTaskReferenceData, getTasks } from "@/features/operations/data";
import { formatDate, statusLabel } from "@/features/operations/format";
import { ProjectForm } from "@/features/operations/project-form";
import { getEntityFiles } from "@/features/tech/data";
import { FileList } from "@/features/tech/file-list";
import { getActivities } from "@/features/workspace/data";

function formatCurrency(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

const clientStatusOptions = [
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "former", label: "Antigo" }
];

const contractStatusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "cancelled", label: "Cancelado" }
];

const taskPriorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" }
];

function CompactTaskForm({
  clientId,
  companyId,
  profiles
}: {
  clientId?: string;
  companyId?: string;
  profiles: { id: string; full_name: string | null; email: string }[];
}) {
  return (
    <form action={createGeneralTaskAction} className="grid gap-2">
      {clientId ? <input type="hidden" name="client_id" value={clientId} /> : null}
      {companyId ? <input type="hidden" name="company_id" value={companyId} /> : null}
      <Input name="title" placeholder="Nova tarefa" required />
      <Input name="due_date" type="date" />
      <CustomSelect name="priority" defaultValue="medium" options={taskPriorityOptions} />
      <CustomSelect
        name="assigned_to"
        defaultValue=""
        placeholder="Responsavel atual"
        options={[
          { value: "", label: "Responsavel atual" },
          ...profiles.map((profile) => ({ value: profile.id, label: profile.full_name || profile.email }))
        ]}
      />
      <textarea name="description" placeholder="Descricao" className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
      <Button type="submit" size="sm">Criar tarefa</Button>
    </form>
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data }, projectsResult, refs, files, playbooks, tasksResult, activitiesResult] = await Promise.all([
    getClient(id),
    getClientProjects(id),
    getTaskReferenceData(),
    getEntityFiles("client", id),
    getPlaybooks({ status: "published" }),
    getTasks({ client_id: id }),
    getActivities({ entity_type: "client", client_id: id })
  ]);
  if (!data) notFound();

  const company = refs.companies.find((c) => c.id === data.company_id);
  const responsible = refs.profiles.find((profile) => profile.id === data.owner_id);
  const companyName = company?.name || "-";
  const activeProjects = projectsResult.data.filter((project) => project.status !== "completed" && project.status !== "canceled");
  const openTasks = tasksResult.data.filter((task) => task.status !== "completed" && task.status !== "canceled");
  const recentFiles = files.data.slice(0, 3);
  const clientLabel = data.main_contact_name || companyName;
  const hasClientCreatedActivity = activitiesResult.data.some((activity) => activity.action === "client_created");
  const timelineItems: RecordTimelineItem[] = [
    ...(!hasClientCreatedActivity ? [{
      id: `client-created-${data.id}`,
      type: "status" as const,
      title: "Cliente cadastrado",
      description: `Status: ${statusLabel(data.status)} | Contrato: ${data.contract_status}`,
      datetime: data.created_at
    }] : []),
    ...activitiesResult.data.map((activity) => ({
      id: `client-activity-${activity.id}`,
      type: "activity" as const,
      title: activity.title || activity.action,
      description: activity.description || activity.action,
      datetime: activity.created_at,
      meta: activity.action
    })),
    {
      id: `client-contract-${data.id}`,
      type: "status",
      title: "Contrato atual",
      description: `${data.contract_status} | ${formatCurrency(data.monthly_value)}`,
      datetime: data.updated_at || data.created_at
    },
    ...projectsResult.data.map((project) => ({
      id: `client-project-${project.id}`,
      type: "activity" as const,
      title: `Projeto: ${project.name}`,
      description: `${statusLabel(project.status)} | prazo: ${formatDate(project.due_date)}`,
      datetime: project.updated_at || project.created_at
    })),
    ...tasksResult.data.map((task) => ({
      id: `client-task-${task.id}`,
      type: "task" as const,
      title: task.title,
      description: task.description || `Status: ${statusLabel(task.status)} | Prioridade: ${task.priority}`,
      datetime: task.due_date || task.updated_at || task.created_at,
      meta: `Status: ${statusLabel(task.status)} | Prioridade: ${task.priority}`
    })),
    ...files.data.map((file) => ({
      id: `client-file-${file.id}`,
      type: "activity" as const,
      title: `Arquivo: ${file.file_name}`,
      description: file.file_type || "Arquivo vinculado ao cliente.",
      datetime: file.created_at
    }))
  ];
  const clientProperties: RecordProperty[] = [
    { label: "Nome do cliente", value: clientLabel },
    { label: "Status", value: statusLabel(data.status) },
    { label: "Status do contrato", value: data.contract_status },
    { label: "Valor mensal", value: formatCurrency(data.monthly_value) },
    { label: "Data de inicio", value: data.start_date ? formatDate(data.start_date) : "-" },
    { label: "Contato principal", value: data.main_contact_name || "-" },
    { label: "Email", value: data.main_contact_email || "-" },
    { label: "Telefone", value: data.main_contact_phone || "-" },
    { label: "Empresa relacionada", value: companyName, href: data.company_id ? `/os/companies/${data.company_id}` : undefined },
    { label: "Responsavel", value: responsible?.full_name || responsible?.email || "-" }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-muted-foreground">
        <Link href="/os/dashboard" className="hover:underline">Dashboard</Link>
        {" > "}
        <Link href="/os/clients" className="hover:underline">Clientes</Link>
        {" > "}
        <span className="text-foreground">{clientLabel}</span>
      </div>

      <RecordLayout
        header={
          <RecordHeader
            entityName={clientLabel}
            entityType="Cliente"
            status={statusLabel(data.status)}
            meta={
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Contrato: {data.contract_status}</span>
                <span>MRR: {formatCurrency(data.monthly_value)}</span>
                <Link href={`/os/companies/${data.company_id}`} className="text-primary hover:underline">
                  {companyName}
                </Link>
              </div>
            }
            actions={
              data.status === "former" ? (
                <form action={restoreClientAction.bind(null, data.id)}>
                  <Button variant="outline" size="sm" type="submit">Restaurar Cliente</Button>
                </form>
              ) : (
                <form action={archiveClientAction.bind(null, data.id)}>
                  <Button variant="outline" size="sm" type="submit">Arquivar Cliente</Button>
                </form>
              )
            }
          />
        }
        left={
          <RecordPropertiesPanel
            title="Propriedades do cliente"
            description="Ficha comercial e contratual."
            properties={clientProperties}
          />
        }
        main={
          <div className="flex flex-col gap-4">
            <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Editar Cliente</CardTitle>
                <CardDescription>Atualizar informacoes e contrato.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateClientAction.bind(null, data.id)} className="grid gap-3">
                  <Input name="main_contact_name" placeholder="Contato principal" defaultValue={data.main_contact_name || ""} />
                  <Input name="main_contact_email" placeholder="Email" defaultValue={data.main_contact_email || ""} />
                  <Input name="main_contact_phone" placeholder="Telefone" defaultValue={data.main_contact_phone || ""} />
                  <Input name="monthly_value" type="number" placeholder="Valor mensal" defaultValue={data.monthly_value || ""} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <CustomSelect name="status" defaultValue={data.status} options={clientStatusOptions} />
                    <CustomSelect name="contract_status" defaultValue={data.contract_status} options={contractStatusOptions} />
                  </div>
                  <Button type="submit">Salvar Alteracoes</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Projetos do cliente</CardTitle>
                <CardDescription>{projectsResult.data.length} projeto(s) vinculado(s)</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {projectsResult.data.length === 0 ? (
                  <EmptyState
                    title="Nenhum projeto"
                    description="Nenhum projeto vinculado a este cliente."
                    className="p-6"
                  />
                ) : null}
                {projectsResult.data.map((project) => (
                  <Link key={project.id} href={`/os/projects/${project.id}`} className="rounded-xl border border-white/5 bg-background/35 p-3 transition-colors hover:bg-muted/50">
                    <div className="font-medium text-foreground">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{statusLabel(project.status)} | prazo: {formatDate(project.due_date)}</div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Criar projeto para este cliente</CardTitle>
                <CardDescription>Projeto vinculado automaticamente ao cliente e empresa.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectForm
                  clients={refs.clients}
                  companies={refs.companies}
                  profiles={refs.profiles}
                  defaults={{ client_id: data.id, company_id: data.company_id }}
                />
              </CardContent>
            </Card>

            <FileList files={files.data} entityLabel="este cliente" entityType="client" entityId={data.id} />

            <RecordTimeline
              title="Timeline operacional"
              items={timelineItems}
              emptyLabel="Nenhum historico operacional registrado para este cliente."
            />
          </div>
        }
        right={
          <RecordActionsPanel
            actions={[
              { label: "Criar projeto", description: "Use o formulario central para criar com os vinculos corretos." },
              { label: "Criar tarefa", description: "Acao real disponivel no formulario rapido abaixo." },
              { label: "Ver arquivos", href: "#arquivos", description: `${files.data.length} arquivo(s) vinculados.` },
              { label: "Abrir empresa relacionada", href: data.company_id ? `/os/companies/${data.company_id}` : undefined, disabled: !data.company_id },
              data.status === "former"
                ? { label: "Restaurar cliente", description: "Acao preservada no cabecalho para envio seguro." }
                : { label: "Arquivar cliente", description: "Acao preservada no cabecalho para envio seguro." }
            ]}
            sections={
              <>
                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Criar tarefa</CardTitle>
                    <CardDescription>{openTasks.length} tarefa(s) aberta(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompactTaskForm clientId={data.id} companyId={data.company_id} profiles={refs.profiles} />
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Projetos ativos</CardTitle>
                    <CardDescription>{activeProjects.length} em andamento</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {activeProjects.length === 0 ? <p className="text-xs text-muted-foreground">Sem projetos ativos.</p> : null}
                    {activeProjects.slice(0, 4).map((project) => (
                      <Link key={project.id} href={`/os/projects/${project.id}`} className="rounded-lg border border-white/5 p-2 text-xs hover:bg-muted/50">
                        <div className="font-medium text-foreground">{project.name}</div>
                        <div className="text-muted-foreground">{statusLabel(project.status)}</div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card id="arquivos" className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Arquivos recentes</CardTitle>
                    <CardDescription>{files.data.length} arquivo(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {recentFiles.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum arquivo recente.</p> : null}
                    {recentFiles.map((file) => (
                      <div key={file.id} className="rounded-lg border border-white/5 p-2 text-xs">
                        <div className="truncate font-medium text-foreground">{file.file_name}</div>
                        <div className="text-muted-foreground">{file.file_type || "arquivo"}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Playbooks relacionados</CardTitle>
                    <CardDescription>Processos uteis para atendimento.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {playbooks.data.slice(0, 5).map((playbook) => (
                      <Link key={playbook.id} href={`/os/playbooks/${playbook.id}`} className="rounded-lg border border-white/5 p-2 text-xs transition-colors hover:bg-muted/50">
                        <div className="font-medium text-foreground">{playbook.title}</div>
                        <div className="text-muted-foreground">{playbook.category}</div>
                      </Link>
                    ))}
                    {playbooks.data.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum playbook publicado ainda.</p> : null}
                  </CardContent>
                </Card>
              </>
            }
          />
        }
      />
    </div>
  );
}
