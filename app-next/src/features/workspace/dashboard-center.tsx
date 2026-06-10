"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BugIcon,
  Building2Icon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ListTodoIcon,
  PlusIcon,
  TargetIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/features/operations/format";
import type {
  ActivityRow,
  ClientRow,
  FileRow,
  PlaybookRow,
  ProfileRow,
  ProjectRow,
  ProspectRow,
  TaskRow,
  TechBugRow,
  TechIncidentRow
} from "./data";

export function DashboardCenter({
  metrics,
  activities,
  myPending,
  bugs,
  incidents,
  recentFiles,
  recentPlaybooks,
  profiles,
  prospects,
  clients,
  projects,
  error
}: {
  metrics: Record<string, number>;
  activities: ActivityRow[];
  myPending: TaskRow[];
  bugs: TechBugRow[];
  incidents: TechIncidentRow[];
  recentFiles: FileRow[];
  recentPlaybooks: PlaybookRow[];
  profiles: ProfileRow[];
  prospects: ProspectRow[];
  clients: ClientRow[];
  projects: ProjectRow[];
  error: string | null;
}) {
  // Active / Critical counts calculated contextually
  const activeProspectsList = prospects.filter(p => !["fechado", "perdido", "archived", "won", "lost"].includes(p.status));
  const activeClientsList = clients.filter(c => c.status === "active");
  const activeProjectsList = projects.filter(p => p.status === "active" || p.status === "planning");
  const openBugsList = bugs.filter(b => b.status !== "fixed" && b.status !== "closed" && b.status !== "wont_fix");
  const criticalBugsList = openBugsList.filter(b => b.severity === "critical");
  const activeIncidentsList = incidents.filter(i => i.status !== "resolved");

  function profileName(id: string | null) {
    const profile = profiles.find((p) => p.id === id);
    return profile?.full_name || profile?.email || "N/A";
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">ALIENXIP OS</h1>
        <p className="text-sm text-muted-foreground">Centro operacional de usabilidade diária e acompanhamento integrado.</p>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-destructive">Aviso operacional</CardTitle>
            <CardDescription className="text-xs text-destructive/80">{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Grid de Métricas Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:border-primary/20 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prospects Ativos</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{activeProspectsList.length}</h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <TargetIcon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-primary/20 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Clientes Ativos</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{activeClientsList.length}</h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Building2Icon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-primary/20 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Projetos Ativos</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{activeProjectsList.length}</h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <BriefcaseIcon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-primary/20 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pendências Totais</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{metrics.openTasks}</h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <ListTodoIcon className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Secundário de Métricas Críticas */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Tarefas Atrasadas</span>
            <div className="text-xl font-bold text-destructive mt-1">{metrics.overdueTasks}</div>
          </div>
          <ClockIcon className="text-destructive size-5" />
        </div>

        <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Bugs Críticos</span>
            <div className="text-xl font-bold text-red-500 mt-1">{criticalBugsList.length}</div>
          </div>
          <BugIcon className="text-red-500 size-5" />
        </div>

        <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Incidentes Ativos</span>
            <div className="text-xl font-bold text-orange-500 mt-1">{activeIncidentsList.length}</div>
          </div>
          <AlertTriangleIcon className="text-orange-500 size-5" />
        </div>
      </div>

      {/* Ações Rápidas */}
      <Card className="bg-card border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white">Ações Rápidas</CardTitle>
          <CardDescription className="text-xs">Atalhos rápidos para criação de novas entidades.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
            <Link href="/os/prospects" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Prospect</span>
            </Link>

            <Link href="/os/clients" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Cliente</span>
            </Link>

            <Link href="/os/projects" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Projeto</span>
            </Link>

            <Link href="/os/tasks" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Tarefa</span>
            </Link>

            <Link href="/os/wiki" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Wiki</span>
            </Link>

            <Link href="/os/playbooks" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Playbook</span>
            </Link>

            <Link href="/os/tech/bugs" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Bug</span>
            </Link>

            <Link href="/os/tech/incidents" className="flex flex-col items-center justify-center rounded-lg border bg-background/50 p-3 text-center transition-all hover:bg-primary/10 hover:border-primary/30 group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-primary mb-1.5" />
              <span className="text-xs font-medium text-white group-hover:text-primary">Incidente</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Corpo principal do Dashboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda: Pendências e Incidências */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Minhas Pendências */}
          <Card className="bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-white">Minhas Pendências</CardTitle>
                <CardDescription className="text-xs">Suas tarefas em aberto nesta semana.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">{myPending.length} aberta(s)</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {myPending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-sm text-muted-foreground">
                  Nenhuma pendência encontrada. Bom trabalho!
                </div>
              ) : null}
              {myPending.map((task) => (
                <Link
                  key={task.id}
                  href={task.project_id ? `/os/projects/${task.project_id}` : "/os/tasks"}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-background/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">{task.title}</span>
                    {task.description ? <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant={task.priority === "urgent" || task.priority === "high" ? "destructive" : "outline"} className="text-[10px] uppercase">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Incidentes Ativos */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">Incidentes Ativos</CardTitle>
              <CardDescription className="text-xs">Problemas críticos sendo investigados ou monitorados.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activeIncidentsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-sm text-muted-foreground">
                  Nenhum incidente ativo registrado. Operação está 100% estável.
                </div>
              ) : null}
              {activeIncidentsList.map((incident) => (
                <Link
                  key={incident.id}
                  href="/os/tech/incidents"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-orange-500/20 bg-orange-950/10 p-3 hover:bg-orange-950/20 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-orange-400">{incident.title}</span>
                    {incident.description ? <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{incident.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/5 text-[10px] uppercase">
                      {incident.status}
                    </Badge>
                    <Badge variant="destructive" className="text-[10px] uppercase">{incident.severity}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Bugs Críticos */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">Bugs Críticos em Aberto</CardTitle>
              <CardDescription className="text-xs">Falhas técnicas com severidade crítica necessitando atenção imediata.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {criticalBugsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-sm text-muted-foreground">
                  Nenhum bug crítico em aberto. Qualidade do produto mantida!
                </div>
              ) : null}
              {criticalBugsList.map((bug) => (
                <Link
                  key={bug.id}
                  href="/os/tech/bugs"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-red-950/10 p-3 hover:bg-red-950/20 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-red-400">{bug.title}</span>
                    {bug.description ? <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{bug.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Dev: {profileName(bug.assigned_to)}</span>
                    <Badge variant="destructive" className="text-[10px] uppercase">{bug.priority}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Atividades, Arquivos e Playbooks */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Atividades Recentes */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">Linha do Tempo Recente</CardTitle>
              <CardDescription className="text-xs">Últimas atualizações no ecossistema.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
              ) : null}
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="relative pl-4 border-l border-white/10 flex flex-col gap-0.5">
                  <div className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary" />
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-white">{profileName(activity.actor_id)}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(activity.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.title} — {activity.description || activity.action}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Arquivos Recentes */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">Arquivos Recentes</CardTitle>
              <CardDescription className="text-xs">Últimos uploads feitos no workspace.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentFiles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-sm text-muted-foreground">
                  Nenhum arquivo recente.
                </div>
              ) : null}
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="size-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white line-clamp-1">{file.file_name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{file.entity_type}</span>
                    </div>
                  </div>
                  <Link href="/os/files" className="text-muted-foreground hover:text-white transition-colors">
                    <ExternalLinkIcon className="size-3.5" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Playbooks Recentes */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">Playbooks Recentes</CardTitle>
              <CardDescription className="text-xs">Documentos de processos publicados recentemente.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentPlaybooks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-sm text-muted-foreground">
                  Nenhum playbook recente.
                </div>
              ) : null}
              {recentPlaybooks.map((playbook) => (
                <Link
                  key={playbook.id}
                  href={`/os/playbooks/${playbook.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background/30 p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="size-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white line-clamp-1">{playbook.title}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{playbook.category}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase border-white/10">{playbook.review_status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
