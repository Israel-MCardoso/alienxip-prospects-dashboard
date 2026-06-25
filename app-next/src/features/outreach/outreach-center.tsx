"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  SendIcon,
  MessageSquareIcon,
  CalendarIcon,
  AlertTriangleIcon,
  PlayIcon,
  PauseIcon,
  StopCircleIcon,
  SearchIcon,
  MessageCircleIcon,
  ClockIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  XIcon
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProspectRow } from "@/features/prospects/data";
import type { WebhookAuditLogRow, OutreachBatchRow } from "@/types/outreach";
import { pauseOutreachAction, stopOutreachAction, resumeOutreachAction } from "./actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { ProductionReadinessStrip } from "./production-readiness-strip";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/components/ui/toast";
import { JsonViewerDialog } from "@/components/ui/json-viewer-dialog";

interface OutreachCenterProps {
  prospects: ProspectRow[];
  auditLogs: WebhookAuditLogRow[];
  batches: OutreachBatchRow[];
  error: string | null;
  isConfigured: boolean;
  userRole: string | null;
}

export function OutreachCenter({
  prospects,
  auditLogs,
  batches,
  error
}: OutreachCenterProps) {
  const [selectedSource, setSelectedSource] = useState<string>("sandbox"); // sandbox is the default validation surface
  const [inputQ, setInputQ] = useState("");
  const [q, setQ] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const [jsonView, setJsonView] = useState<{ title: string; value: unknown } | null>(null);

  const [prevQ, setPrevQ] = useState(q);
  const [prevStatus, setPrevStatus] = useState(selectedStatus);
  const [prevChannel, setPrevChannel] = useState(selectedChannel);
  const [prevSource, setPrevSource] = useState(selectedSource);

  if (q !== prevQ || selectedStatus !== prevStatus || selectedChannel !== prevChannel || selectedSource !== prevSource) {
    setPrevQ(q);
    setPrevStatus(selectedStatus);
    setPrevChannel(selectedChannel);
    setPrevSource(selectedSource);
    setCurrentPage(1);
  }

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(inputQ);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputQ]);
  const [showDevDrawer, setShowDevDrawer] = useState(false);

  // Ctrl+D shortcut to toggle developer drawer
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setShowDevDrawer((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Extract outreach record helper
  const getOutreach = (p: ProspectRow) => {
    return p.prospect_outreach?.[0] || null;
  };

  // 1. Filter by automation source first
  const sourceFilteredProspects = prospects.filter((p) => {
    const o = getOutreach(p);
    const source = o?.automation_source || "production"; // default to production
    return source === selectedSource;
  });

  const filteredBatches = (batches || []).filter(
    (b) => b.automation_source === selectedSource
  );

  // 2. Filter by search query, status and channel
  const filtered = sourceFilteredProspects.filter((p) => {
    const o = getOutreach(p);
    const hasMatch = p.name.toLowerCase().includes(q.toLowerCase()) || 
                     (p.segment || "").toLowerCase().includes(q.toLowerCase()) ||
                     (o?.n8n_execution_id || "").toLowerCase().includes(q.toLowerCase());
    
    const statusMatch = !selectedStatus || (o && o.status === selectedStatus);
    const channelMatch = !selectedChannel || (o && o.channel === selectedChannel);

    return hasMatch && statusMatch && channelMatch;
  });

  const itemsPerPage = 10;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedFiltered = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 3. Calculate statistics based on selected source
  const outreachList = sourceFilteredProspects.map(getOutreach).filter(Boolean);
  
  const leadsEmAutomacao = outreachList.filter(o => ["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o?.status || "")).length;
  const aguardandoResposta = outreachList.filter(o => o?.status === "waiting_reply").length;
  const responderam = outreachList.filter(o => o?.status === "replied").length;
  const negociando = outreachList.filter(o => o?.status === "negotiating").length;
  const reunioesMarcadas = outreachList.filter(o => o?.status === "meeting_scheduled").length;

  const totalContacted = outreachList.filter(o => o && !["not_started", "queued"].includes(o.status)).length;
  const taxaResposta = totalContacted > 0 ? Math.round((responderam / totalContacted) * 100) : 0;

  // Operational Alerts: Falhas
  const totalFailed = outreachList.filter(o => o?.status === "failed").length;
  const totalPaused = outreachList.filter(o => o?.status === "paused").length;
  const totalStopped = outreachList.filter(o => o?.status === "stopped").length;

  // 4. Stuck leads (Health Monitor)
  const now = new Date();
  const getMsAgo = (dateStr: string) => now.getTime() - new Date(dateStr).getTime();
  const msInHour = 60 * 60 * 1000;

  const stuck24h = sourceFilteredProspects.filter((p) => {
    const o = getOutreach(p);
    if (!o || !["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status)) return false;
    const hours = getMsAgo(o.updated_at) / msInHour;
    return hours >= 24 && hours < 48;
  });

  const stuck48h = sourceFilteredProspects.filter((p) => {
    const o = getOutreach(p);
    if (!o || !["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status)) return false;
    const hours = getMsAgo(o.updated_at) / msInHour;
    return hours >= 48 && hours < 72;
  });

  const stuck72h = sourceFilteredProspects.filter((p) => {
    const o = getOutreach(p);
    if (!o || !["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status)) return false;
    const hours = getMsAgo(o.updated_at) / msInHour;
    return hours >= 72;
  });

  // Action handlers
  const handlePause = (prospectId: string) => {
    startTransition(async () => {
      try {
        await pauseOutreachAction(prospectId);
      } catch (err) {
        toast.error("Não foi possível pausar o outreach.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleStop = (prospectId: string) => {
    startTransition(async () => {
      try {
        await stopOutreachAction(prospectId);
      } catch (err) {
        toast.error("Não foi possível parar o outreach.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleResume = (prospectId: string) => {
    startTransition(async () => {
      try {
        await resumeOutreachAction(prospectId);
      } catch (err) {
        toast.error("Não foi possível retomar o outreach.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  // Status mapping labels and classes
  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    not_started: { label: "Não Iniciado", bg: "bg-zinc-950/20", text: "text-zinc-400", border: "border-zinc-500/20" },
    queued: { label: "Fila", bg: "bg-blue-950/20", text: "text-blue-300", border: "border-blue-500/20" },
    sent: { label: "Enviado", bg: "bg-cyan-950/20", text: "text-cyan-300", border: "border-cyan-500/20" },
    delivered: { label: "Entregue", bg: "bg-sky-950/20", text: "text-sky-300", border: "border-sky-500/20" },
    waiting_reply: { label: "Aguardando Resposta", bg: "bg-indigo-950/20", text: "text-indigo-300", border: "border-indigo-500/20" },
    replied: { label: "Respondeu", bg: "bg-purple-950/20", text: "text-purple-300", border: "border-purple-500/20" },
    negotiating: { label: "Negociando", bg: "bg-amber-950/20", text: "text-amber-300", border: "border-amber-500/20" },
    meeting_scheduled: { label: "Reunião Marcada", bg: "bg-emerald-950/20", text: "text-emerald-300", border: "border-emerald-500/20" },
    failed: { label: "Falhou", bg: "bg-rose-950/20", text: "text-rose-300", border: "border-rose-500/20" },
    paused: { label: "Pausado", bg: "bg-yellow-950/20", text: "text-yellow-300", border: "border-yellow-500/20" },
    stopped: { label: "Parado", bg: "bg-zinc-950/20", text: "text-zinc-400", border: "border-zinc-500/20" },
    disqualified: { label: "Desqualificado", bg: "bg-orange-950/20", text: "text-orange-300", border: "border-orange-500/20" }
  };

  const getStatusStyle = (status: string) => {
    return statusConfig[status] || { label: status, bg: "bg-white/5", text: "text-white", border: "border-white/10" };
  };

  // Columns for UI board mapping
  const columns = [
    { title: "Fila & Enviados", statuses: ["queued", "sent", "delivered", "waiting_reply"], icon: SendIcon, color: "text-blue-400" },
    { title: "Em Conversa & Negociação", statuses: ["replied", "negotiating"], icon: MessageSquareIcon, color: "text-purple-400" },
    { title: "Reunião Agendada", statuses: ["meeting_scheduled"], icon: CalendarIcon, color: "text-emerald-400" },
    { title: "Falhas / Pausados", statuses: ["failed", "paused", "stopped"], icon: AlertTriangleIcon, color: "text-rose-400" }
  ];

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-950/40 text-purple-300 border-purple-800/40 dark:border-purple-800/40 border-purple-200 font-mono w-fit">
              n8n Integration Engine v1.5
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDevDrawer(true)}
              className="h-7 text-[10px] font-mono gap-1 border border-border/80 bg-background/50 hover:bg-muted text-foreground cursor-pointer"
            >
              <span>Painel Dev</span>
              <kbd className="hidden sm:inline-flex h-4 select-none items-center rounded border border-border bg-background px-1 text-[8px] font-medium text-muted-foreground/60">
                Ctrl+D
              </kbd>
            </Button>
          </div>
          
          {/* Environment Switcher */}
          <div className="flex border border-sidebar-border p-1 rounded-xl bg-sidebar/40 w-max font-mono text-[10px] shadow-sm">
            <button
              onClick={() => setSelectedSource("production")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedSource === "production"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🚀 Produção (Production)
            </button>
            <button
              onClick={() => setSelectedSource("sandbox")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedSource === "sandbox"
                  ? "bg-amber-500 text-white font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🛠️ Sandbox (Staging)
            </button>
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase bg-gradient-to-r dark:from-white dark:via-purple-100 dark:to-purple-400 from-slate-900 via-purple-800 to-purple-600 bg-clip-text text-transparent">
          OUTREACH MISSION CONTROL
        </h1>
        
        <p className="max-w-3xl text-sm text-muted-foreground">
          Supervisão, governança e monitoramento de prospecção fria e conversas automatizadas via n8n.
        </p>
      </div>

      {selectedSource === "sandbox" && (
        <div className="p-3.5 border dark:border-yellow-500/20 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/15 rounded-xl text-yellow-850 dark:text-yellow-300 text-xs font-mono flex items-center gap-2 shadow-sm">
          <span>⚠️</span>
          <span>
            <strong>AMBIENTE DE TESTE ATIVO:</strong> As métricas, funis e listagens abaixo referem-se estritamente ao fluxo do Sandbox / Homologação de n8n.
          </span>
        </div>
      )}

      {error && (
        <Card className="border-rose-500/30 bg-rose-950/10">
          <CardHeader>
            <CardTitle className="text-rose-400">Falha operacional detectada</CardTitle>
            <CardDescription className="text-rose-300/80">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <ProductionReadinessStrip />

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Conversion Funnel */}
        <Card className="border-border bg-card/40 backdrop-blur-md shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
            <CardTitle className="text-xs font-mono text-emerald-500 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              📈 Funil de Conversão Outreach
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 pt-3">
            {[
              { label: "Enviado/Fila", value: leadsEmAutomacao, icon: SendIcon, color: "text-blue-500 dark:text-blue-400" },
              { label: "Aguardando", value: aguardandoResposta, icon: ClockIcon, color: "text-indigo-500 dark:text-indigo-400" },
              { label: "Respondeu", value: responderam, icon: MessageSquareIcon, color: "text-purple-500 dark:text-purple-400" },
              { label: "Negociando", value: negociando, icon: MessageCircleIcon, color: "text-amber-500 dark:text-amber-400" },
              { label: "Agendado", value: reunioesMarcadas, icon: CalendarIcon, color: "text-emerald-500 dark:text-emerald-400" },
              { label: "Taxa Resp.", value: `${taxaResposta}%`, icon: CheckCircle2Icon, color: "text-sky-500 dark:text-sky-400" }
            ].map((m, idx) => (
              <div key={idx} className="flex flex-col justify-between p-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
                <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                  {m.label}
                </div>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span className="text-base font-bold font-mono text-foreground">{m.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Operational Alerts / Failures */}
        <Card className="border-border bg-card/40 backdrop-blur-md shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
            <CardTitle className="text-xs font-mono text-rose-500 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              ⚠️ Alertas Operacionais / Falhas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-3 gap-3 pt-3">
            {[
              { label: "Falhou (Error)", value: totalFailed, icon: AlertTriangleIcon, color: "text-rose-500 dark:text-rose-400", border: "dark:border-rose-500/20 border-rose-200 bg-rose-50/20 dark:bg-rose-950/20" },
              { label: "Pausado (Paused)", value: totalPaused, icon: PauseIcon, color: "text-yellow-500 dark:text-yellow-400", border: "dark:border-yellow-500/20 border-yellow-250 bg-yellow-50/20 dark:bg-yellow-950/20" },
              { label: "Parado (Stopped)", value: totalStopped, icon: StopCircleIcon, color: "text-zinc-500 dark:text-zinc-400", border: "dark:border-zinc-500/20 border-zinc-200 bg-zinc-50/20 dark:bg-zinc-950/20" }
            ].map((m, idx) => (
              <div key={idx} className={`flex flex-col justify-between p-3 rounded-xl border backdrop-blur-sm shadow-sm ${m.border}`}>
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                  <span>{m.label}</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span className="text-base font-bold font-mono text-foreground">{m.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Health Monitor: Automações Travadas */}
      <Card className="border-rose-500/20 bg-rose-50/20 dark:bg-rose-950/5 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b dark:border-rose-500/10 border-rose-200">
          <div>
            <CardTitle className="text-xs font-semibold font-mono text-rose-500 dark:text-rose-300 uppercase tracking-wider">
              🚨 HEALTH MONITOR — AUTOMAÇÕES TRAVADAS
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Leads ativos em prospecção sem nenhuma atualização recente.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-rose-500/30 text-rose-500 dark:text-rose-400 font-mono text-[9px]">
            Total: {stuck24h.length + stuck48h.length + stuck72h.length}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* > 24h */}
            <div className="p-3.5 rounded-lg border border-border bg-card/50 dark:bg-zinc-950/40 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold font-mono text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  ⚠️ Inativo há &gt; 24h
                </span>
                <Badge variant="secondary" className="bg-yellow-950/30 text-yellow-350 border-yellow-800/20 py-0.5 text-[9px] font-mono">
                  {stuck24h.length}
                </Badge>
              </div>
              {stuck24h.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic font-mono">Nenhum lead travado.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {stuck24h.map((p) => {
                    const o = getOutreach(p);
                    return (
                      <li key={p.id} className="flex justify-between items-center text-[10px] font-mono border-b border-border pb-1">
                        <Link href={`/os/prospects/${p.id}`} className="text-foreground hover:text-primary font-semibold truncate max-w-[150px]">
                          {p.name}
                        </Link>
                        <span className="text-muted-foreground shrink-0">
                          {Math.round(getMsAgo(o!.updated_at) / msInHour)}h
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* > 48h */}
            <div className="p-3.5 rounded-lg border border-border bg-card/50 dark:bg-zinc-950/40 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold font-mono text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  ⚠️ Inativo há &gt; 48h
                </span>
                <Badge variant="secondary" className="bg-orange-950/30 text-orange-350 border-orange-850/20 py-0.5 text-[9px] font-mono">
                  {stuck48h.length}
                </Badge>
              </div>
              {stuck48h.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic font-mono">Nenhum lead travado.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {stuck48h.map((p) => {
                    const o = getOutreach(p);
                    return (
                      <li key={p.id} className="flex justify-between items-center text-[10px] font-mono border-b border-border pb-1">
                        <Link href={`/os/prospects/${p.id}`} className="text-foreground hover:text-primary font-semibold truncate max-w-[150px]">
                          {p.name}
                        </Link>
                        <span className="text-muted-foreground shrink-0">
                          {Math.round(getMsAgo(o!.updated_at) / msInHour)}h
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* > 72h */}
            <div className="p-3.5 rounded-lg border border-border bg-card/50 dark:bg-zinc-950/40 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  🚨 Inativo há &gt; 72h
                </span>
                <Badge variant="secondary" className="bg-rose-950/30 text-rose-350 border-rose-800/20 py-0.5 text-[9px] font-mono">
                  {stuck72h.length}
                </Badge>
              </div>
              {stuck72h.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic font-mono">Nenhum lead travado.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {stuck72h.map((p) => {
                    const o = getOutreach(p);
                    return (
                      <li key={p.id} className="flex justify-between items-center text-[10px] font-mono border-b border-border pb-1">
                        <Link href={`/os/prospects/${p.id}`} className="text-foreground hover:text-primary font-semibold truncate max-w-[150px]">
                          {p.name}
                        </Link>
                        <span className="text-rose-550 dark:text-rose-400 shrink-0 font-bold">
                          {Math.round(getMsAgo(o!.updated_at) / msInHour)}h
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Filters Form */}
      <Card className="border-border shadow-sm bg-card/30">
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, segmento ou ID de execução..."
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <CustomSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: "", label: "Todos Status" },
                ...Object.entries(statusConfig).map(([val, conf]) => ({
                  value: val,
                  label: conf.label
                }))
              ]}
              placeholder="Todos Status"
            />

            <CustomSelect
              value={selectedChannel}
              onChange={setSelectedChannel}
              options={[
                { value: "", label: "Todos Canais" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "instagram", label: "Instagram" },
                { value: "email", label: "Email" },
                { value: "manual", label: "Manual" }
              ]}
              placeholder="Todos Canais"
            />

            <Button
              variant="outline"
              onClick={() => {
                setInputQ("");
                setSelectedStatus("");
                setSelectedChannel("");
              }}
              className="cursor-pointer"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Split Views Columns (Mission Control Columns) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col, idx) => {
          const colLeads = filtered.filter((p) => {
            const o = getOutreach(p);
            const status = o?.status || "not_started";
            return col.statuses.includes(status);
          });
          const Icon = col.icon;

          return (
            <Card key={idx} className="border-border bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${col.color}`} />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">{col.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] bg-muted text-muted-foreground border-border py-0 h-5">
                  {colLeads.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 flex flex-col gap-2.5 max-h-[480px] overflow-y-auto scrollbar-none">
                {colLeads.length === 0 ? (
                  <EmptyState
                    title="Vazio"
                    description="Nenhum prospect neste estágio no momento."
                    icon={<SendIcon className="size-5 text-muted-foreground/30" />}
                    className="py-10 border-dashed border-border/40 bg-muted/5 rounded-lg"
                  />
                ) : (
                  colLeads.map((p) => {
                    const o = getOutreach(p);
                    const style = getStatusStyle(o?.status || "not_started");
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg border border-border bg-card/60 dark:bg-zinc-950/20 hover:border-primary/40 hover:bg-muted/50 dark:hover:bg-zinc-900/30 transition-all duration-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <Link
                             href={`/os/prospects/${p.id}`}
                            className="text-[11px] font-bold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {p.name}
                          </Link>
                          <Badge className={`text-[8px] font-mono px-1 py-0 h-4 border ${style.bg} ${style.text} ${style.border}`}>
                            {style.label}
                          </Badge>
                        </div>
                        
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">{p.segment || "Sem segmento"}</p>
                        
                        {o?.last_message_preview && (
                          <div className="mt-2 p-1.5 rounded bg-muted/50 dark:bg-white/5 border border-border text-[9px] text-primary/80 dark:text-purple-200/80 leading-relaxed italic">
                            &quot;{o.last_message_preview}&quot;
                          </div>
                        )}

                        {o?.meeting_title && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                            <CalendarIcon className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">Agendado: {o.meeting_title}</span>
                          </div>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between gap-1">
                          <span className="text-[8px] font-mono text-muted-foreground uppercase">
                            Canal: {o?.channel || "whatsapp"}
                          </span>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {o?.status && ["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status) ? (
                              <>
                                <button
                                  onClick={() => handlePause(p.id)}
                                  disabled={isPending}
                                  title="Pausar Automação"
                                  className="p-1 rounded bg-yellow-950/20 hover:bg-yellow-950/50 border border-yellow-500/20 text-yellow-400 transition-all cursor-pointer"
                                >
                                  <PauseIcon className="size-2.5" />
                                </button>
                                <button
                                  onClick={() => handleStop(p.id)}
                                  disabled={isPending}
                                  title="Parar Automação"
                                  className="p-1 rounded bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                >
                                  <StopCircleIcon className="size-2.5" />
                                </button>
                              </>
                            ) : o?.status && ["failed", "stopped", "paused", "disqualified", "not_started"].includes(o.status) ? (
                              <button
                                onClick={() => handleResume(p.id)}
                                disabled={isPending}
                                title="Iniciar/Retomar Automação"
                                className="p-1 rounded bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all flex items-center gap-0.5 text-[8px] font-mono px-1.5 cursor-pointer"
                              >
                                <PlayIcon className="size-2.5 shrink-0" />
                                <span>{selectedSource === "sandbox" ? "Testar" : "Retomar"}</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Leads List Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle>Listagem Detalhada da Automação</CardTitle>
          <CardDescription>
            Logs operacionais e controle em tempo real dos fluxos integrados.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {paginatedFiltered.length === 0 ? (
            <EmptyState
              title="Nenhum lead correspondente"
              description="Tente ajustar os filtros acima para encontrar registros de prospecção."
              icon={<SearchIcon className="size-5 text-muted-foreground/30" />}
              className="max-w-md mx-auto my-6"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-[11px]"
                  onClick={() => {
                    setQ("");
                    setSelectedStatus("");
                    setSelectedChannel("");
                  }}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <>
              <div className="relative overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-xs text-muted-foreground">
                  <thead className="bg-muted/50 font-mono uppercase tracking-wider text-[10px] border-b border-border">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-foreground">Prospect</th>
                      <th scope="col" className="px-4 py-3 text-foreground">Status</th>
                      <th scope="col" className="px-4 py-3 text-foreground text-center hidden sm:table-cell">Canal</th>
                      <th scope="col" className="px-4 py-3 text-foreground hidden md:table-cell">Último Retorno</th>
                      <th scope="col" className="px-4 py-3 text-foreground hidden lg:table-cell">ID de Execução</th>
                      <th scope="col" className="px-4 py-3 text-foreground text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedFiltered.map((p) => {
                      const o = getOutreach(p);
                      const style = getStatusStyle(o?.status || "not_started");
                      return (
                        <tr key={p.id} className="hover:bg-muted/40 transition-all">
                          <td className="px-4 py-3.5 font-medium text-foreground">
                            <Link href={`/os/prospects/${p.id}`} className="hover:text-primary transition-colors font-semibold">
                              {p.name}
                            </Link>
                            {p.segment && <span className="block text-[10px] text-muted-foreground">{p.segment}</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge className={`text-[9px] font-mono border ${style.bg} ${style.text} ${style.border}`}>
                              {style.label}
                            </Badge>
                            {o?.error_message && (
                              <span className="block text-[9px] text-rose-500 dark:text-rose-400 mt-1 max-w-[200px] truncate" title={o.error_message}>
                                Erro: {o.error_message}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center uppercase font-mono text-[10px] hidden sm:table-cell">
                            {o?.channel || "whatsapp"}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground font-mono hidden md:table-cell">
                            {o?.last_message_at ? new Date(o.last_message_at).toLocaleString("pt-BR") : "-"}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[10px] hidden lg:table-cell">
                            {o?.n8n_execution_id ? o.n8n_execution_id.substring(0, 12) + "..." : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {o?.status && ["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(o.status) ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePause(p.id)}
                                    disabled={isPending}
                                    className="h-7 px-2 font-mono text-[10px] cursor-pointer"
                                  >
                                    Pausar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStop(p.id)}
                                    disabled={isPending}
                                    className="h-7 px-2 font-mono text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-250 cursor-pointer"
                                  >
                                    Parar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResume(p.id)}
                                  disabled={isPending}
                                  className="h-7 px-2 font-mono text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 flex items-center gap-1 cursor-pointer"
                                >
                                  <PlayIcon className="size-3" />
                                  <span>{selectedSource === "sandbox" ? "Testar" : "Iniciar"}</span>
                                </Button>
                              )}
                              <Link
                                href={`/os/prospects/${p.id}`}
                                className="h-7 px-2 border border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-0.5 rounded-md text-[10px] font-mono font-medium transition-colors"
                              >
                                <span>Workspace</span>
                                <ChevronRightIcon className="size-3" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* DEV DRAWER MODAL */}
      {showDevDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setShowDevDrawer(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-4xl bg-sidebar border-l border-sidebar-border text-sidebar-foreground flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-sidebar-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold font-mono text-foreground uppercase tracking-widest">
                    🛠️ PAINEL DE DESENVOLVIMENTO (n8n logs)
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                    Logs técnicos de execução de Webhooks e lotes batch integrados.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowDevDrawer(false)}
                  className="h-9 w-9 shrink-0 cursor-pointer"
                  aria-label="Fechar"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-background/50">
                
                {/* Outreach Batches Log */}
                <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold font-mono text-primary dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        📦 LOTES DE AUTOMAÇÃO (BATCH TRACKING)
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Histórico recente de lotes enviados para o orquestrador n8n.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[9px]">
                      Total: {filteredBatches.length} Lotes
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Card list on mobile */}
                    <div className="md:hidden flex flex-col gap-3">
                      {filteredBatches.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                          Nenhum lote registrado neste ambiente.
                        </div>
                      ) : (
                        filteredBatches.map((batch) => {
                          const statusColors: Record<string, string> = {
                            created: "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/20",
                            dispatched: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/20",
                            partially_dispatched: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-950/20",
                            failed: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-450 dark:bg-rose-950/30",
                            completed: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400 dark:bg-zinc-950/20"
                          };

                          const statusLabels: Record<string, string> = {
                            created: "Criado",
                            dispatched: "Disparado",
                            partially_dispatched: "Parcial",
                            failed: "Falhou",
                            completed: "Concluído"
                          };

                          return (
                            <div key={batch.id} className="p-3.5 rounded-xl border border-border bg-card/60 dark:bg-zinc-950/20 flex flex-col gap-2.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(batch.created_at).toLocaleString("pt-BR")}
                                </span>
                                <Badge className={`text-[8px] font-mono px-1.5 py-0.5 border uppercase ${statusColors[batch.status] || "text-foreground bg-muted"}`}>
                                  {statusLabels[batch.status] || batch.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center text-xs gap-3">
                                <span className="font-bold text-foreground font-mono truncate" title={batch.batch_id}>{batch.batch_id}</span>
                                <span className="text-[10px] text-muted-foreground truncate" title={batch.created_by_email || ""}>{batch.created_by_email}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] bg-background/50 dark:bg-zinc-950/40 p-2 rounded-lg border border-border">
                                <div>
                                  <div className="text-muted-foreground text-[8px] uppercase">Req</div>
                                  <div className="text-foreground font-bold">{batch.total_requested}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-[8px] uppercase">Vál</div>
                                  <div className="text-emerald-500 font-bold">{batch.total_valid}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-[8px] uppercase">Env</div>
                                  <div className="text-cyan-500 font-bold">{batch.total_dispatched}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-[8px] uppercase">Ign</div>
                                  <div className="text-yellow-600 dark:text-yellow-500 font-bold">{batch.total_skipped}</div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-muted-foreground font-mono">Duração: {batch.duration_ms !== null ? `${batch.duration_ms}ms` : "-"}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[9px] font-mono px-2 cursor-pointer"
                                  onClick={() => setJsonView({ title: "Metadata do lote", value: batch.metadata })}
                                >
                                  Metadata
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block relative overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs text-muted-foreground font-mono">
                        <thead className="bg-muted/50 uppercase tracking-wider text-[9px] border-b border-border text-foreground">
                          <tr>
                            <th scope="col" className="px-4 py-2.5">Data/Hora</th>
                            <th scope="col" className="px-4 py-2.5">Batch ID</th>
                            <th scope="col" className="px-4 py-2.5">Status</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Solicitado</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Válido</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Enviado</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Ignorado</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Duração</th>
                            <th scope="col" className="px-4 py-2.5">Criador</th>
                            <th scope="col" className="px-4 py-2.5 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-[11px]">
                          {filteredBatches.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground italic">
                                Nenhum lote registrado neste ambiente.
                              </td>
                            </tr>
                          ) : (
                            filteredBatches.map((batch) => {
                              const statusColors: Record<string, string> = {
                                created: "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/20",
                                dispatched: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/20",
                                partially_dispatched: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-950/20",
                                failed: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-450 dark:bg-rose-950/30",
                                completed: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400 dark:bg-zinc-950/20"
                              };

                              const statusLabels: Record<string, string> = {
                                created: "Criado",
                                dispatched: "Disparado",
                                partially_dispatched: "Parcial",
                                failed: "Falhou",
                                completed: "Concluído"
                              };

                              return (
                                <tr key={batch.id} className="hover:bg-muted/40 transition-all text-xs">
                                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                                    {new Date(batch.created_at).toLocaleString("pt-BR")}
                                  </td>
                                  <td className="px-4 py-2.5 font-bold text-foreground max-w-[120px] truncate" title={batch.batch_id}>
                                    {batch.batch_id}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Badge className={`text-[8px] font-mono px-1.5 py-0.5 border uppercase ${statusColors[batch.status] || "text-foreground bg-muted"}`}>
                                      {statusLabels[batch.status] || batch.status}
                                    </Badge>
                                    {batch.error_message && (
                                      <span className="block text-[9px] text-rose-500 dark:text-rose-400 mt-1 max-w-[200px] truncate" title={batch.error_message}>
                                        {batch.error_message}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-foreground">{batch.total_requested}</td>
                                  <td className="px-4 py-2.5 text-center text-emerald-500 font-bold">{batch.total_valid}</td>
                                  <td className="px-4 py-2.5 text-center text-cyan-500 font-bold">{batch.total_dispatched}</td>
                                  <td className="px-4 py-2.5 text-center text-yellow-600 dark:text-yellow-500 font-bold">{batch.total_skipped}</td>
                                  <td className="px-4 py-2.5 text-center text-muted-foreground">
                                    {batch.duration_ms !== null ? `${batch.duration_ms}ms` : "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]" title={batch.created_by_email || ""}>
                                    {batch.created_by_email || "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[9px] font-mono cursor-pointer"
                                      onClick={() => setJsonView({ title: "Metadata do lote", value: batch.metadata })}
                                    >
                                      Metadata
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Webhook Audit Log */}
                <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold font-mono text-foreground uppercase tracking-wider">
                        🛠️ WEBHOOK AUDIT LOGS (PAINEL TÉCNICO)
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Histórico recente de requisições de webhook enviadas do n8n para depuração técnica.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[9px]">
                      Últimas 50 Execuções
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Card list on mobile */}
                    <div className="md:hidden flex flex-col gap-3">
                      {auditLogs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                          Nenhum webhook auditado ainda.
                        </div>
                      ) : (
                        auditLogs.map((log) => {
                          const statusColors: Record<string, string> = {
                            processed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/20",
                            duplicate_ignored: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-950/20",
                            invalid_secret: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-950/20",
                            invalid_json: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-350 dark:bg-rose-950/20",
                            missing_fields: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-950/20",
                            error: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-500 dark:bg-rose-950/30"
                          };

                          return (
                            <div key={log.id} className="p-3.5 rounded-xl border border-border bg-card/60 dark:bg-zinc-950/20 flex flex-col gap-2 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString("pt-BR")}
                                </span>
                                <Badge className={`text-[8px] font-mono px-1.5 py-0.5 border uppercase ${statusColors[log.status] || "text-foreground bg-muted"}`}>
                                  {log.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center text-xs gap-3">
                                <span className="font-bold text-foreground font-mono truncate" title={log.execution_id || ""}>
                                  Exec: {log.execution_id ? log.execution_id.substring(0, 12) + "..." : "-"}
                                </span>
                                <span className="text-foreground font-semibold text-[11px]">{log.event_type}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-muted-foreground">
                                  Secret: {log.secret_validated ? <span className="text-emerald-500 font-bold">SIM</span> : <span className="text-rose-500 font-bold">NÃO</span>}
                                  {" | "}
                                  Dup: {log.duplicate_ignored ? <span className="text-yellow-600 dark:text-yellow-500 font-bold">SIM</span> : <span className="text-muted-foreground">NÃO</span>}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[9px] font-mono px-2 cursor-pointer"
                                  onClick={() => setJsonView({ title: "Payload do log", value: log.payload })}
                                >
                                  Ver Json
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block relative overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs text-muted-foreground font-mono">
                        <thead className="bg-muted/50 uppercase tracking-wider text-[9px] border-b border-border text-foreground">
                          <tr>
                            <th scope="col" className="px-4 py-2.5">Data/Hora</th>
                            <th scope="col" className="px-4 py-2.5">Execution ID</th>
                            <th scope="col" className="px-4 py-2.5">Evento</th>
                            <th scope="col" className="px-4 py-2.5">Status Log</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Secret Validado</th>
                            <th scope="col" className="px-4 py-2.5 text-center">Duplicado</th>
                            <th scope="col" className="px-4 py-2.5 text-right">Payload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-[11px]">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">
                                Nenhum webhook auditado ainda.
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map((log) => {
                              const statusColors: Record<string, string> = {
                                processed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/20",
                                duplicate_ignored: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-950/20",
                                invalid_secret: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-450 dark:bg-rose-950/20",
                                invalid_json: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-350 dark:bg-rose-950/20",
                                missing_fields: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-950/20",
                                error: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-500 dark:bg-rose-950/30"
                              };

                              return (
                                <tr key={log.id} className="hover:bg-muted/40 transition-all text-xs">
                                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString("pt-BR")}
                                  </td>
                                  <td className="px-4 py-2.5 max-w-[120px] truncate" title={log.execution_id || ""}>
                                    {log.execution_id || "-"}
                                  </td>
                                  <td className="px-4 py-2.5 text-foreground">{log.event_type || "-"}</td>
                                  <td className="px-4 py-2.5">
                                    <Badge className={`text-[8px] font-mono px-1.5 py-0.5 border uppercase ${statusColors[log.status] || "text-foreground bg-muted"}`}>
                                      {log.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-bold">
                                    {log.secret_validated ? (
                                      <span className="text-emerald-550 dark:text-emerald-400">SIM</span>
                                    ) : (
                                      <span className="text-rose-500 dark:text-rose-400 font-extrabold">NÃO</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-bold">
                                    {log.duplicate_ignored ? (
                                      <span className="text-yellow-600 dark:text-yellow-400">SIM</span>
                                    ) : (
                                      <span className="text-muted-foreground font-normal">NÃO</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[9px] font-mono cursor-pointer"
                                      onClick={() => setJsonView({ title: "Payload do log", value: log.payload })}
                                    >
                                      Ver Json
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      )}

      <JsonViewerDialog
        open={jsonView !== null}
        onOpenChange={(open) => {
          if (!open) setJsonView(null);
        }}
        title={jsonView?.title ?? ""}
        value={jsonView?.value}
      />
    </div>
  );
}
