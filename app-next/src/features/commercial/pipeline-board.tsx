import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupProspectsByPipelineStatus, pipelineStatuses } from "./commercial-helpers";
import type { CommercialTaskRow } from "./data";
import type { ProspectRow } from "@/features/prospects/data";

const labels: Record<string, string> = {
  frio: "Frio",
  contato_inicial: "Contato inicial",
  diagnostico: "Diagnostico",
  proposta: "Proposta",
  negociacao: "Negociacao",
  fechado: "Fechado",
  perdido: "Perdido"
};

export function PipelineBoard({
  prospects,
  tasks,
  error
}: {
  prospects: ProspectRow[];
  tasks: CommercialTaskRow[];
  error: string | null;
}) {
  const grouped = groupProspectsByPipelineStatus(prospects);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline Comercial</h1>
        <p className="text-sm text-muted-foreground">Kanban visual sem drag-and-drop para acompanhar a etapa comercial dos prospects.</p>
      </div>
      {error ? <Card><CardHeader><CardTitle>Conexao pendente</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <div className="grid gap-4 xl:grid-cols-7">
        {pipelineStatuses.map((status) => (
          <Card key={status} className="min-h-64">
            <CardHeader>
              <CardTitle className="text-sm">{labels[status]}</CardTitle>
              <CardDescription>{grouped[status].length} prospect(s)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {grouped[status].length === 0 ? <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">Sem prospects nesta etapa.</div> : null}
              {grouped[status].map((prospect: ProspectRow) => {
                const nextTask = tasks.find((task) => task.prospect_id === prospect.id);
                return (
                  <Link key={prospect.id} href={`/os/prospects/${prospect.id}`} className="rounded-lg border bg-background p-3 text-sm transition-colors hover:bg-muted/50">
                    <div className="font-medium">{prospect.name}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant={prospect.temperature === "hot" ? "destructive" : "outline"}>{prospect.temperature}</Badge>
                      <Badge variant="secondary">{prospect.responsible_user_id || "sem responsavel"}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {nextTask ? `Proxima: ${nextTask.title}${nextTask.due_date ? ` (${nextTask.due_date})` : ""}` : "Sem follow-up pendente"}
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
