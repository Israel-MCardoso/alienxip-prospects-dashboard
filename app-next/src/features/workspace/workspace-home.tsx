"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BriefcaseIcon,
  TerminalIcon,
  PaletteIcon,
  BookOpenIcon,
  SettingsIcon,
  ChevronRightIcon,
  TargetIcon,
  ClipboardListIcon,
  Building2Icon,
  ListTodoIcon,
  CalendarDaysIcon,
  HistoryIcon,
  WrenchIcon,
  BugIcon,
  AlertTriangleIcon,
  MapIcon,
  FileTextIcon,
  FilesIcon,
  LibraryIcon,
  SparklesIcon,
  LayoutDashboardIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AreaKey = "comercial" | "operacao" | "tech" | "design" | "conhecimento" | "gestao";

interface WorkspaceHomeProps {
  userEmail: string | null;
  userRole: string | null;
  preferredArea: AreaKey;
}

export function WorkspaceHome({ userEmail, userRole, preferredArea }: WorkspaceHomeProps) {
  const [activeArea, setActiveArea] = useState<AreaKey>(preferredArea);
  const [prevPreferredArea, setPrevPreferredArea] = useState<AreaKey>(preferredArea);

  if (preferredArea !== prevPreferredArea) {
    setPrevPreferredArea(preferredArea);
    setActiveArea(preferredArea);
  }

  const areas = {
    comercial: {
      title: "Comercial",
      icon: TargetIcon,
      description: "Gestão de leads, prospecção ativa e conversão de clientes no pipeline.",
      color: "from-pink-500/20 to-purple-500/20 text-pink-400 border-pink-500/30",
      links: [
        { href: "/os/prospects", label: "Prospects", description: "Base de leads e inteligência comercial", icon: TargetIcon },
        { href: "/os/prospects/pipeline", label: "Funil de Vendas", description: "Kanban do pipeline de prospecção", icon: ClipboardListIcon },
        { href: "/os/clients", label: "Clientes", description: "Contratos ativos e faturados", icon: Building2Icon },
        { href: "/os/companies", label: "Empresas", description: "Empresas cadastradas no ecossistema", icon: Building2Icon }
      ],
      quickAction: { href: "/os/prospects", label: "Gerenciar Prospects" }
    },
    operacao: {
      title: "Operação",
      icon: BriefcaseIcon,
      description: "Planejamento, acompanhamento de tarefas e cronograma de projetos.",
      color: "from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30",
      links: [
        { href: "/os/projects", label: "Projetos", description: "Cronogramas, progresso e status", icon: BriefcaseIcon },
        { href: "/os/tasks", label: "Tarefas", description: "Pendências do time e sprints", icon: ListTodoIcon },
        { href: "/os/calendar", label: "Calendário", description: "Datas críticas e prazos de entrega", icon: CalendarDaysIcon },
        { href: "/os/activity", label: "Atividades", description: "Histórico geral de ações", icon: HistoryIcon }
      ],
      quickAction: { href: "/os/tasks", label: "Minhas Tarefas" }
    },
    tech: {
      title: "Tech",
      icon: TerminalIcon,
      description: "Centro de tecnologia, bugs, incidentes, roadmap técnico e decisões de arquitetura.",
      color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
      links: [
        { href: "/os/tech", label: "Tecnologia", description: "Tech Center principal", icon: WrenchIcon },
        { href: "/os/tech/bugs", label: "Bugs", description: "Falhas reportadas e status de correção", icon: BugIcon },
        { href: "/os/tech/incidents", label: "Incidentes", description: "Instabilidades críticas e postmortems", icon: AlertTriangleIcon },
        { href: "/os/tech/roadmap", label: "Roadmap Técnico", description: "Evolução do produto e arquitetura", icon: MapIcon }
      ],
      quickAction: { href: "/os/tech", label: "Painel de Tecnologia" }
    },
    design: {
      title: "Design",
      icon: PaletteIcon,
      description: "Briefings criativos, referências visuais, design tokens e entregas de marca.",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      links: [
        { href: "#", label: "Briefings", description: "Requisitos de criação e escopo visual (Breve)", icon: PaletteIcon, disabled: true },
        { href: "#", label: "Referências", description: "Quadros de inspiração e benchmarks (Breve)", icon: SparklesIcon, disabled: true },
        { href: "#", label: "Entregas Visuais", description: "Links de Figma e assets aprovados (Breve)", icon: FilesIcon, disabled: true },
        { href: "/os/wiki", label: "Wiki Design", description: "Diretrizes de marca e design system", icon: LibraryIcon }
      ],
      quickAction: { href: "/os/wiki", label: "Ver Diretrizes de Design" }
    },
    conhecimento: {
      title: "Conhecimento",
      icon: BookOpenIcon,
      description: "Segundo cérebro da empresa. Manuais operacionais, playbooks e repositório de arquivos.",
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
      links: [
        { href: "/os/wiki", label: "Wiki", description: "Manuais, onboarding e tutoriais", icon: LibraryIcon },
        { href: "/os/playbooks", label: "Playbooks", description: "Processos e roteiros estruturados", icon: FileTextIcon },
        { href: "/os/files", label: "Arquivos", description: "Repositório de mídias e documentos", icon: FilesIcon }
      ],
      quickAction: { href: "/os/wiki", label: "Navegar na Wiki" }
    },
    gestao: {
      title: "Gestão",
      icon: LayoutDashboardIcon,
      description: "KPIs do negócio, faturamento operacional e configurações globais.",
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
      links: [
        { href: "/os/dashboard", label: "Indicadores", description: "Visão consolidada de métricas", icon: LayoutDashboardIcon },
        { href: "/os/projects", label: "Projetos", description: "Acompanhamento geral de Sprints", icon: BriefcaseIcon },
        { href: "/os/activity", label: "Operação", description: "Auditoria de atividades em tempo real", icon: HistoryIcon },
        { href: "/os/settings", label: "Configurações", description: "Gerenciamento de sistema", icon: SettingsIcon }
      ],
      quickAction: { href: "/os/dashboard", label: "Acessar Painel Principal" }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Welcome Message */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-950/40 text-purple-300 border-purple-800/40 font-mono">
              Sprint 11 (Motherxip)
            </Badge>
            <span className="text-xs text-muted-foreground">Sessão: {userEmail}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">MOTHERXIP</h1>
          <p className="text-sm text-muted-foreground">
            Centro operacional integrado da <span className="text-purple-400 font-semibold">ALIENXIP</span>.
          </p>
        </div>
      </div>

      {/* Tabs Selector for Areas */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white/90">Áreas Operacionais</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 bg-[#0c0c0e] p-1.5 rounded-xl border border-white/5">
          {(Object.keys(areas) as AreaKey[]).map((key) => {
            const area = areas[key];
            const Icon = area.icon;
            const active = activeArea === key;
            return (
              <button
                key={key}
                onClick={() => setActiveArea(key)}
                className={cn(
                  "flex items-center gap-2 justify-center py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 border border-transparent",
                  active
                    ? "bg-purple-950/40 border-purple-500/30 text-purple-300 shadow-md shadow-purple-950/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("size-4", active ? "text-purple-300" : "text-muted-foreground")} />
                {area.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Workspace Showcase (Featured) */}
      <Card className="border-purple-500/20 bg-gradient-to-r from-[#0d0a15] to-[#08080a] relative overflow-hidden transition-all duration-300 hover:border-purple-500/35">
        <div className="absolute top-0 right-0 size-72 bg-purple-600/5 blur-3xl pointer-events-none rounded-full" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn("p-2 rounded-lg border", areas[activeArea].color.split(" ")[0], areas[activeArea].color.split(" ")[2])}>
              {(() => {
                const ActiveIcon = areas[activeArea].icon;
                return <ActiveIcon className="size-5" />;
              })()}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white font-mono uppercase tracking-wider">{areas[activeArea].title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">{areas[activeArea].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {areas[activeArea].links.map((link) => {
              const LinkIcon = link.icon;
              const isDisabled = "disabled" in link && link.disabled;
              
              if (isDisabled) {
                return (
                  <div
                    key={link.label}
                    className="opacity-50 flex items-start gap-3 rounded-lg border border-dashed border-white/5 bg-background/20 p-3 select-none"
                  >
                    <LinkIcon className="size-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-muted-foreground">{link.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-normal">{link.description}</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex items-start gap-3 rounded-lg border bg-background/40 p-3 transition-all duration-200 hover:bg-purple-950/20 hover:border-purple-500/20 hover:translate-y-[-2px]"
                >
                  <LinkIcon className="size-4 text-muted-foreground group-hover:text-purple-300 mt-0.5 transition-colors" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
                      {link.label}
                      <ChevronRightIcon className="size-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-normal">{link.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Role recomendada: <span className="capitalize text-white">{userRole || "member"}</span></span>
            {areas[activeArea].quickAction.href !== "#" && (
              <Link href={areas[activeArea].quickAction.href}>
                <span className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors">
                  {areas[activeArea].quickAction.label}
                  <ChevronRightIcon className="size-3.5" />
                </span>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid displaying All Areas (for quick access) */}
      <div>
        <h2 className="text-lg font-semibold text-white/90 mb-4">Todas as Áreas de Trabalho</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(areas) as AreaKey[]).map((key) => {
            const area = areas[key];
            const AreaIcon = area.icon;
            const isPreferred = key === preferredArea;
            return (
              <Card 
                key={key} 
                className={cn(
                  "hover:border-purple-500/25 bg-[#0a0a0c] transition-all duration-200 group relative cursor-pointer",
                  isPreferred ? "border-purple-500/20 shadow-sm shadow-purple-950/10" : ""
                )}
                onClick={() => setActiveArea(key)}
              >
                {isPreferred && (
                  <Badge className="absolute top-3 right-3 bg-purple-900/40 text-purple-300 border-purple-800/50 hover:bg-purple-900/40 text-[9px] scale-90">
                    Recomendado
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AreaIcon className="size-4.5 text-muted-foreground group-hover:text-purple-300 transition-colors" />
                    <CardTitle className="text-sm font-semibold text-white font-mono group-hover:text-purple-300 transition-colors">
                      {area.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {area.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-purple-400 group-hover:text-purple-300 transition-colors">
                    <span>{area.links.length} seções</span>
                    <span className="flex items-center gap-0.5 font-mono">
                      Acessar <ChevronRightIcon className="size-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
