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
import { priorityLabel, statusLabel, getCoreCategoryName } from "@/lib/display-helpers";
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
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">MOTHERXIP</h1>
        </div>
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
        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300 group">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-400 transition-colors">Prospects Ativos</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white font-mono">{activeProspectsList.length}</h3>
            </div>
            <div className="rounded-lg bg-pink-500/10 p-3 text-pink-400 border border-pink-500/20">
              <TargetIcon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300 group">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-400 transition-colors">Clientes Ativos</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white font-mono">{activeClientsList.length}</h3>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
              <Building2Icon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300 group">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-400 transition-colors">Projetos Ativos</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white font-mono">{activeProjectsList.length}</h3>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400 border border-blue-500/20">
              <BriefcaseIcon className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md hover:border-purple-500/25 transition-all duration-300 group">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-400 transition-colors">Pendências Totais</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white font-mono">{metrics.openTasks}</h3>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400 border border-purple-500/20">
              <ListTodoIcon className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Secundário de Métricas Críticas */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-xl border border-destructive/20 bg-[#08080a]/60 p-4 flex items-center justify-between hover:border-destructive/35 transition-colors">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Tarefas Atrasadas</span>
            <div className="text-xl font-bold text-destructive mt-1 font-mono">{metrics.overdueTasks}</div>
          </div>
          <ClockIcon className="text-destructive size-5" />
        </div>

        <div className="rounded-xl border border-red-500/20 bg-[#08080a]/60 p-4 flex items-center justify-between hover:border-red-500/35 transition-colors">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Bugs Críticos</span>
            <div className="text-xl font-bold text-red-500 mt-1 font-mono">{criticalBugsList.length}</div>
          </div>
          <BugIcon className="text-red-500 size-5" />
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-[#08080a]/60 p-4 flex items-center justify-between hover:border-orange-500/35 transition-colors">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Incidentes Ativos</span>
            <div className="text-xl font-bold text-orange-500 mt-1 font-mono">{activeIncidentsList.length}</div>
          </div>
          <AlertTriangleIcon className="text-orange-500 size-5" />
        </div>
      </div>

      {/* Ações Rápidas */}
      <Card className="bg-[#08080a]/40 border-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Ações Rápidas</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Atalhos para criação rápida no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
            <Link href="/os/prospects" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Prospect</span>
            </Link>

            <Link href="/os/clients" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Cliente</span>
            </Link>

            <Link href="/os/projects" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Projeto</span>
            </Link>

            <Link href="/os/tasks" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Tarefa</span>
            </Link>

            <Link href="/os/wiki" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Wiki</span>
            </Link>

            <Link href="/os/playbooks" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Playbook</span>
            </Link>

            <Link href="/os/tech/bugs" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Bug</span>
            </Link>

            <Link href="/os/tech/incidents" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Incidente</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Corpo principal do Dashboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda: Pendências e Incidências */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Minhas Pendências */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Minhas Pendências</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Suas tarefas em aberto no workspace.</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40">{myPending.length} aberta(s)</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {myPending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-8 text-center text-xs text-muted-foreground">
                  Nenhuma pendência operacional ativa.
                </div>
              ) : null}
              {myPending.map((task) => (
                <Link
                  key={task.id}
                  href={task.project_id ? `/os/projects/${task.project_id}` : "/os/tasks"}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/5 bg-background/20 p-3.5 transition-all hover:bg-purple-950/10 hover:border-purple-500/20"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">{task.title}</span>
                    {task.description ? <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">{task.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0.5",
                        task.priority === "urgent" || task.priority === "high"
                          ? "bg-red-950/40 text-red-400 border-red-800/40"
                          : "bg-[#0c0c0e] text-zinc-400 border-white/5"
                      )}
                    >
                      {priorityLabel(task.priority)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{formatDate(task.due_date)}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Incidentes Ativos */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Incidentes Ativos</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Instabilidades críticas ou postmortems sob auditoria.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activeIncidentsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-8 text-center text-xs text-muted-foreground">
                  Nenhum incidente ativo sob monitoramento.
                </div>
              ) : null}
              {activeIncidentsList.map((incident) => (
                <Link
                  key={incident.id}
                  href="/os/tech/incidents"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-orange-500/25 bg-orange-950/10 p-3.5 hover:bg-orange-950/20 transition-all duration-200"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-orange-400">{incident.title}</span>
                    {incident.description ? <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">{incident.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/5 text-[9px] font-bold uppercase">
                      {statusLabel(incident.status)}
                    </Badge>
                    <Badge variant="destructive" className="bg-red-950 text-red-400 border-red-800/40 text-[9px] font-bold uppercase">{priorityLabel(incident.severity)}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Bugs Críticos */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Bugs Críticos em Aberto</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Falhas de produto com prioridade ou severidade crítica.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {criticalBugsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-8 text-center text-xs text-muted-foreground">
                  Sem bugs críticos pendentes.
                </div>
              ) : null}
              {criticalBugsList.map((bug) => (
                <Link
                  key={bug.id}
                  href="/os/tech/bugs"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-red-500/25 bg-red-950/10 p-3.5 hover:bg-red-950/20 transition-all duration-200"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-red-400">{bug.title}</span>
                    {bug.description ? <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">{bug.description}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">Dev: {profileName(bug.assigned_to)}</span>
                    <Badge variant="destructive" className="bg-red-950 text-red-400 border-red-800/40 text-[9px] font-bold uppercase">{priorityLabel(bug.priority)}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Atividades, Arquivos e Playbooks */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Atividades Recentes */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Histórico de Atividades</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Log de transações operacionais do time.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>
              ) : null}
              {activities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="relative pl-4 border-l border-purple-500/30 flex flex-col gap-0.5">
                  <div className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-semibold text-white">{profileName(activity.actor_id)}</span>
                    <span className="text-muted-foreground font-mono">{new Date(activity.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 leading-normal">
                    {activity.title} &bull; <span className="text-[10px] text-zinc-500">{activity.description || activity.action}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Arquivos Recentes */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Arquivos Recentes</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Documentos anexados recentemente.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentFiles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-8 text-center text-xs text-muted-foreground">
                  Sem mídias recentes.
                </div>
              ) : null}
              {recentFiles.slice(0, 4).map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-background/20 p-3 hover:border-purple-500/20 transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[#0e0e12] border border-white/5 text-purple-400">
                      <FileTextIcon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-white line-clamp-1 leading-normal">{file.file_name}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-mono">{file.entity_type}</span>
                    </div>
                  </div>
                  <Link href="/os/files" className="text-muted-foreground hover:text-white p-1 hover:bg-white/5 rounded transition-all">
                    <ExternalLinkIcon className="size-3.5" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Playbooks Recentes */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Playbooks Recentes</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Roteiros operacionais recém-publicados.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentPlaybooks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-8 text-center text-xs text-muted-foreground">
                  Sem playbooks recentes.
                </div>
              ) : null}
              {recentPlaybooks.slice(0, 4).map((playbook) => (
                <Link
                  key={playbook.id}
                  href={`/os/playbooks/${playbook.id}`}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-background/20 p-3 hover:bg-purple-950/10 hover:border-purple-500/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[#0e0e12] border border-white/5 text-purple-400">
                      <BookOpenIcon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-white line-clamp-1 leading-normal group-hover:text-purple-300 transition-colors">{playbook.title}</span>
                      <span className="text-[9px] text-purple-400 uppercase font-mono">{getCoreCategoryName(playbook.category)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono border-white/5 bg-[#0a0a0c] text-zinc-400 group-hover:border-purple-500/30 group-hover:text-purple-300 transition-all">
                    {statusLabel(playbook.review_status)}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
