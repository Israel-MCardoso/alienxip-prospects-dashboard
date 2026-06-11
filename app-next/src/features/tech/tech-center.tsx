"use client";

import Link from "next/link";
import {
  BugIcon,
  AlertTriangleIcon,
  ListTodoIcon,
  MapIcon,
  FileTextIcon,
  CloudLightningIcon,
  ChevronRightIcon
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TechBacklogRow, TechBugRow, TechIncidentRow, TechRoadmapRow, TechnicalDecisionRow } from "./data";
import { cn } from "@/lib/utils";

const modules = [
  { title: "Bugs", href: "/os/tech/bugs", description: "Falhas, regressões e problemas funcionais do sistema.", icon: BugIcon, color: "text-red-400 border-red-500/20 bg-red-500/10" },
  { title: "Incidentes", href: "/os/tech/incidents", description: "Eventos operacionais críticos e instabilidades.", icon: AlertTriangleIcon, color: "text-orange-400 border-orange-500/20 bg-orange-500/10" },
  { title: "Backlog Técnico", href: "/os/tech/backlog", description: "Dívida técnica, refatorações, infra e segurança.", icon: ListTodoIcon, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
  { title: "Roadmap", href: "/os/tech/roadmap", description: "Planejamento estratégico e evolução de engenharia.", icon: MapIcon, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
  { title: "Decisões Técnicas", href: "/os/tech/decisions", description: "Registro de Arquitetura e ADRs internos.", icon: FileTextIcon, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
  { title: "Deployments", href: "/os/tech", description: "Status de integração de builds e pipeline de deploy.", icon: CloudLightningIcon, color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10" }
];

export function TechCenter({
  bugs,
  incidents,
  backlog,
  roadmap,
  decisions,
  error
}: {
  bugs: TechBugRow[];
  incidents: TechIncidentRow[];
  backlog: TechBacklogRow[];
  roadmap: TechRoadmapRow[];
  decisions: TechnicalDecisionRow[];
  error: string | null;
}) {
  const openBugs = bugs.filter((item) => !["fixed", "closed", "wont_fix"].includes(item.status)).length;
  const activeIncidents = incidents.filter((item) => item.status !== "resolved").length;
  const openBacklog = backlog.filter((item) => item.status !== "done").length;
  const activeRoadmap = roadmap.filter((item) => !["shipped", "canceled"].includes(item.status)).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">TECH CENTER</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Centro operacional para confiabilidade de produto, governança técnica e decisões arquiteturais.
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

      {/* Grid de Métricas Rápidas */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Bugs Abertos</span>
            <span className={cn("text-2xl font-bold font-mono mt-1", openBugs > 0 ? "text-red-400" : "text-white")}>
              {openBugs}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Incidentes Ativos</span>
            <span className={cn("text-2xl font-bold font-mono mt-1", activeIncidents > 0 ? "text-orange-400 animate-pulse" : "text-white")}>
              {activeIncidents}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Backlog Aberto</span>
            <span className="text-2xl font-bold font-mono mt-1 text-blue-400">
              {openBacklog}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Roadmap Ativo</span>
            <span className="text-2xl font-bold font-mono mt-1 text-purple-400">
              {activeRoadmap}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Decisões ADR</span>
            <span className="text-2xl font-bold font-mono mt-1 text-emerald-400">
              {decisions.length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Seções / Módulos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const ModuleIcon = module.icon;
          return (
            <Link
              key={module.title}
              href={module.href}
              className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#08080a]/40 p-5 hover:bg-purple-950/10 hover:border-purple-500/25 hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 size-32 bg-purple-600/5 blur-2xl pointer-events-none rounded-full" />
              <div>
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg border", module.color)}>
                    <ModuleIcon className="size-4.5" />
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-purple-300 transition-colors group-hover:translate-x-0.5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 mt-4 transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {module.description}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-semibold text-purple-400">
                <span>Gerenciar Módulo</span>
                <span>Acessar &rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
