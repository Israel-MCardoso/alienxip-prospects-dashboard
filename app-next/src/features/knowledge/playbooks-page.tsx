"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  TargetIcon,
  TerminalIcon,
  PaletteIcon,
  BriefcaseIcon,
  LayoutDashboardIcon,
  SearchIcon,
  PlusIcon,
  FileTextIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CopyIcon,
  GlobeIcon
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlaybookAction, updatePlaybookAction } from "./actions";
import type { PlaybookRow } from "./data";
import { playbookStatuses } from "./knowledge-helpers";
import { duplicatePlaybookAction, updateKnowledgeReviewAction, updatePlaybookStatusAction } from "@/features/governance/actions";
import { statusLabel, getCoreCategoryName } from "@/lib/display-helpers";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

// Defined UI category layout matching user specs
const UI_CATEGORIES = [
  { id: "all", label: "Todos", dbValues: [], icon: GlobeIcon, subtext: "Roteiros operacionais estruturados", color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20" },
  { id: "comercial", label: "Comercial", dbValues: ["vendas", "prospeccao"], icon: TargetIcon, subtext: "Processos, Vendas, Propostas, Scripts, CRM", color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20" },
  { id: "tech", label: "Tech", dbValues: ["desenvolvimento"], icon: TerminalIcon, subtext: "Arquitetura, Projetos, Deploys, Infraestrutura, IA", color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20" },
  { id: "design", label: "Design", dbValues: ["design"], icon: PaletteIcon, subtext: "Branding, UI/UX, Referências, Componentes", color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "operacao", label: "Operação", dbValues: ["operacao"], icon: BriefcaseIcon, subtext: "Entregas, Fluxos, Procedimentos", color: "from-blue-500/10 to-purple-500/10 text-blue-400 border-blue-500/20" },
  { id: "gestao", label: "Gestão", dbValues: ["geral", "suporte", "financeiro"], icon: LayoutDashboardIcon, subtext: "Estratégia, Processos internos, Contratações, Expansão", color: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20" }
];

export function PlaybooksPageView({ playbooks, error }: { playbooks: PlaybookRow[]; error: string | null }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [prevSelectedCategory, setPrevSelectedCategory] = useState(selectedCategory);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  if (selectedCategory !== prevSelectedCategory || searchQuery !== prevSearchQuery) {
    setPrevSelectedCategory(selectedCategory);
    setPrevSearchQuery(searchQuery);
    setCurrentPage(1);
  }

  // Compute counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: playbooks.length };
    UI_CATEGORIES.forEach(cat => {
      if (cat.id === "all") return;
      counts[cat.id] = playbooks.filter(p => cat.dbValues.includes(p.category || "")).length;
    });
    return counts;
  }, [playbooks]);

  // Filtered playbooks based on category card click + search query
  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(playbook => {
      // Filter by category
      if (selectedCategory !== "all") {
        const catObj = UI_CATEGORIES.find(c => c.id === selectedCategory);
        if (catObj && !catObj.dbValues.includes(playbook.category || "")) {
          return false;
        }
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = playbook.title?.toLowerCase().includes(query);
        const matchesContent = playbook.content?.toLowerCase().includes(query);
        const matchesDesc = playbook.description?.toLowerCase().includes(query);
        return matchesTitle || matchesContent || matchesDesc;
      }
      return true;
    });
  }, [playbooks, selectedCategory, searchQuery]);

  const itemsPerPage = 10;
  const totalItems = filteredPlaybooks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedPlaybooks = useMemo(() => {
    return filteredPlaybooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredPlaybooks, currentPage]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono">PLAYBOOKS</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Roteiros, processos operacionais e checklists estruturados da <span className="text-purple-400 font-semibold">ALIENXIP</span>.
          </p>
        </div>
        <div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <PlusIcon className="size-4" />
            {showCreateForm ? "Fechar" : "Novo Playbook"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-red-400 font-mono">Erro de Carregamento</CardTitle>
            <CardDescription className="text-xs text-red-500">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Create Playbook Form */}
      {showCreateForm && (
        <Card className="border-purple-500/30 bg-purple-950/5 animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-white font-mono">Criar Novo Playbook</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Adicione guias de execução passo a passo.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaybookForm onSuccess={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      {/* Category Grid Selection */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {UI_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 bg-[#08080a] flex flex-col justify-between hover:translate-y-[-2px]",
                isActive
                  ? "border-purple-500 bg-purple-950/20 shadow-md shadow-purple-950/30 text-purple-300"
                  : "border-white/5 text-muted-foreground hover:border-white/10 hover:text-white"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg border", cat.color.split(" ")[0], cat.color.split(" ")[2])}>
                  <CatIcon className="size-4.5" />
                </div>
                <span className="text-[10px] font-mono bg-[#111115] px-2 py-0.5 rounded-full border border-white/5">
                  {count}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                  {cat.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playbooks List Grid */}
      <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white font-mono">Biblioteca de Playbooks</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Exibindo {totalItems} registro(s).
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar playbooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-white/5 bg-[#0a0a0c] text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {paginatedPlaybooks.length === 0 ? (
            <div className="py-8 text-center">
              <FileTextIcon className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum playbook encontrado.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                {paginatedPlaybooks.map((playbook) => {
                  const isPublished = playbook.status === "published";
                  const isArchived = playbook.status === "archived";
                  const needsReview = playbook.review_status === "needs_review";

                  return (
                    <Link
                      href={`/os/playbooks/${playbook.id}`}
                      key={playbook.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-background/30 p-4 hover:bg-purple-950/10 hover:border-purple-500/20 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded-full">
                            {getCoreCategoryName(playbook.category)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {needsReview && (
                              <span className="text-[9px] font-semibold bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <AlertCircleIcon className="size-2.5" />
                                Revisão
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-2 py-0.5 rounded-full border",
                                isPublished
                                  ? "bg-purple-950/40 text-purple-300 border-purple-800/40"
                                  : isArchived
                                  ? "bg-zinc-900/60 text-zinc-400 border-zinc-800/60"
                                  : "bg-amber-950/40 text-amber-300 border-amber-800/40"
                              )}
                            >
                                {statusLabel(playbook.status)}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 mt-2.5 transition-colors">
                          {playbook.title}
                        </h3>
                        {playbook.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {playbook.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-zinc-500 mt-3 line-clamp-2 leading-normal italic font-mono bg-black/20 p-2 rounded border border-white/5">
                          {playbook.content}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          {playbook.updated_at ? new Date(playbook.updated_at).toLocaleDateString("pt-BR") : "Recent"}
                        </span>
                        <span className="flex items-center gap-0.5">
                          Acessar playbook &rarr;
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PlaybookDetailView({ playbook }: { playbook: PlaybookRow }) {
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const isPublished = playbook.status === "published";
  const isArchived = playbook.status === "archived";
  const needsReview = playbook.review_status === "needs_review";

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <Link href="/os/playbooks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
          <ArrowLeftIcon className="size-3.5" />
          Voltar para Playbooks
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Playbook Body */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md overflow-hidden relative">
            <div className="absolute top-0 right-0 size-72 bg-purple-600/5 blur-3xl pointer-events-none rounded-full" />
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2.5 py-0.5 rounded-full">
                  {getCoreCategoryName(playbook.category)}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                    isPublished
                      ? "bg-purple-950/40 text-purple-300 border-purple-800/40"
                      : isArchived
                      ? "bg-zinc-900/60 text-zinc-400 border-zinc-800/60"
                      : "bg-amber-950/40 text-amber-300 border-amber-800/40"
                  )}
                >
                  {statusLabel(playbook.status)}
                </span>
                {needsReview && (
                  <span className="text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
                    Precisa de Revisão
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-white font-mono tracking-tight">{playbook.title}</CardTitle>
              {playbook.description && (
                <CardDescription className="text-xs text-purple-300/80 mt-1 leading-relaxed">
                  {playbook.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-6 text-sm text-white/90 leading-relaxed font-sans max-w-none">
              {renderMarkdown(playbook.content)}
            </CardContent>
          </Card>

          {/* Action Toolbar */}
          <Card className="border-white/5 bg-[#08080a]/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <form action={updatePlaybookStatusAction.bind(null, playbook.id, "published")}>
                  <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs">
                    Publicar
                  </Button>
                </form>
                {isArchived ? (
                  <form action={updatePlaybookStatusAction.bind(null, playbook.id, "draft")}>
                    <Button type="submit" size="sm" variant="outline" className="border-white/5 hover:bg-white/5 text-xs">
                      Restaurar Rascunho
                    </Button>
                  </form>
                ) : (
                  <form action={updatePlaybookStatusAction.bind(null, playbook.id, "archived")}>
                    <Button type="submit" size="sm" variant="outline" className="border-white/5 hover:bg-white/5 text-xs text-zinc-400">
                      Arquivar
                    </Button>
                  </form>
                )}
                <form action={duplicatePlaybookAction.bind(null, playbook.id)}>
                  <Button type="submit" size="sm" variant="outline" className="border-white/5 hover:bg-white/5 text-xs flex items-center gap-1">
                    <CopyIcon className="size-3" />
                    Duplicar
                  </Button>
                </form>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowEdit(!showEdit)}
                  size="sm"
                  variant="outline"
                  className="border-purple-500/20 text-purple-300 hover:bg-purple-950/20 text-xs"
                >
                  {showEdit ? "Fechar Editor" : "Editar Conteúdo"}
                </Button>
              </div>
            </div>
          </Card>

          {showEdit && (
            <Card className="border-purple-500/20 bg-purple-950/5 animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white font-mono">Editar Playbook</CardTitle>
              </CardHeader>
              <CardContent>
                <PlaybookForm playbook={playbook} onSuccess={() => setShowEdit(false)} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Governance Panel */}
        <div className="flex flex-col gap-6">
          <Card className="border-white/5 bg-[#08080a]/60">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-semibold text-white font-mono flex items-center gap-1.5">
                <CheckCircle2Icon className="size-4.5 text-purple-400" />
                Painel de Governança
              </CardTitle>
              <CardDescription className="text-[10px]">Gerencie revisões e integridade técnica deste arquivo.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-muted-foreground">Revisão Atual:</span>
                <span className={cn(
                  "font-mono px-2 py-0.5 rounded text-[10px] border",
                  playbook.review_status === "approved"
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/30"
                    : playbook.review_status === "needs_review"
                    ? "bg-amber-950/30 text-amber-400 border-amber-800/30"
                    : "bg-red-950/30 text-red-400 border-red-800/30"
                )}>
                  {playbook.review_status === "approved" ? "Aprovado" : playbook.review_status === "needs_review" ? "Aguardando" : "Outdated"}
                </span>
              </div>

              <div className="grid gap-2 mt-2">
                <form action={updateKnowledgeReviewAction.bind(null, "playbook", playbook.id, "approved")}>
                  <Button type="submit" size="sm" className="w-full bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800/30 text-xs">
                    Aprovar Revisão
                  </Button>
                </form>
                <form action={updateKnowledgeReviewAction.bind(null, "playbook", playbook.id, "outdated")}>
                  <Button type="submit" size="sm" className="w-full bg-red-950/30 hover:bg-red-900/20 text-red-400 border border-red-800/30 text-xs">
                    Marcar como Desatualizado (Outdated)
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlaybookForm({ playbook, onSuccess }: { playbook?: PlaybookRow; onSuccess?: () => void }) {
  const action = playbook ? updatePlaybookAction.bind(null, playbook.id) : createPlaybookAction;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      await action(data);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Erro ao salvar: " + msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Título</label>
        <Input
          name="title"
          placeholder="Ex: Roteiro de Call Inicial"
          required
          defaultValue={playbook?.title || ""}
          className="border-white/5 bg-[#0a0a0c] text-xs h-9"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Descrição Curta</label>
        <Input
          name="description"
          placeholder="Instruções breves sobre quando usar este playbook"
          defaultValue={playbook?.description || ""}
          className="border-white/5 bg-[#0a0a0c] text-xs h-9"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Categoria Principal</label>
        <select
          name="category"
          defaultValue={playbook?.category || "geral"}
          className="h-9 rounded-lg border border-white/5 bg-[#0a0a0c] px-2.5 text-xs text-white"
        >
          <option value="vendas">Comercial (Processos, Vendas, CRM, Scripts)</option>
          <option value="desenvolvimento">Tech (Arquitetura, Deploys, IA, Infra)</option>
          <option value="design">Design (Branding, UI/UX, Componentes)</option>
          <option value="operacao">Operação (Entregas, Fluxos, Procedimentos)</option>
          <option value="geral">Gestão (Estratégia, Processos Internos, Recrutamento)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Status do Documento</label>
        <select
          name="status"
          defaultValue={playbook?.status || "draft"}
          className="h-9 rounded-lg border border-white/5 bg-[#0a0a0c] px-2.5 text-xs text-white"
        >
          {playbookStatuses.map((item) => (
            <option key={item} value={item}>
              {statusLabel(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Conteúdo do Playbook</label>
        <textarea
          name="content"
          placeholder="Descreva o passo a passo ou roteiro estruturado..."
          required
          defaultValue={playbook?.content || ""}
          className="min-h-48 rounded-lg border border-white/5 bg-[#0a0a0c] p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-purple-500/50"
        />
      </div>

      <div className="md:col-span-2 pt-2 flex justify-end">
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6">
          {playbook ? "Salvar Alterações" : "Criar Playbook"}
        </Button>
      </div>
    </form>
  );
}

// Simple React-based Markdown Parser to achieve Notion/GitBook style escaneabilidade
function renderMarkdown(content: string) {
  if (!content) return null;

  // Split by code blocks first to preserve code block content
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : "";
      const code = match ? match[2] : part.replace(/```/g, "");
      return (
        <pre key={index} className="bg-black/60 border border-white/5 rounded-xl p-4 my-4 overflow-x-auto font-mono text-xs text-purple-300">
          {language && <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-2 font-mono">{language}</div>}
          <code>{code.trim()}</code>
        </pre>
      );
    }

    const lines = part.split("\n");
    let inList = false;
    const renderedElements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        renderedElements.push(
          <ul key={key} className="list-disc pl-6 my-3 space-y-1.5 text-zinc-300">
            {listItems.map((item, itemIdx) => (
              <li key={itemIdx}>{processInlineFormatting(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, lineIdx) => {
      const key = `${index}-${lineIdx}`;
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("# ")) {
        flushList(key);
        renderedElements.push(
          <h1 key={key} className="text-2xl font-bold font-mono text-white mt-6 mb-3 tracking-tight border-b border-white/5 pb-2 uppercase tracking-wide bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
            {processInlineFormatting(trimmedLine.slice(2))}
          </h1>
        );
      } else if (trimmedLine.startsWith("## ")) {
        flushList(key);
        renderedElements.push(
          <h2 key={key} className="text-xl font-semibold font-mono text-purple-200 mt-5 mb-2.5 border-b border-white/5 pb-1">
            {processInlineFormatting(trimmedLine.slice(3))}
          </h2>
        );
      } else if (trimmedLine.startsWith("### ")) {
        flushList(key);
        renderedElements.push(
          <h3 key={key} className="text-md font-semibold font-mono text-white mt-4 mb-2">
            {processInlineFormatting(trimmedLine.slice(4))}
          </h3>
        );
      } else if (trimmedLine.startsWith("> ")) {
        flushList(key);
        renderedElements.push(
          <blockquote key={key} className="border-l-2 border-purple-500 bg-purple-950/10 rounded-r-lg px-4 py-3 my-4 text-xs text-purple-300 italic leading-relaxed">
            {processInlineFormatting(trimmedLine.slice(2))}
          </blockquote>
        );
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        inList = true;
        listItems.push(trimmedLine.slice(2));
      } else if (trimmedLine === "") {
        flushList(key);
      } else {
        if (inList) {
          if (listItems.length > 0) {
            listItems[listItems.length - 1] += " " + trimmedLine;
          } else {
            flushList(key);
            renderedElements.push(
              <p key={key} className="my-3 text-zinc-300 leading-relaxed text-sm font-sans">
                {processInlineFormatting(trimmedLine)}
              </p>
            );
          }
        } else {
          renderedElements.push(
            <p key={key} className="my-3 text-zinc-300 leading-relaxed text-sm font-sans">
              {processInlineFormatting(trimmedLine)}
            </p>
          );
        }
      }
    });

    flushList(`flush-${index}`);
    return <div key={index}>{renderedElements}</div>;
  });
}

function processInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-purple-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
