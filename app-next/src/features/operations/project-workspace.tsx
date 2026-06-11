import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  completeGeneralTaskAction,
  updateProjectStatusAction,
  updateProjectAction,
  duplicateProjectAction,
  archiveProjectAction
} from "./actions";
import { calculateProjectProgress } from "./operations-helpers";
import type { ProjectActivityRow, ProjectRow, TaskRow, ClientRow, CompanyRow, ProfileRow } from "./data";
import { formatDate, priorityLabel, statusLabel } from "./format";
import { FileList } from "@/features/tech/file-list";
import { ProjectNotes } from "@/features/tech/project-notes";
import type { FileRow, ProjectNoteRow } from "@/features/tech/data";
import { ProjectWikiLinks } from "@/features/knowledge/project-wiki-links";
import type { WikiPageRow } from "@/features/knowledge/data";

export function ProjectWorkspace({
  project,
  tasks,
  activities,
  notes,
  files,
  wikiPages,
  allWikiPages,
  clients = [],
  companies = [],
  profiles = []
}: {
  project: ProjectRow;
  tasks: TaskRow[];
  activities: ProjectActivityRow[];
  notes: ProjectNoteRow[];
  files: FileRow[];
  wikiPages: WikiPageRow[];
  allWikiPages: WikiPageRow[];
  clients?: ClientRow[];
  companies?: CompanyRow[];
  profiles?: ProfileRow[];
}) {
  const progress = calculateProjectProgress(tasks);
  const openTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "canceled").length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  const clientObj = clients.find((c) => c.id === project.client_id);
  const clientCompany = companies.find((c) => c.id === clientObj?.company_id);
  const resolvedClientLabel = clientCompany
    ? `${clientObj?.main_contact_name || "Contato"} (${clientCompany.name})`
    : (clientObj?.main_contact_name || project.client_id || "-");

  const resolvedCompanyLabel = companies.find((c) => c.id === project.company_id)?.name || project.company_id || "-";
  const resolvedOwnerLabel = profiles.find((p) => p.id === project.owner_id)?.full_name || profiles.find((p) => p.id === project.owner_id)?.email || project.owner_id || "-";
  const resolvedCreatorLabel = profiles.find((p) => p.id === project.created_by)?.full_name || profiles.find((p) => p.id === project.created_by)?.email || project.created_by || "-";

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumbs */}
      <div className="text-xs text-muted-foreground mb-1">
        <Link href="/os/dashboard" className="hover:underline">Dashboard</Link>
        {" > "}
        <Link href="/os/projects" className="hover:underline">Projetos</Link>
        {" > "}
        <span className="text-white">{project.name}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{statusLabel(project.status)}</Badge>
            <Badge variant="secondary">{priorityLabel(project.priority)}</Badge>
            <Badge variant="outline">{progress}% concluido</Badge>
          </div>
        </div>
        <form action={updateProjectStatusAction.bind(null, project.id)} className="flex gap-2">
          <select name="status" defaultValue={project.status} className="h-8 rounded-lg border bg-background px-2 text-sm">
            <option value="planning">Planejamento</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluido</option>
            <option value="canceled">Cancelado</option>
          </select>
          <Button type="submit">Atualizar status</Button>
        </form>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="wiki">Wiki Links</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader><CardTitle>Dados do projeto</CardTitle></CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  {project.client_id ? (
                    <Link className="text-primary hover:underline" href={`/os/clients/${project.client_id}`}>
                      {resolvedClientLabel}
                    </Link>
                  ) : "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Empresa:</span>{" "}
                  {project.company_id ? (
                    <Link className="text-primary hover:underline" href={`/os/companies/${project.company_id}`}>
                      {resolvedCompanyLabel}
                    </Link>
                  ) : "-"}
                </div>
                <div><span className="text-muted-foreground">Inicio:</span> {formatDate(project.start_date)}</div>
                <div><span className="text-muted-foreground">Prazo:</span> {formatDate(project.due_date)}</div>
                <div><span className="text-muted-foreground">Responsavel:</span> {resolvedOwnerLabel}</div>
                <div><span className="text-muted-foreground">Criado por:</span> {resolvedCreatorLabel}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Descricao:</span> {project.description || "-"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Metricas</CardTitle></CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Progresso</div><div className="text-2xl font-semibold">{progress}%</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Abertas</div><div className="text-2xl font-semibold">{openTasks}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Concluidas</div><div className="text-2xl font-semibold">{completedTasks}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Prazo</div><div className="text-lg font-semibold">{formatDate(project.due_date)}</div></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader><CardTitle>Tarefas vinculadas</CardTitle><CardDescription>{tasks.length} tarefa(s)</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada.</p> : null}
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{statusLabel(task.status)} | {priorityLabel(task.priority)} | {formatDate(task.due_date)}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                      {task.prospect_id ? <Link className="text-primary hover:underline" href={`/os/prospects/${task.prospect_id}`}>Prospect</Link> : null}
                      {task.client_id ? <Link className="text-primary hover:underline" href={`/os/clients/${task.client_id}`}>Cliente</Link> : null}
                    </div>
                  </div>
                  {task.status !== "completed" ? (
                    <form action={completeGeneralTaskAction.bind(null, task.id, task.project_id)}>
                      <Button size="sm" variant="outline" type="submit">Concluir</Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activities.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p> : null}
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border p-3">
                  <div className="font-medium text-white">{activity.description || activity.action_type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString("pt-BR")}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files"><FileList files={files} entityLabel="este projeto" entityType="project" entityId={project.id} /></TabsContent>
        <TabsContent value="notes"><ProjectNotes projectId={project.id} notes={notes} /></TabsContent>
        <TabsContent value="wiki"><ProjectWikiLinks projectId={project.id} pages={wikiPages} allPages={allWikiPages} /></TabsContent>
        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Editar Projeto</CardTitle>
                <CardDescription>Atualizar nome, descrição, prazos e responsabilidade.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateProjectAction.bind(null, project.id)} className="grid gap-3">
                  <Input name="name" placeholder="Nome do projeto" defaultValue={project.name} required />
                  <textarea name="description" placeholder="Descrição" defaultValue={project.description || ""} className="min-h-24 rounded-lg border bg-background p-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select name="status" defaultValue={project.status} className="h-8 rounded-lg border bg-background px-2 text-sm">
                      <option value="planning">Planejamento</option>
                      <option value="active">Ativo</option>
                      <option value="paused">Pausado</option>
                      <option value="completed">Concluido</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                    <select name="priority" defaultValue={project.priority} className="h-8 rounded-lg border bg-background px-2 text-sm">
                      <option value="low">Baixa</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Início</label>
                      <Input name="start_date" type="date" defaultValue={project.start_date || ""} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Prazo</label>
                      <Input name="due_date" type="date" defaultValue={project.due_date || ""} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Responsável</label>
                    <select name="owner_id" defaultValue={project.owner_id || ""} className="h-8 w-full rounded-lg border bg-background px-2 text-sm">
                      <option value="">Sem responsável</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit">Salvar Alterações</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Adicionais</CardTitle>
                <CardDescription>Duplicação e cancelamento/arquivamento lógico do projeto.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <form action={duplicateProjectAction.bind(null, project.id)}>
                  <Button type="submit" variant="outline" className="w-full justify-start">Duplicar Projeto (Criar Cópia)</Button>
                </form>
                <form action={archiveProjectAction.bind(null, project.id)}>
                  <Button type="submit" variant="destructive" className="w-full justify-start">Arquivar / Cancelar Projeto</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
