"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupProspectsByPipelineStatus, pipelineStatuses, getProspectPotentialValue } from "./commercial-helpers";
import type { CommercialTaskRow } from "./data";
import type { ProspectRow } from "@/features/prospects/data";
import { temperatureLabel } from "@/lib/display-helpers";
import { cn } from "@/lib/utils";
import { updateProspectStatusAction } from "@/features/prospects/actions";

// PT-BR Mappings for Column Headers
const columnMeta: Record<string, { label: string; colorClass: string; glowClass: string }> = {
  new: {
    label: "Novo Lead",
    colorClass: "border-t-2 border-t-zinc-400 bg-zinc-500/5",
    glowClass: "group-hover:border-zinc-500/30"
  },
  qualified: {
    label: "Qualificação",
    colorClass: "border-t-2 border-t-pink-500 bg-pink-500/5",
    glowClass: "group-hover:border-pink-500/30"
  },
  diagnostico: {
    label: "Diagnóstico",
    colorClass: "border-t-2 border-t-blue-500 bg-blue-500/5",
    glowClass: "group-hover:border-blue-500/30"
  },
  contato_inicial: {
    label: "Primeiro Contato",
    colorClass: "border-t-2 border-t-indigo-500 bg-indigo-500/5",
    glowClass: "group-hover:border-indigo-500/30"
  },
  meeting_scheduled: {
    label: "Reunião Agendada",
    colorClass: "border-t-2 border-t-teal-500 bg-teal-500/5",
    glowClass: "group-hover:border-teal-500/30"
  },
  proposta: {
    label: "Proposta Enviada",
    colorClass: "border-t-2 border-t-purple-500 bg-purple-500/5",
    glowClass: "group-hover:border-purple-500/30"
  },
  negociacao: {
    label: "Negociação",
    colorClass: "border-t-2 border-t-amber-500 bg-amber-500/5",
    glowClass: "group-hover:border-amber-500/30"
  },
  fechado: {
    label: "Fechado Ganho",
    colorClass: "border-t-2 border-t-emerald-500 bg-emerald-500/5",
    glowClass: "group-hover:border-emerald-500/30"
  },
  perdido: {
    label: "Fechado Perdido",
    colorClass: "border-t-2 border-t-red-500 bg-red-500/5",
    glowClass: "group-hover:border-red-500/30"
  }
};

export function PipelineBoard({
  prospects,
  tasks,
  error: initialError
}: {
  prospects: ProspectRow[];
  tasks: CommercialTaskRow[];
  error: string | null;
}) {
  const [localProspects, setLocalProspects] = useState<ProspectRow[]>(prospects);
  const [error, setError] = useState<string | null>(initialError);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeOverColumn, setActiveOverColumn] = useState<string | null>(null);

  const grouped = groupProspectsByPipelineStatus(localProspects);

  // Formatter for currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setActiveOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    if (activeOverColumn !== column) {
      setActiveOverColumn(column);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    setDraggedId(null);
    setActiveOverColumn(null);

    if (!id) return;

    const prospect = localProspects.find((p) => p.id === id);
    if (!prospect || prospect.status === targetStatus) return;

    const oldStatus = prospect.status;

    // Optimistic Update
    setLocalProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: targetStatus as ProspectRow["status"] } : p))
    );

    try {
      setError(null);
      await updateProspectStatusAction(id, targetStatus);
    } catch (err) {
      // Rollback
      setLocalProspects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: oldStatus } : p))
      );
      setError(err instanceof Error ? err.message : "Erro ao mover lead no funil.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">FUNIL DE VENDAS</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste e solte os leads entre as etapas para atualizar o status e acompanhar o valor em negociação.
        </p>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-red-400 font-mono">Erro Operacional</CardTitle>
            <CardDescription className="text-xs text-red-500">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Kanban Board Layout */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
        {pipelineStatuses.map((status) => {
          const meta = columnMeta[status] || {
            label: status,
            colorClass: "border-t-2 border-t-zinc-700 bg-zinc-700/5",
            glowClass: ""
          };
          const list = grouped[status] || [];

          // Calculate potential values sum
          const totalPotential = list.reduce(
            (sum, p) => sum + getProspectPotentialValue(p),
            0
          );

          const isOver = activeOverColumn === status;

          return (
            <Card
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
              className={cn(
                "min-w-[290px] w-[290px] shrink-0 bg-[#08080a]/60 border-white/5 backdrop-blur-md flex flex-col justify-between overflow-hidden transition-all duration-300",
                meta.colorClass,
                isOver ? "border-purple-500/40 bg-purple-950/5 scale-[1.01]" : ""
              )}
            >
              <CardHeader className="pb-3 border-b border-white/5 bg-zinc-950/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    {meta.label}
                  </CardTitle>
                  <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <div className="text-[10px] text-purple-400 font-semibold font-mono mt-1">
                  Val: {formatCurrency(totalPotential)}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 pt-4 flex-1 overflow-y-auto min-h-[450px] max-h-[600px] scrollbar-none bg-zinc-950/10">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/5 p-8 text-center text-[10px] text-muted-foreground italic my-auto">
                    Sem leads nesta etapa
                  </div>
                ) : null}

                <AnimatePresence initial={false}>
                  {list.map((prospect: ProspectRow) => {
                    const nextTask = tasks.find((task) => task.prospect_id === prospect.id);
                    const isHot = prospect.temperature === "hot";
                    const isWarm = prospect.temperature === "warm";
                    const potentialVal = getProspectPotentialValue(prospect);

                    return (
                      <div
                        key={prospect.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, prospect.id)}
                        onDragEnd={handleDragEnd}
                        className="w-full"
                      >
                        <motion.div
                          layoutId={prospect.id}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          className={cn(
                            "group cursor-grab active:cursor-grabbing flex flex-col justify-between rounded-xl border border-white/5 bg-[#0a0a0c]/80 p-3.5 hover:bg-purple-950/10 hover:border-purple-500/20 transition-all duration-200",
                            draggedId === prospect.id ? "opacity-40 border-purple-500/10" : ""
                          )}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <Link
                                href={`/os/prospects/${prospect.id}`}
                                className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors leading-snug truncate"
                              >
                                {prospect.name}
                              </Link>
                              <span className="text-[10px] text-purple-300/80 font-semibold font-mono whitespace-nowrap">
                                {formatCurrency(potentialVal)}
                              </span>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-1">
                              <span
                                className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase font-mono",
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
                                <span className="text-[8px] font-mono bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5 text-zinc-400 capitalize max-w-[120px] truncate">
                                  {prospect.segment}
                                </span>
                              )}
                            </div>

                            {prospect.city && (
                              <div className="mt-1.5 text-[9px] text-muted-foreground/60 truncate">
                                📍 {prospect.city}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-2 border-t border-white/5 text-[9px] text-muted-foreground flex flex-col gap-0.5 leading-normal">
                            {nextTask ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-purple-400/80">Próximo:</span>
                                <span className="text-white truncate">{nextTask.title}</span>
                                {nextTask.due_date && (
                                  <span className="text-[8px] text-zinc-500 font-mono mt-0.5">
                                    Prazo: {new Date(nextTask.due_date).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="italic text-zinc-600">Sem follow-up</span>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
