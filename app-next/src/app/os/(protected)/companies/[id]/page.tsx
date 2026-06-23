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
import { createClientFromCompanyAction, updateCompanyAction } from "@/features/commercial/actions";
import { getClients, getCompany } from "@/features/commercial/data";
import { createGeneralTaskAction } from "@/features/operations/actions";
import { getProjects, getTaskReferenceData, getTasks } from "@/features/operations/data";
import { formatDate, statusLabel } from "@/features/operations/format";
import { getActivities } from "@/features/workspace/data";

function whatsappHref(value: string | null) {
  if (!value) return undefined;
  if (value.startsWith("http")) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

const taskPriorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" }
];

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

function CompactClientForm({ companyId }: { companyId: string }) {
  return (
    <form action={createClientFromCompanyAction.bind(null, companyId)} className="grid gap-2">
      <Input name="main_contact_name" placeholder="Contato principal" />
      <Input name="main_contact_email" type="email" placeholder="Email do contato" />
      <Input name="main_contact_phone" placeholder="Telefone" />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <CustomSelect name="status" defaultValue="active" options={clientStatusOptions} />
        <CustomSelect name="contract_status" defaultValue="draft" options={contractStatusOptions} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Input name="monthly_value" type="number" min="0" step="0.01" placeholder="Valor mensal" />
        <Input name="start_date" type="date" />
      </div>
      <Button type="submit" size="sm">Criar cliente</Button>
    </form>
  );
}

