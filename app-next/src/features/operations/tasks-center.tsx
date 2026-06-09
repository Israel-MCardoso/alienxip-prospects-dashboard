import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { completeGeneralTaskAction } from "./actions";
import type { ClientRow, CompanyRow, ProfileRow, ProjectRow, TaskRow } from "./data";
import { formatDate, priorityLabel, statusLabel } from "./format";
import { TaskForm } from "./task-form";

function profileName(profiles: ProfileRow[], id: string | null) {
  const profile = profiles.find((item) => item.id === id);
  return profile?.full_name || profile?.email || "-";
}

function projectName(projects: ProjectRow[], id: string | null) {
  return projects.find((item) => item.id === id)?.name || "-";
}

function TaskTable({ tasks, profiles, projects }: { tasks: TaskRow[]; profiles: ProfileRow[]; projects: ProjectRow[] }) {
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarefa</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Responsavel</TableHead>
          <TableHead>Projeto</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <div className="font-medium">{task.title}</div>
              {task.description ? <div className="text-xs text-muted-foreground">{task.description}</div> : null}
            </TableCell>
            <TableCell><Badge variant="outline">{statusLabel(task.status)}</Badge></TableCell>
            <TableCell>{priorityLabel(task.priority)}</TableCell>
            <TableCell>{profileName(profiles, task.assigned_to)}</TableCell>
            <TableCell>
              {task.project_id ? <Link className="text-primary hover:underline" href={`/os/projects/${task.project_id}`}>{projectName(projects, task.project_id)}</Link> : "-"}
              {task.prospect_id ? <div><Link className="text-xs text-primary hover:underline" href={`/os/prospects/${task.prospect_id}`}>Prospect vinculado</Link></div> : null}
              {task.client_id ? <div><Link className="text-xs text-primary hover:underline" href={`/os/clients/${task.client_id}`}>Cliente vinculado</Link></div> : null}
            </TableCell>
            <TableCell>{formatDate(task.due_date)}</TableCell>
            <TableCell>
              {task.status !== "completed" ? (
                <form action={completeGeneralTaskAction.bind(null, task.id, task.project_id)}>
                  <Button size="sm" variant="outline" type="submit">Concluir</Button>
                </form>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TasksCenter({
  tasks,
  myTasks,
  groupedMyTasks,
  companies,
  clients,
  profiles,
  projects,
  error
}: {
  tasks: TaskRow[];
  myTasks: TaskRow[];
  groupedMyTasks: { overdue: TaskRow[]; today: TaskRow[]; next7: TaskRow[]; unscheduled: TaskRow[] };
  companies: CompanyRow[];
  clients: ClientRow[];
  profiles: ProfileRow[];
  projects: ProjectRow[];
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
        <p className="text-sm text-muted-foreground">Centro operacional para follow-ups, entregas e proximas acoes.</p>
      </div>

      {error ? <Card><CardHeader><CardTitle>Erro ao carregar tarefas</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}

      <Card>
        <CardHeader>
          <CardTitle>Minhas tarefas</CardTitle>
          <CardDescription>{myTasks.length} tarefa(s) atribuidas a voce</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3"><div className="text-sm font-medium">Atrasadas</div><div className="text-2xl font-semibold">{groupedMyTasks.overdue.length}</div></div>
          <div className="rounded-lg border p-3"><div className="text-sm font-medium">Hoje</div><div className="text-2xl font-semibold">{groupedMyTasks.today.length}</div></div>
          <div className="rounded-lg border p-3"><div className="text-sm font-medium">Proximos 7 dias</div><div className="text-2xl font-semibold">{groupedMyTasks.next7.length}</div></div>
          <div className="rounded-lg border p-3"><div className="text-sm font-medium">Sem data</div><div className="text-2xl font-semibold">{groupedMyTasks.unscheduled.length}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Criar tarefa</CardTitle></CardHeader>
        <CardContent>
          <TaskForm companies={companies} clients={clients} profiles={profiles} projects={projects} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5">
            <Input name="q" placeholder="Buscar por titulo" />
            <select name="status" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluida</option>
              <option value="canceled">Cancelada</option>
            </select>
            <select name="priority" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todas prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            <select name="assigned_to" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos responsaveis</option>
              <option value="me">Minhas tarefas</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>)}
            </select>
            <select name="due" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos prazos</option>
              <option value="overdue">Atrasadas</option>
              <option value="today">Hoje</option>
              <option value="none">Sem data</option>
            </select>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista geral</CardTitle><CardDescription>{tasks.length} registro(s)</CardDescription></CardHeader>
        <CardContent>
          <TaskTable tasks={tasks} profiles={profiles} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
