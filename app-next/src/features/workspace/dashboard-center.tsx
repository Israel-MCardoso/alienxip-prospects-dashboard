"use client";

import Link from "next/link";
import {
  BriefcaseIcon,
  FileTextIcon,
  PlusIcon,
  TargetIcon,
  Building2Icon,
  TrendingUpIcon,
  CalendarDaysIcon,
  SparklesIcon,
  DollarSignIcon,
  AwardIcon,
  UsersIcon,
  CheckCircle2Icon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/features/operations/format";
import { priorityLabel, roleLabel, formatCurrency } from "@/lib/display-helpers";
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
import { getProspectPotentialValue } from "../commercial/commercial-helpers";

export function DashboardCenter({
  activities,
  myPending,
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
  // 1. Calculations for Commercial KPIs
  const totalProspectsCount = prospects.length;
  const hotLeadsCount = prospects.filter((p) => p.temperature === "hot").length;
  const meetingsScheduledCount = prospects.filter((p) => p.status === "meeting_scheduled").length;
  const proposalsSentCount = prospects.filter((p) => p.status === "proposta" || p.status === "proposal_sent").length;
  const activeClientsCount = clients.filter((c) => c.status === "active").length;
  const activeProjectsCount = projects.filter((p) => p.status === "active" || p.status === "planning").length;

  // 2. Calculations for Pipeline Values
  const negotiationValue = prospects
    .filter((p) => p.status === "negociacao")
    .reduce((sum, p) => sum + getProspectPotentialValue(p), 0);
  
  const closedValue = prospects
    .filter((p) => p.status === "fechado" || p.status === "won")
    .reduce((sum, p) => sum + getProspectPotentialValue(p), 0);

  const wonProspects = prospects.filter((p) => p.status === "fechado" || p.status === "won");
  const averageTicket = wonProspects.length > 0 
    ? Math.round(closedValue / wonProspects.length) 
    : 1800; // default average ticket

  // 3. Follow-up and Tasks Filters
  const todayStr = new Date().toISOString().split("T")[0];
  const myOpenTasks = myPending.filter((t) => t.status !== "completed" && t.status !== "canceled");
  
  // Overdue follow-ups
  const overdueFollowups = myOpenTasks.filter(
    (t) => t.due_date && t.due_date < todayStr
  );

  // Today follow-ups
  const todayFollowups = myOpenTasks.filter(
    (t) => t.due_date === todayStr
  );

  // Meetings (tasks related to meetings or prospects in meeting scheduled stage)
  const scheduledMeetings = prospects
    .filter((p) => p.status === "meeting_scheduled")
    .slice(0, 5);

  function profileName(id: string | null) {
    const profile = profiles.find((p) => p.id === id);
    return profile?.full_name || profile?.email || "Membro";
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Executive Command Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono bg-gradient-to-r dark:from-white dark:via-purple-100 dark:to-purple-400 from-slate-900 via-purple-800 to-purple-600 bg-clip-text text-transparent uppercase tracking-wider">CENTRO DE COMANDO</h1>
        </div>
        <p className="text-sm text-muted-foreground">Visão operacional executiva de receita, funil comercial e produtividade integrada.</p>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-destructive">Aviso operacional</CardTitle>
            <CardDescription className="text-xs text-destructive/80">{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Grid de KPIs de Captação e Conversão */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Total Prospects", value: totalProspectsCount, icon: TargetIcon },
          { label: "Leads Quentes", value: hotLeadsCount, icon: SparklesIcon },
          { label: "Reuniões", value: meetingsScheduledCount, icon: CalendarDaysIcon },
          { label: "Propostas Enviadas", value: proposalsSentCount, icon: FileTextIcon },
          { label: "Clientes Ativos", value: activeClientsCount, icon: Building2Icon },
          { label: "Projetos Ativos", value: activeProjectsCount, icon: BriefcaseIcon }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="bg-card/45 border-border/60 hover:border-primary/25 hover:bg-card/65 transition-all duration-200 group shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-22">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono truncate">
                    {kpi.label}
                  </span>
                  <Icon className="size-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono mt-1">{kpi.value}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grid de Valor Comercial (Pipeline Value) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Valor em Negociação", value: formatCurrency(negotiationValue), desc: "Soma de potenciais em estágio final", icon: DollarSignIcon },
          { label: "Receita Fechada (Won)", value: formatCurrency(closedValue), desc: "Contratos e conversões concluídas", icon: CheckCircle2Icon },
          { label: "Ticket Médio", value: formatCurrency(averageTicket), desc: "Valor médio estimado por conversão", icon: TrendingUpIcon }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border border-border/65 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:bg-card/75 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">{card.label}</CardTitle>
                  <Icon className="size-4 text-muted-foreground/60" />
                </div>
                <CardDescription className="text-[10px] text-muted-foreground/70 mt-0.5">{card.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-extrabold font-mono text-foreground tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ações Rápidas */}
      <Card className="bg-[#08080a]/40 border-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Centro de Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
            <Link href="/os/prospects" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Novo Lead</span>
            </Link>

            <Link href="/os/prospects/pipeline" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Pipeline</span>
            </Link>

            <Link href="/os/clients" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Cliente</span>
            </Link>

            <Link href="/os/projects" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-background/30 p-3 text-center transition-all hover:bg-purple-950/20 hover:border-purple-500/35 hover:translate-y-[-1px] group">
              <PlusIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mb-1.5 transition-colors" />
              <span className="text-[10px] font-semibold text-white group-hover:text-purple-300 transition-colors">Projeto</span>
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
        {/* Coluna Esquerda: Follow-ups e Reuniões */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Alertas de Tarefas e Ações */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Ações Comerciais Agendadas</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Follow-ups pendentes, atrasados ou para hoje.</CardDescription>
              </div>
              <div className="flex gap-1.5">
                <Badge variant="destructive" className="text-[9px] font-mono font-bold bg-red-950/40 text-red-400 border border-red-800/40">{overdueFollowups.length} atrasados</Badge>
                <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-800/40">{todayFollowups.length} hoje</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {myOpenTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  Nenhuma pendência operacional ativa.
                </div>
              ) : null}
              {myOpenTasks.slice(0, 6).map((task) => {
                const isOverdue = task.due_date && task.due_date < todayStr;
                const isToday = task.due_date === todayStr;

                return (
                  <Link
                    key={task.id}
                    href={task.prospect_id ? `/os/prospects/${task.prospect_id}` : "/os/tasks"}
                    className={cn(
                      "group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3.5 transition-all shadow-sm",
                      isOverdue 
                        ? "dark:border-red-500/20 dark:bg-red-950/5 border-red-200 bg-red-50/50 hover:bg-red-100/50 dark:hover:bg-red-950/10 hover:border-red-500/35" 
                        : isToday
                        ? "dark:border-amber-500/20 dark:bg-amber-950/5 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 dark:hover:bg-amber-950/10 hover:border-amber-500/35"
                        : "border-border dark:border-white/5 bg-card/50 dark:bg-background/20 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 hover:border-purple-500/20"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{task.title}</span>
                      {task.description ? <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">{task.description}</span> : null}
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] font-mono font-bold uppercase px-1.5 py-0.5",
                          task.priority === "urgent" || task.priority === "high"
                            ? "bg-red-950/40 text-red-400 border-red-800/40"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {priorityLabel(task.priority)}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground font-mono">{formatDate(task.due_date)}</span>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Próximas Reuniões */}
          <Card className="bg-card/60 border-border backdrop-blur-md shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">Próximas Reuniões Comerciais</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Leads com reuniões agendadas no funil.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {scheduledMeetings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  Nenhuma reunião agendada na agenda ativa.
                </div>
              ) : null}
              {scheduledMeetings.map((p) => (
                <Link
                  key={p.id}
                  href={`/os/prospects/${p.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border dark:border-teal-500/25 border-teal-200 dark:bg-teal-950/5 bg-teal-50/50 p-3.5 hover:bg-teal-100/50 dark:hover:bg-teal-950/15 hover:border-teal-500/40 transition-all duration-200 shadow-sm"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-300 truncate max-w-[200px]">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground/80 truncate">Segmento: {p.segment || "Geral"} &bull; {p.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/5 text-[8px] font-bold uppercase font-mono py-0 h-5">
                      Agendado
                    </Badge>
                    <span className="text-[10px] text-teal-600 dark:text-teal-300 font-bold font-mono">{formatCurrency(getProspectPotentialValue(p))}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Atividades, Ranking e Conhecimento */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Ranking Comercial (Leaderboard) */}
          <Card className="bg-card/60 border-border backdrop-blur-md shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-2 border-b border-border">
              <AwardIcon className="size-4 text-primary" />
              <div>
                <CardTitle className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">Desempenho Comercial</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              {/* Sellers ranking */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold font-mono text-muted-foreground uppercase">Ranking de Vendedores</span>
                  <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/20 rounded px-1 py-0.5 leading-none">Dados de demonstração</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  {[
                    { name: "Israel M. Cardoso", role: "owner", count: 24, val: 56000 },
                    { name: "Gabriel S. Santos", role: "admin", count: 18, val: 38000 },
                    { name: "Clara M. Oliveira", role: "manager", count: 12, val: 24000 }
                  ].map((seller, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-slate-50/50 dark:bg-zinc-950/20 p-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono text-primary dark:text-purple-400">#{idx + 1}</span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground leading-none">{seller.name}</span>
                          <span className="text-[8px] text-muted-foreground mt-1 uppercase font-mono">{roleLabel(seller.role)}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-0.5 font-mono">
                        <span className="font-bold text-foreground text-[10px]">{formatCurrency(seller.val)}</span>
                        <span className="text-[8px] text-muted-foreground">{seller.count} conversões</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teams productivity */}
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <span className="text-[9px] font-bold font-mono text-muted-foreground uppercase">Equipe Produtiva</span>
                <div className="flex flex-col gap-1.5 text-xs">
                  {[
                    { team: "Comercial São Paulo", members: 4, score: 92 },
                    { team: "Comercial Vale do Paraíba", members: 3, score: 85 }
                  ].map((team, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-slate-50/50 dark:bg-zinc-950/20 p-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="size-3.5 text-primary dark:text-purple-400 shrink-0" />
                        <span className="font-semibold text-foreground">{team.team}</span>
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary dark:text-purple-300 text-[8px] font-mono">
                        Produtividade: {team.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Atividades Recentes */}
          <Card className="bg-card/60 border-border backdrop-blur-md shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">Histórico de Atividades</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Log das últimas interações operacionais.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>
              ) : null}
              {activities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="relative pl-4 border-l border-purple-500/30 flex flex-col gap-0.5">
                  <div className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-semibold text-foreground">{profileName(activity.actor_id)}</span>
                    <span className="text-muted-foreground font-mono">{new Date(activity.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 leading-normal">
                    {activity.title} &bull; <span className="text-[10px] text-zinc-500">{activity.description || activity.action}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
