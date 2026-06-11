"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupProspectsByPipelineStatus, pipelineStatuses } from "./commercial-helpers";
import type { CommercialTaskRow } from "./data";
import type { ProspectRow } from "@/features/prospects/data";
import { temperatureLabel } from "@/lib/display-helpers";
import { cn } from "@/lib/utils";

// PT-BR Mappings for Column Headers
const columnMeta: Record<string, { label: string; colorClass: string }> = {
  frio: { label: "Frio", colorClass: "border-t-2 border-t-zinc-500 bg-zinc-500/5" },
  contato_inicial: { label: "Contato Inicial", colorClass: "border-t-2 border-t-indigo-500 bg-indigo-500/5" },
  diagnostico: { label: "Diagnóstico", colorClass: "border-t-2 border-t-blue-500 bg-blue-500/5" },
  proposta: { label: "Proposta", colorClass: "border-t-2 border-t-purple-500 bg-purple-500/5" },
  negociacao: { label: "Negociação", colorClass: "border-t-2 border-t-amber-500 bg-amber-500/5" },
  fechado: { label: "Fechado", colorClass: "border-t-2 border-t-emerald-500 bg-emerald-500/5" },
  perdido: { label: "Perdido", colorClass: "border-t-2 border-t-red-500 bg-red-500/5" }
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">FUNIL DE VENDAS</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhamento visual das etapas comerciais e follow-ups de leads.
        </p>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-red-400 font-mono">Conexão Pendente</CardTitle>
            <CardDescription className="text-xs text-red-500">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Kanban Board Layout */}
      <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
        {pipelineStatuses.map((status) => {
          const meta = columnMeta[status] || { label: status, colorClass: "border-t-2 border-t-zinc-700 bg-zinc-700/5" };
          const list = grouped[status] || [];

          return (
            <Card key={status} className={cn("min-w-[280px] lg:flex-1 bg-[#08080a]/60 border-white/5 backdrop-blur-md flex flex-col justify-between overflow-hidden", meta.colorClass)}>
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">{meta.label}</CardTitle>
                  <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-muted-foreground">
                    {list.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-4 flex-1 overflow-y-auto min-h-[350px] max-h-[550px] scrollbar-none">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/5 p-4 text-center text-[10px] text-muted-foreground italic">
                    Sem leads nesta etapa
                  </div>
                ) : null}
                {list.map((prospect: ProspectRow) => {
                  const nextTask = tasks.find((task) => task.prospect_id === prospect.id);
                  const isHot = prospect.temperature === "hot";
                  const isWarm = prospect.temperature === "warm";

                  return (
                    <Link
                      key={prospect.id}
                      href={`/os/prospects/${prospect.id}`}
                      className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#0a0a0c]/80 p-3.5 hover:bg-purple-950/10 hover:border-purple-500/25 hover:translate-y-[-1px] transition-all duration-200"
                    >
                      <div>
                        <div className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors leading-snug">
                          {prospect.name}
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                              isHot
                                ? "bg-red-950/40 text-red-400 border-red-800/40"
                                : isWarm
                                ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                                : "bg-blue-950/40 text-blue-400 border-blue-800/40"
                            )}
                          >
                            {temperatureLabel(prospect.temperature)}
                          </span>
                          {prospect.segment && (
                            <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-zinc-400 capitalize">
                              {prospect.segment}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-white/5 text-[10px] text-muted-foreground flex flex-col gap-0.5 leading-normal">
                        {nextTask ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-purple-400">Próxima Ação:</span>
                            <span className="text-white line-clamp-1">{nextTask.title}</span>
                            {nextTask.due_date && (
                              <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Prazo: {new Date(nextTask.due_date).toLocaleDateString("pt-BR")}</span>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-zinc-500">Sem follow-up pendente</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
