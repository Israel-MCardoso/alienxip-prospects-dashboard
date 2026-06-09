import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { completeGeneralTaskAction, updateProjectStatusAction } from "./actions";
import { calculateProjectProgress } from "./operations-helpers";
import type { ProjectActivityRow, ProjectRow, TaskRow } from "./data";
import { formatDate, priorityLabel, statusLabel } from "./format";

export function ProjectWorkspace({
  project,
  tasks,
  activities
}: {
  project: ProjectRow;
  tasks: TaskRow[];
  activities: ProjectActivityRow[];
}) {
  const progress = calculateProjectProgress(tasks);
  const openTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "canceled").length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2">
            <Link className="inline-flex h-7 items-center rounded-lg border px-2.5 text-sm hover:bg-muted" href="/os/projects">Voltar</Link>
          </div>
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
          <Button type="submit">Atualizar</Button>
        </form>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader><CardTitle>Dados do projeto</CardTitle></CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  {project.client_id ? <Link className="text-primary hover:underline" href={`/os/clients/${project.client_id}`}>{project.client_id}</Link> : "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Empresa:</span>{" "}
                  {project.company_id ? <Link className="text-primary hover:underline" href={`/os/companies/${project.company_id}`}>{project.company_id}</Link> : "-"}
                </div>
                <div><span className="text-muted-foreground">Inicio:</span> {formatDate(project.start_date)}</div>
                <div><span className="text-muted-foreground">Prazo:</span> {formatDate(project.due_date)}</div>
                <div><span className="text-muted-foreground">Responsavel:</span> {project.owner_id || "-"}</div>
                <div><span className="text-muted-foreground">Criado por:</span> {project.created_by || "-"}</div>
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
                    <div className="text-xs text-muted-foreground">
                      {task.prospect_id ? <Link className="text-primary hover:underline" href={`/os/prospects/${task.prospect_id}`}>Prospect</Link> : null}
                      {task.client_id ? <Link className="ml-2 text-primary hover:underline" href={`/os/clients/${task.client_id}`}>Cliente</Link> : null}
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
                  <div className="font-medium">{activity.description || activity.action_type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString("pt-BR")}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files"><Card><CardHeader><CardTitle>Arquivos</CardTitle><CardDescription>Placeholder para Supabase Storage na Sprint futura.</CardDescription></CardHeader><CardContent><Button variant="outline" disabled>Adicionar arquivo</Button></CardContent></Card></TabsContent>
        <TabsContent value="notes"><Card><CardHeader><CardTitle>Notas</CardTitle><CardDescription>Placeholder funcional para notas de projeto.</CardDescription></CardHeader><CardContent className="flex flex-col gap-2"><textarea className="min-h-24 rounded-lg border bg-background p-3 text-sm" placeholder="Notas de projeto serao persistidas em sprint futura." disabled /><Button variant="outline" disabled>Salvar nota</Button></CardContent></Card></TabsContent>
        <TabsContent value="settings"><Card><CardHeader><CardTitle>Settings</CardTitle><CardDescription>Placeholder para configuracoes do projeto.</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Ownership, permissoes e automacoes serao refinados nas proximas sprints.</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
