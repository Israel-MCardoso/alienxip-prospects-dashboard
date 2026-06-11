"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  completeGeneralTaskAction,
  updateGeneralTaskAction,
  duplicateGeneralTaskAction,
  archiveGeneralTaskAction
} from "./actions";
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

function clientName(clients: ClientRow[], companies: CompanyRow[], id: string | null) {
  if (!id) return "-";
  const client = clients.find((item) => item.id === id);
  if (!client) return "-";
  const company = companies.find((item) => item.id === client.company_id);
  const contact = client.main_contact_name;
  const compName = company?.name;
  if (contact && compName) {
    return `${contact} (${compName})`;
  }
  return compName || contact || client.id;
}

function companyName(companies: CompanyRow[], id: string | null) {
  if (!id) return "-";
  return companies.find((item) => item.id === id)?.name || "-";
}

function TaskTable({
  tasks,
  profiles,
  projects,
  clients,
  companies,
  onEdit
}: {
  tasks: TaskRow[];
  profiles: ProfileRow[];
  projects: ProjectRow[];
  clients: ClientRow[];
  companies: CompanyRow[];
  onEdit: (task: TaskRow) => void;
}) {
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsavel</TableHead>
            <TableHead>Projeto / Vinculos</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
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
                {task.project_id ? (
                  <div className="mb-1">
                    <Link className="text-primary hover:underline font-semibold" href={`/os/projects/${task.project_id}`}>
                      Proj: {projectName(projects, task.project_id)}
                    </Link>
                  </div>
                ) : null}
                {task.client_id ? (
                  <div className="mb-1">
                    <Link className="text-xs text-primary hover:underline font-semibold" href={`/os/clients/${task.client_id}`}>
                      Cli: {clientName(clients, companies, task.client_id)}
                    </Link>
                  </div>
                ) : null}
                {task.company_id ? (
                  <div>
                    <Link className="text-xs text-primary hover:underline font-semibold" href={`/os/companies/${task.company_id}`}>
                      Emp: {companyName(companies, task.company_id)}
                    </Link>
                  </div>
                ) : null}
                {!task.project_id && !task.client_id && !task.company_id ? "-" : null}
              </TableCell>
              <TableCell>{formatDate(task.due_date)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {task.status !== "completed" ? (
                    <form action={completeGeneralTaskAction.bind(null, task.id, task.project_id)}>
                      <Button size="sm" variant="outline" type="submit" className="border-purple-500/20 text-purple-400 hover:bg-purple-950/20">
                        Concluir
                      </Button>
                    </form>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
                    Editar
                  </Button>
                  <form action={duplicateGeneralTaskAction.bind(null, task.id)}>
                    <Button size="sm" variant="outline" type="submit">
                      Duplicar
                    </Button>
                  </form>
                  {task.status !== "canceled" ? (
                    <form action={archiveGeneralTaskAction.bind(null, task.id)}>
                      <Button size="sm" variant="outline" type="submit" className="text-red-400 hover:text-red-300 hover:bg-red-950/20 border-red-500/20">
                        Cancelar
                      </Button>
                    </form>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);

  const handleUpdate = async (formData: FormData) => {
    if (!editingTask) return;
    try {
      await updateGeneralTaskAction(editingTask.id, formData);
      setEditingTask(null);
    } catch (err) {
      alert("Erro ao salvar tarefa: " + (err instanceof Error ? err.message : String(err)));
    }
  };

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
          <CardDescription>{myTasks.length} tarefa(s) atribuídas a você</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3 bg-[#0D0D0D]"><div className="text-sm font-medium text-muted-foreground">Atrasadas</div><div className="text-2xl font-semibold text-red-500">{groupedMyTasks.overdue.length}</div></div>
          <div className="rounded-lg border p-3 bg-[#0D0D0D]"><div className="text-sm font-medium text-muted-foreground">Hoje</div><div className="text-2xl font-semibold text-purple-400">{groupedMyTasks.today.length}</div></div>
          <div className="rounded-lg border p-3 bg-[#0D0D0D]"><div className="text-sm font-medium text-muted-foreground">Próximos 7 dias</div><div className="text-2xl font-semibold text-purple-200">{groupedMyTasks.next7.length}</div></div>
          <div className="rounded-lg border p-3 bg-[#0D0D0D]"><div className="text-sm font-medium text-muted-foreground">Sem data</div><div className="text-2xl font-semibold">{groupedMyTasks.unscheduled.length}</div></div>
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
          <TaskTable
            tasks={tasks}
            profiles={profiles}
            projects={projects}
            clients={clients}
            companies={companies}
            onEdit={setEditingTask}
          />
        </CardContent>
      </Card>

      {editingTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Editar Tarefa</h3>
              <p className="text-xs text-muted-foreground">Atualize as informações da tarefa selecionada.</p>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <Input name="title" defaultValue={editingTask.title} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                  <select
                    name="priority"
                    defaultValue={editingTask.priority}
                    className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <select
                    name="status"
                    defaultValue={editingTask.status}
                    className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                    <option value="canceled">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Prazo</label>
                <Input name="due_date" type="date" defaultValue={editingTask.due_date || ""} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Descrição</label>
                <textarea
                  name="description"
                  defaultValue={editingTask.description || ""}
                  placeholder="Descrição da tarefa"
                  className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                  <select
                    name="assigned_to"
                    defaultValue={editingTask.assigned_to || ""}
                    className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm"
                  >
                    <option value="">Nenhum</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                  <select
                    name="project_id"
                    defaultValue={editingTask.project_id || ""}
                    className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm"
                  >
                    <option value="">Sem projeto</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                  <select
                    name="client_id"
                    defaultValue={editingTask.client_id || ""}
                    className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm"
                  >
                    <option value="">Sem cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {clientName(clients, companies, c.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Empresa</label>
                  <select
                    name="company_id"
                    defaultValue={editingTask.company_id || ""}
                    className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm"
                  >
                    <option value="">Sem empresa</option>
                    {companies.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
