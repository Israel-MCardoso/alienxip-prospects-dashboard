import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskRow } from "./data";
import { formatDate, priorityLabel } from "./format";

function Bucket({ title, description, tasks }: { title: string; description: string; tasks: TaskRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p> : null}
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border p-3">
            <div className="font-medium">{task.title}</div>
            <div className="text-xs text-muted-foreground">{priorityLabel(task.priority)} | {formatDate(task.due_date)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CalendarView({ grouped, error }: { grouped: { overdue: TaskRow[]; today: TaskRow[]; next7: TaskRow[]; unscheduled: TaskRow[] }; error: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendario operacional</h1>
        <p className="text-sm text-muted-foreground">Tarefas organizadas por urgencia de data.</p>
      </div>
      {error ? <Card><CardHeader><CardTitle>Erro ao carregar calendario</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Bucket title="Atrasadas" description={`${grouped.overdue.length} tarefa(s)`} tasks={grouped.overdue} />
        <Bucket title="Hoje" description={`${grouped.today.length} tarefa(s)`} tasks={grouped.today} />
        <Bucket title="Proximos 7 dias" description={`${grouped.next7.length} tarefa(s)`} tasks={grouped.next7} />
        <Bucket title="Sem data" description={`${grouped.unscheduled.length} tarefa(s)`} tasks={grouped.unscheduled} />
      </div>
    </div>
  );
}
