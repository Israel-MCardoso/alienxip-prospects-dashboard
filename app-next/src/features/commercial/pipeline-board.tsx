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
import { EmptyState } from "@/components/ui/empty-state";

// PT-BR Mappings for Column Headers
const columnMeta: Record<string, { label: string; colorClass: string; glowClass: string; dotClass: string }> = {
  new: {
    label: "Novo Lead",
    colorClass: "border-t-2 border-t-zinc-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(161,161,170,0.05)]",
    dotClass: "bg-zinc-400"
  },
  qualified: {
    label: "Qualificação",
    colorClass: "border-t-2 border-t-pink-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(236,72,153,0.05)]",
    dotClass: "bg-pink-400"
  },
  diagnostico: {
    label: "Diagnóstico",
    colorClass: "border-t-2 border-t-blue-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(59,130,246,0.05)]",
    dotClass: "bg-blue-400"
  },
  contato_inicial: {
    label: "Primeiro Contato",
    colorClass: "border-t-2 border-t-indigo-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(99,102,241,0.05)]",
    dotClass: "bg-indigo-400"
  },
  meeting_scheduled: {
    label: "Reunião Agendada",
    colorClass: "border-t-2 border-t-teal-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(20,184,166,0.05)]",
    dotClass: "bg-teal-400"
  },
  proposta: {
    label: "Proposta Enviada",
    colorClass: "border-t-2 border-t-purple-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(168,85,247,0.05)]",
    dotClass: "bg-purple-400"
  },
  negociacao: {
    label: "Negociação",
    colorClass: "border-t-2 border-t-amber-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(245,158,11,0.05)]",
    dotClass: "bg-amber-400"
  },
  fechado: {
    label: "Fechado Ganho",
    colorClass: "border-t-2 border-t-emerald-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.05)]",
    dotClass: "bg-emerald-400"
  },
  perdido: {
    label: "Fechado Perdido",
    colorClass: "border-t-2 border-t-red-500/40 bg-[#08080a]/60",
    glowClass: "shadow-[0_0_15px_rgba(239,68,68,0.05)]",
    dotClass: "bg-red-400"
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
  const boardPotential = localProspects.reduce((sum, prospect) => sum + getProspectPotentialValue(prospect), 0);
  const hotProspects = localProspects.filter((prospect) => prospect.temperature === "hot").length;
  const scheduledMeetings = localProspects.filter((prospect) => prospect.status === "meeting_scheduled").length;

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
      <div className="rounded-2xl border border-white/5 bg-[#08080a]/55 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.75)]" />
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">DEAL BOARD</h1>
          <span className="rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-purple-200">
            {localProspects.length} oportunidades
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste e solte os leads entre as etapas para atualizar o status e acompanhar o valor em negociação.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-purple-500/15 bg-purple-950/10 px-4 py-3">
          <span className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500">Potencial total</span>
          <strong className="mt-1 block font-mono text-xl text-purple-200">{formatCurrency(boardPotential)}</strong>
        </div>
        <div className="rounded-xl border border-rose-500/15 bg-rose-950/10 px-4 py-3">
          <span className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500">Oportunidades hot</span>
          <strong className="mt-1 block font-mono text-xl text-rose-200">{hotProspects}</strong>
        </div>
        <div className="rounded-xl border border-teal-500/15 bg-teal-950/10 px-4 py-3">
          <span className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500">Reunioes agendadas</span>
          <strong className="mt-1 block font-mono text-xl text-teal-200">{scheduledMeetings}</strong>
        </div>
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

          const hasDot = "dotClass" in meta;
          return (
            <Card
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setActiveOverColumn(null)}
              onDrop={(e) => handleDrop(e, status)}
              className={cn(
                "min-w-[300px] w-[300px] shrink-0 bg-[#08080a]/70 border-white/5 backdrop-blur-md flex flex-col justify-between overflow-hidden transition-all duration-300",
                meta.colorClass,
                activeOverColumn === status ? "border-purple-500/45 bg-purple-950/15 scale-[1.015] shadow-xl shadow-purple-950/20 ring-1 ring-purple-500/20" : "",
                meta.glowClass
              )}
            >
              <CardHeader className="pb-3 border-b border-white/5 bg-zinc-950/35">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {hasDot && <span className={cn("size-1.5 rounded-full shrink-0", meta.dotClass)} />}
                    <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider truncate">
                      {meta.label}
                    </CardTitle>
                  </div>
                  <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-zinc-300">
                    {list.length}
                  </span>
                </div>
                <div className="mt-3 rounded-lg border border-white/5 bg-black/20 px-2.5 py-2">
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500">Potencial</span>
                  <span className="text-sm font-bold text-purple-200 font-mono">{formatCurrency(totalPotential)}</span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 pt-4 flex-1 overflow-y-auto min-h-[450px] max-h-[640px] scrollbar-none bg-zinc-950/10">
                {list.length === 0 ? (
                  <EmptyState
                    title="Etapa vazia"
                    description="Solte oportunidades aqui"
                    className={cn(
                      "my-auto border-dashed border-white/10 bg-transparent p-4",
                      activeOverColumn === status && "border-purple-500/30 bg-purple-950/10 text-purple-200"
                    )}
                  />
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
                            "group cursor-grab active:cursor-grabbing flex flex-col justify-between rounded-xl border border-white/5 bg-[#0b0b0e] p-3.5 shadow-sm hover:bg-purple-950/10 hover:border-purple-500/25 hover:shadow-md hover:shadow-purple-950/10 transition-all duration-300",
                            draggedId === prospect.id ? "opacity-30 border-purple-500/25 ring-1 ring-purple-500/20" : ""
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
                              <span className="text-[10px] text-purple-300 font-bold font-mono whitespace-nowrap bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-800/20">
                                {formatCurrency(potentialVal)}
                              </span>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase font-mono bg-purple-950/20 text-purple-200 border-purple-500/20">
                                Oportunidade
                              </span>
                              <span
                                className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase font-mono shadow-sm",
                                  isHot
                                    ? "bg-rose-950/30 text-rose-300 border-rose-500/20 shadow-rose-950/10"
                                    : isWarm
                                    ? "bg-amber-950/30 text-amber-300 border-amber-500/20 shadow-amber-950/10"
                                    : "bg-blue-950/30 text-blue-300 border-blue-500/20 shadow-blue-950/10"
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

                            <div className="mt-2 grid gap-1 text-[9px] text-muted-foreground/70 font-mono uppercase tracking-wider">
                              <span className="truncate">{[prospect.city, prospect.state].filter(Boolean).join(" / ") || "Sem localizacao"}</span>
                              <span className="truncate">{prospect.responsible_user_id || prospect.owner_id ? "Responsavel definido" : "Sem responsavel"}</span>
                            </div>
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
