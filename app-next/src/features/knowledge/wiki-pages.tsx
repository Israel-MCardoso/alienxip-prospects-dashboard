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
  ChevronRightIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CopyIcon,
  GlobeIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createWikiPageAction, updateWikiPageAction, updateWikiStatusAction } from "./actions";
import type { WikiPageRow } from "./data";
import { slugify, wikiStatuses } from "./knowledge-helpers";
import { seedOfficialTemplatesAction, updateKnowledgeReviewAction, duplicateWikiPageAction } from "@/features/governance/actions";
import { statusLabel, getCoreCategoryName } from "@/lib/display-helpers";
import { cn } from "@/lib/utils";

// Defined UI category layout matching user specs
const UI_CATEGORIES = [
  { id: "all", label: "Todos", dbValues: [], icon: GlobeIcon, subtext: "Todo o conhecimento operacional", color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20" },
  { id: "comercial", label: "Comercial", dbValues: ["vendas", "prospeccao"], icon: TargetIcon, subtext: "Processos, Vendas, Propostas, Scripts, CRM", color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20" },
  { id: "tech", label: "Tech", dbValues: ["desenvolvimento"], icon: TerminalIcon, subtext: "Arquitetura, Projetos, Deploys, Infraestrutura, IA", color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20" },
  { id: "design", label: "Design", dbValues: ["design"], icon: PaletteIcon, subtext: "Branding, UI/UX, Referências, Componentes", color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "operacao", label: "Operação", dbValues: ["operacao"], icon: BriefcaseIcon, subtext: "Entregas, Fluxos, Procedimentos", color: "from-blue-500/10 to-purple-500/10 text-blue-400 border-blue-500/20" },
  { id: "gestao", label: "Gestão", dbValues: ["geral", "suporte", "financeiro"], icon: LayoutDashboardIcon, subtext: "Estratégia, Processos internos, Contratações, Expansão", color: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20" }
];

export function WikiList({ pages, error }: { pages: WikiPageRow[]; error: string | null }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Compute counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pages.length };
    UI_CATEGORIES.forEach(cat => {
      if (cat.id === "all") return;
      counts[cat.id] = pages.filter(p => cat.dbValues.includes(p.category || "")).length;
    });
    return counts;
  }, [pages]);

  // Filtered pages based on category card click + search query
  const filteredPages = useMemo(() => {
    return pages.filter(page => {
      // Filter by category
      if (selectedCategory !== "all") {
        const catObj = UI_CATEGORIES.find(c => c.id === selectedCategory);
        if (catObj && !catObj.dbValues.includes(page.category || "")) {
          return false;
        }
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = page.title?.toLowerCase().includes(query);
        const matchesContent = page.content?.toLowerCase().includes(query);
        return matchesTitle || matchesContent;
      }
      return true;
    });
  }, [pages, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono">WIKI</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Base de conhecimento operacional e diretrizes de marca do <span className="text-purple-400 font-semibold">MOTHERXIP</span>.
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <form action={seedOfficialTemplatesAction} className="inline-block">
            <Button type="submit" variant="outline" size="sm" className="border-purple-500/20 hover:bg-purple-950/20 text-xs">
              Templates Oficiais
            </Button>
          </form>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <PlusIcon className="size-4" />
            {showCreateForm ? "Fechar" : "Nova Página"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-red-400 font-mono">Erro de Sincronização</CardTitle>
            <CardDescription className="text-xs text-red-500">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Create Form Container */}
      {showCreateForm && (
        <Card className="border-purple-500/30 bg-purple-950/5 animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-white font-mono">Nova Página Wiki</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Registre novos manuais ou especificações operacionais.</CardDescription>
          </CardHeader>
          <CardContent>
            <WikiForm onSuccess={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      {/* Main Categories Hub Grid */}
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

      {/* Search and Pages List */}
      <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white font-mono">Documentos Wiki</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Exibindo {filteredPages.length} de {pages.length} páginas.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar páginas wiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-white/5 bg-[#0a0a0c] text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          {filteredPages.length === 0 ? (
            <div className="py-8 text-center">
              <FileTextIcon className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma página encontrada para esta seleção.</p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filteredPages.map((page) => {
                const isPublished = page.status === "published";
                const isArchived = page.status === "archived";
                const needsReview = page.review_status === "needs_review";

                return (
                  <Link
                    key={page.id}
                    href={`/os/wiki/${page.slug}`}
                    className="group flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-white/5 bg-background/30 p-3.5 hover:bg-purple-950/10 hover:border-purple-500/20 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#0e0e12] border border-white/5 text-muted-foreground group-hover:text-purple-300 transition-colors mt-0.5">
                        <FileTextIcon className="size-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {page.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span className="text-purple-400 font-medium">
                            {getCoreCategoryName(page.category)}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="size-3" />
                            {page.updated_at ? new Date(page.updated_at).toLocaleDateString("pt-BR") : "Recent"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 md:mt-0">
                      {needsReview && (
                        <span className="text-[9px] font-semibold bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircleIcon className="size-3" />
                          Revisão
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[9px] font-semibold px-2.5 py-0.5 rounded-full border",
                          isPublished
                            ? "bg-purple-950/40 text-purple-300 border-purple-800/40"
                            : isArchived
                            ? "bg-zinc-900/60 text-zinc-400 border-zinc-800/60"
                            : "bg-amber-950/40 text-amber-300 border-amber-800/40"
                        )}
                      >
                        {statusLabel(page.status)}
                      </span>
                      <ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-purple-300 transition-colors group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function WikiDetail({ page }: { page: WikiPageRow }) {
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const isPublished = page.status === "published";
  const isArchived = page.status === "archived";
  const needsReview = page.review_status === "needs_review";

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <Link href="/os/wiki" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
          <ArrowLeftIcon className="size-3.5" />
          Voltar para a Wiki
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-white/5 bg-[#08080a]/60 backdrop-blur-md overflow-hidden relative">
            <div className="absolute top-0 right-0 size-72 bg-purple-600/5 blur-3xl pointer-events-none rounded-full" />
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2.5 py-0.5 rounded-full">
                  {getCoreCategoryName(page.category)}
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
                  {statusLabel(page.status)}
                </span>
                {needsReview && (
                  <span className="text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
                    Precisa de Revisão
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-white font-mono tracking-tight">{page.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Criado/Atualizado em: {page.updated_at ? new Date(page.updated_at).toLocaleString("pt-BR") : "Recent"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-sm text-white/90 leading-relaxed font-sans max-w-none">
              {renderMarkdown(page.content)}
            </CardContent>
          </Card>

          {/* Action Toolbar */}
          <Card className="border-white/5 bg-[#08080a]/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <form action={updateWikiStatusAction.bind(null, page.id, "published")}>
                  <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs">
                    Publicar
                  </Button>
                </form>
                {isArchived ? (
                  <form action={updateWikiStatusAction.bind(null, page.id, "draft")}>
                    <Button type="submit" size="sm" variant="outline" className="border-white/5 hover:bg-white/5 text-xs">
                      Restaurar Rascunho
                    </Button>
                  </form>
                ) : (
                  <form action={updateWikiStatusAction.bind(null, page.id, "archived")}>
                    <Button type="submit" size="sm" variant="outline" className="border-white/5 hover:bg-white/5 text-xs text-zinc-400">
                      Arquivar
                    </Button>
                  </form>
                )}
                <form action={duplicateWikiPageAction.bind(null, page.id)}>
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
                <CardTitle className="text-sm font-semibold text-white font-mono">Editar Página Wiki</CardTitle>
              </CardHeader>
              <CardContent>
                <WikiForm page={page} onSuccess={() => setShowEdit(false)} />
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
                  page.review_status === "approved"
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/30"
                    : page.review_status === "needs_review"
                    ? "bg-amber-950/30 text-amber-400 border-amber-800/30"
                    : "bg-red-950/30 text-red-400 border-red-800/30"
                )}>
                  {page.review_status === "approved" ? "Aprovado" : page.review_status === "needs_review" ? "Aguardando" : "Outdated"}
                </span>
              </div>

              <div className="grid gap-2 mt-2">
                <form action={updateKnowledgeReviewAction.bind(null, "wiki", page.id, "approved")}>
                  <Button type="submit" size="sm" className="w-full bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800/30 text-xs">
                    Aprovar Revisão
                  </Button>
                </form>
                <form action={updateKnowledgeReviewAction.bind(null, "wiki", page.id, "outdated")}>
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

function WikiForm({ page, onSuccess }: { page?: WikiPageRow; onSuccess?: () => void }) {
  const action = page ? updateWikiPageAction.bind(null, page.id) : createWikiPageAction;
  
  // Local states to sync Title & Slug in real time
  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!page) {
      setSlug(slugify(val));
    }
  };

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
          placeholder="Ex: Arquitetura de Microsserviços"
          required
          value={title}
          onChange={handleTitleChange}
          className="border-white/5 bg-[#0a0a0c] text-xs h-9"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Slug da URL</label>
        <Input
          name="slug"
          placeholder="ex-slug-do-documento"
          required
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          className="border-white/5 bg-[#0a0a0c] text-xs h-9 font-mono"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Categoria Principal</label>
        <select
          name="category"
          defaultValue={page?.category || "geral"}
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
          defaultValue={page?.status || "draft"}
          className="h-9 rounded-lg border border-white/5 bg-[#0a0a0c] px-2.5 text-xs text-white"
        >
          {wikiStatuses.map((item) => (
            <option key={item} value={item}>
              {statusLabel(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-[10px] text-muted-foreground font-mono uppercase">Conteúdo do Documento (Markdown suportado)</label>
        <textarea
          name="content"
          placeholder="Escreva as diretrizes, processos ou especificações..."
          required
          defaultValue={page?.content || ""}
          className="min-h-48 rounded-lg border border-white/5 bg-[#0a0a0c] p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-purple-500/50"
        />
      </div>

      <div className="md:col-span-2 pt-2 flex justify-end">
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6">
          {page ? "Salvar Alterações" : "Criar Nova Página"}
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