function CompactTaskForm({
  companyId,
  profiles
}: {
  companyId: string;
  profiles: { id: string; full_name: string | null; email: string }[];
}) {
  return (
    <form action={createGeneralTaskAction} className="grid gap-2">
      <input type="hidden" name="company_id" value={companyId} />
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

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data }, clientsResult, projectsResult, refs, tasksResult, activitiesResult] = await Promise.all([
    getCompany(id),
    getClients({ company_id: id }),
    getProjects({ company_id: id }),
    getTaskReferenceData(),
    getTasks({ company_id: id }),
    getActivities({ entity_type: "company", company_id: id })
  ]);

  if (!data) notFound();

  const companyClients = clientsResult.data;
  const companyProjects = projectsResult.data;
  const responsible = refs.profiles.find((profile) => profile.id === data.owner_id);
  const companyWhatsAppHref = whatsappHref(data.whatsapp);
  const openTasks = tasksResult.data.filter((task) => task.status !== "completed" && task.status !== "canceled");
  const hasCompanyCreatedActivity = activitiesResult.data.some((activity) => activity.action === "company_created");
  const timelineItems: RecordTimelineItem[] = [
    ...(!hasCompanyCreatedActivity ? [{
      id: `company-created-${data.id}`,
      type: "status" as const,
      title: "Empresa cadastrada",
      description: data.segment || "Empresa registrada no CRM.",
      datetime: data.created_at
    }] : []),
    ...activitiesResult.data.map((activity) => ({
      id: `company-activity-${activity.id}`,
      type: "activity" as const,
      title: activity.title || activity.action,
      description: activity.description || activity.action,
      datetime: activity.created_at,
      meta: activity.action
    })),
    ...(data.notes ? [{
      id: `company-notes-${data.id}`,
      type: "note" as const,
      title: "Observacoes",
      description: data.notes,
      datetime: data.updated_at || data.created_at
    }] : []),
    ...companyClients.map((client) => ({
      id: `company-client-${client.id}`,
      type: "activity" as const,
      title: `Cliente vinculado: ${client.main_contact_name || "Contato principal"}`,
      description: `Status: ${client.status} | Contrato: ${client.contract_status}`,
      datetime: client.updated_at || client.created_at
    })),
    ...companyProjects.map((project) => ({
      id: `company-project-${project.id}`,
      type: "activity" as const,
      title: `Projeto: ${project.name}`,
      description: `${statusLabel(project.status)} | prazo: ${formatDate(project.due_date)}`,
      datetime: project.updated_at || project.created_at
    })),
    ...tasksResult.data.map((task) => ({
      id: `company-task-${task.id}`,
      type: "task" as const,
      title: task.title,
      description: task.description || `Status: ${statusLabel(task.status)} | Prioridade: ${task.priority}`,
      datetime: task.due_date || task.updated_at || task.created_at,
      meta: `Status: ${statusLabel(task.status)} | Prioridade: ${task.priority}`
    }))
  ];
  const companyProperties: RecordProperty[] = [
    { label: "Nome da empresa", value: data.name },
    { label: "Razao social", value: data.legal_name || "-" },
    { label: "Segmento", value: data.segment || "-" },
    { label: "Cidade/Estado", value: [data.city, data.state].filter(Boolean).join(" / ") || "-" },
    { label: "Website", value: data.website_url || "-", href: data.website_url || undefined },
    { label: "Instagram", value: data.instagram_url || "-", href: data.instagram_url || undefined },
    { label: "WhatsApp", value: data.whatsapp || "-", href: companyWhatsAppHref },
    { label: "Responsavel", value: responsible?.full_name || responsible?.email || "-" }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-muted-foreground">
        <Link href="/os/dashboard" className="hover:underline">Dashboard</Link>
        {" > "}
        <Link href="/os/companies" className="hover:underline">Empresas</Link>
        {" > "}
        <span className="text-foreground">{data.name}</span>
      </div>

      <RecordLayout
        header={
          <RecordHeader
            entityName={data.name}
            entityType="Empresa"
            status={data.segment || "Sem segmento"}
            meta={
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{data.legal_name || "Razao social nao definida"}</span>
                <span>{[data.city, data.state].filter(Boolean).join(" / ") || "Localizacao nao definida"}</span>
                <span>{companyClients.length} cliente(s)</span>
                <span>{companyProjects.length} projeto(s)</span>
              </div>
            }
          />
        }
        left={
          <RecordPropertiesPanel
            title="Propriedades da empresa"
            description="Ficha cadastral e canais de contato."
            properties={companyProperties}
          />
        }
        main={
          <div className="flex flex-col gap-4">
            <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Editar Empresa</CardTitle>
                <CardDescription>Atualizar detalhes de contato e cadastro.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateCompanyAction.bind(null, data.id)} className="grid gap-3">
                  <Input name="name" placeholder="Nome" defaultValue={data.name} required />
                  <Input name="legal_name" placeholder="Razao social" defaultValue={data.legal_name || ""} />
                  <Input name="segment" placeholder="Segmento" defaultValue={data.segment || ""} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input name="city" placeholder="Cidade" defaultValue={data.city || ""} />
                    <Input name="state" placeholder="Estado" defaultValue={data.state || ""} />
                  </div>
                  <Input name="website_url" placeholder="Site URL" defaultValue={data.website_url || ""} />
                  <Input name="instagram_url" placeholder="Instagram URL" defaultValue={data.instagram_url || ""} />
                  <Input name="whatsapp" placeholder="WhatsApp" defaultValue={data.whatsapp || ""} />
                  <textarea name="notes" placeholder="Observacoes" defaultValue={data.notes || ""} className="min-h-24 rounded-lg border border-border bg-background p-3 text-sm text-foreground" />
                  <Button type="submit">Salvar Alteracoes</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Clientes vinculados</CardTitle>
                  <CardDescription>{companyClients.length} cliente(s) nesta empresa</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {companyClients.length === 0 ? (
                    <EmptyState
                      title="Nenhum cliente"
                      description="Nenhum cliente vinculado a esta empresa."
                      className="p-6"
                    />
                  ) : null}
                  {companyClients.map((client) => (
                    <Link key={client.id} href={`/os/clients/${client.id}`} className="rounded-xl border border-white/5 bg-background/35 p-3 transition-colors hover:bg-muted/50">
                      <div className="font-medium text-foreground">{client.main_contact_name || "Contato principal"}</div>
                      <div className="text-xs text-muted-foreground">status: {client.status} | contrato: {client.contract_status}</div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Projetos vinculados</CardTitle>
                  <CardDescription>{companyProjects.length} projeto(s) associados</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {companyProjects.length === 0 ? (
                    <EmptyState
                      title="Nenhum projeto"
                      description="Nenhum projeto associado."
                      className="p-6"
                    />
                  ) : null}
                  {companyProjects.map((project) => (
                    <Link key={project.id} href={`/os/projects/${project.id}`} className="rounded-xl border border-white/5 bg-background/35 p-3 transition-colors hover:bg-muted/50">
                      <div className="font-medium text-foreground">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{statusLabel(project.status)} | prazo: {formatDate(project.due_date)}</div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>

            <RecordTimeline
              title="Timeline operacional"
              items={timelineItems}
              emptyLabel="Nenhum historico operacional registrado para esta empresa."
            />
          </div>
        }
        right={
          <RecordActionsPanel
            actions={[
              { label: "Criar cliente", description: "Acao real disponivel no formulario rapido abaixo." },
              { label: "Criar tarefa", description: "Acao real disponivel no formulario rapido abaixo." },
              { label: "Abrir website", href: data.website_url || undefined, disabled: !data.website_url },
              { label: "Abrir Instagram", href: data.instagram_url || undefined, disabled: !data.instagram_url },
              { label: "Abrir WhatsApp", href: companyWhatsAppHref, disabled: !companyWhatsAppHref }
            ]}
            sections={
              <>
                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Criar cliente</CardTitle>
                    <CardDescription>Vinculado automaticamente a esta empresa.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompactClientForm companyId={data.id} />
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Criar tarefa</CardTitle>
                    <CardDescription>{openTasks.length} tarefa(s) aberta(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompactTaskForm companyId={data.id} profiles={refs.profiles} />
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Clientes vinculados</CardTitle>
                    <CardDescription>{companyClients.length} cliente(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {companyClients.length === 0 ? <p className="text-xs text-muted-foreground">Sem clientes vinculados.</p> : null}
                    {companyClients.slice(0, 5).map((client) => (
                      <Link key={client.id} href={`/os/clients/${client.id}`} className="rounded-lg border border-white/5 p-2 text-xs hover:bg-muted/50">
                        <div className="font-medium text-foreground">{client.main_contact_name || "Contato principal"}</div>
                        <div className="text-muted-foreground">{client.contract_status}</div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Projetos vinculados</CardTitle>
                    <CardDescription>{companyProjects.length} projeto(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {companyProjects.length === 0 ? <p className="text-xs text-muted-foreground">Sem projetos vinculados.</p> : null}
                    {companyProjects.slice(0, 5).map((project) => (
                      <Link key={project.id} href={`/os/projects/${project.id}`} className="rounded-lg border border-white/5 p-2 text-xs hover:bg-muted/50">
                        <div className="font-medium text-foreground">{project.name}</div>
                        <div className="text-muted-foreground">{statusLabel(project.status)}</div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-background/35">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider">Observacoes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {data.notes || "Nenhuma observacao registrada."}
                    </p>
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
