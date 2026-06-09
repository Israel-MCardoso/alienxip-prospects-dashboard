import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityRow, TaskRow } from "./data";
import { formatDate, priorityLabel } from "@/features/operations/format";

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardCenter({
  metrics,
  activities,
  myPending,
  error
}: {
  metrics: Record<string, number>;
  activities: ActivityRow[];
  myPending: TaskRow[];
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Centro operacional para acompanhar pipeline, clientes, projetos, tarefas e atividades.</p>
      </div>

      {error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Prospects ativos" value={metrics.activeProspects} />
        <MetricCard title="Clientes ativos" value={metrics.activeClients} />
        <MetricCard title="Projetos ativos" value={metrics.activeProjects} />
        <MetricCard title="Tarefas abertas" value={metrics.openTasks} />
        <MetricCard title="Tarefas vencidas" value={metrics.overdueTasks} />
        <MetricCard title="Tarefas para hoje" value={metrics.todayTasks} />
        <MetricCard title="Conversoes do mes" value={metrics.monthConversions} />
        <MetricCard title="Projetos concluidos" value={metrics.completedProjects} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
            <CardDescription>Ultimos eventos do workspace unificado</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activities.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p> : null}
            {activities.map((activity) => (
              <Link key={activity.id} href="/os/activity" className="rounded-lg border p-3 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{activity.title}</span>
                  <Badge variant="outline">{activity.entity_type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{activity.description || activity.action}</div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minhas pendencias</CardTitle>
            <CardDescription>{myPending.length} tarefa(s) em aberto</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Minhas abertas</div><div className="text-2xl font-semibold">{metrics.myOpenTasks}</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Minhas vencidas</div><div className="text-2xl font-semibold">{metrics.myOverdueTasks}</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Meus prospects ativos</div><div className="text-2xl font-semibold">{metrics.myActiveProspects}</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Meus projetos ativos</div><div className="text-2xl font-semibold">{metrics.myActiveProjects}</div></div>
            </div>
            {myPending.map((task) => (
              <Link key={task.id} href={task.project_id ? `/os/projects/${task.project_id}` : "/os/tasks"} className="rounded-lg border p-3 hover:bg-muted/50">
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-muted-foreground">{priorityLabel(task.priority)} | prazo {formatDate(task.due_date)}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
