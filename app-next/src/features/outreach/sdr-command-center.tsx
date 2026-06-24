"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  HandIcon,
  MessageSquareIcon,
  RadioTowerIcon,
  SendIcon,
  ShieldCheckIcon,
  UsersIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProspectRow } from "@/features/prospects/data";
import type { OutreachBatchRow, WebhookAuditLogRow } from "@/types/outreach";
import { Pagination } from "@/components/ui/pagination";
import {
  buildConversationInbox,
  buildMeetingDetections,
  buildSdrBatchRows,
  buildSdrDashboardMetrics,
  buildTimeline,
  createHumanTakeoverEvent,
  filterSdrLeads,
  getCurrentOutreach,
  getEligibleLeads,
  getProspectCity,
  getProspectCompany,
  getSdrHealthMonitor,
  isEligibleForSdrAutomation,
  productionDispatchAllowed,
  type SdrFilters
} from "./sdr-command-center-utils";

type SdrCommandCenterProps = {
  prospects: ProspectRow[];
  batches: OutreachBatchRow[];
  auditLogs: WebhookAuditLogRow[];
  error?: string | null;
  isConfigured?: boolean;
  operatorEmail?: string | null;
};

type TabKey = "leads" | "conversas" | "timeline" | "reunioes" | "lotes" | "monitor";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "leads", label: "Leads" },
  { key: "conversas", label: "Conversas" },
  { key: "timeline", label: "Timeline" },
  { key: "reunioes", label: "Reuniões Detectadas" },
  { key: "lotes", label: "Lotes" },
  { key: "monitor", label: "Health Monitor" }
];

const metricCards = [
  { key: "eligible", label: "Leads elegíveis", icon: UsersIcon },
  { key: "inAutomation", label: "Em automação", icon: RadioTowerIcon },
  { key: "activeConversations", label: "Conversas ativas", icon: MessageSquareIcon },
  { key: "waitingReply", label: "Aguardando resposta", icon: ClockIcon },
  { key: "negotiations", label: "Negociações", icon: HandIcon },
  { key: "meetingsScheduled", label: "Reuniões marcadas", icon: CalendarCheckIcon },
  { key: "optOut", label: "Opt-Out", icon: ShieldCheckIcon },
  { key: "failures", label: "Falhas", icon: AlertTriangleIcon },
  { key: "activeBatches", label: "Lotes ativos", icon: SendIcon }
] as const;

export function SdrCommandCenter({
  prospects,
  batches,
  auditLogs,
  error,
  isConfigured = true,
  operatorEmail
}: SdrCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const [filters, setFilters] = useState<SdrFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [takeovers, setTakeovers] = useState<ReturnType<typeof createHumanTakeoverEvent>[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [prevFilters, setPrevFilters] = useState<SdrFilters>(filters);
  const [prevActiveTab, setPrevActiveTab] = useState<TabKey>(activeTab);

  if (filters !== prevFilters || activeTab !== prevActiveTab) {
    setPrevFilters(filters);
    setPrevActiveTab(activeTab);
    setCurrentPage(1);
  }

  const filteredProspects = useMemo(() => filterSdrLeads(prospects, filters), [prospects, filters]);
  const eligibleProspects = useMemo(() => getEligibleLeads(filteredProspects), [filteredProspects]);
  const metrics = useMemo(() => buildSdrDashboardMetrics(prospects, batches), [prospects, batches]);
  const conversations = useMemo(() => buildConversationInbox(prospects), [prospects]);
  const meetings = useMemo(() => buildMeetingDetections(prospects), [prospects]);
  const batchRows = useMemo(() => buildSdrBatchRows(batches), [batches]);
  const health = useMemo(() => getSdrHealthMonitor(prospects, auditLogs), [prospects, auditLogs]);
  const selectedLeads = eligibleProspects.filter((prospect) => selectedIds.includes(prospect.id || ""));
  const productionBlocked = !productionDispatchAllowed();

  const itemsPerPage = 10;
  
  // Leads pagination
  const totalLeads = filteredProspects.length;
  const totalLeadsPages = Math.ceil(totalLeads / itemsPerPage);
  const paginatedProspects = useMemo(() => {
    return filteredProspects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredProspects, currentPage]);

  // Conversas pagination
  const totalConversations = conversations.length;
  const totalConversationsPages = Math.ceil(totalConversations / itemsPerPage);
  const paginatedConversations = useMemo(() => {
    return conversations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [conversations, currentPage]);

  // Lotes pagination
  const totalBatches = batchRows.length;
  const totalBatchesPages = Math.ceil(totalBatches / itemsPerPage);
  const paginatedBatches = useMemo(() => {
    return batchRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [batchRows, currentPage]);

  const updateFilter = (key: keyof SdrFilters, value: string | boolean | undefined) => {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  };

  const toggleLead = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleTakeover = (prospectId: string) => {
    setTakeovers((current) => [
      createHumanTakeoverEvent({ prospectId, operatorEmail }),
      ...current
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">SDR Command Center</h1>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Sandbox somente</Badge>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">Production bloqueada</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Operação SDR conectada ao Outreach Center existente. Modo simulado: sem OpenAI, sem Evolution API, sem WhatsApp real e sem alteração em n8n.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 text-emerald-400" />
          human_takeover e dispatch em sandbox controlado
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!isConfigured ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Supabase não configurado. O Command Center permanece visual e sem disparos externos.
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.key} size="sm" className="rounded-lg">
              <CardContent className="flex min-h-24 flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <Icon className="size-4 text-primary" />
                </div>
                <strong className="text-2xl font-semibold text-foreground">{metrics[metric.key]}</strong>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Input placeholder="Cidade" value={filters.city || ""} onChange={(event) => updateFilter("city", event.target.value)} />
            <Input placeholder="Segmento" value={filters.segment || ""} onChange={(event) => updateFilter("segment", event.target.value)} />
            <CustomSelect
              value={filters.temperature || ""}
              onChange={(value) => updateFilter("temperature", value)}
              options={[
                { value: "", label: "Temperatura" },
                { value: "hot", label: "Hot" },
                { value: "warm", label: "Warm" },
                { value: "cold", label: "Cold" }
              ]}
              placeholder="Temperatura"
            />
            <CustomSelect
              value={filters.automationStatus || ""}
              onChange={(value) => updateFilter("automationStatus", value)}
              options={[
                { value: "", label: "Status automação" },
                { value: "not_started", label: "Não iniciado" },
                { value: "queued", label: "Queued" },
                { value: "waiting_reply", label: "Waiting reply" },
                { value: "negotiating", label: "Negotiating" },
                { value: "meeting_scheduled", label: "Meeting scheduled" },
                { value: "failed", label: "Failed" },
                { value: "opt_out", label: "Opt-out" }
              ]}
              placeholder="Status automação"
            />
            <Input placeholder="CRM status" value={filters.crmStatus || ""} onChange={(event) => updateFilter("crmStatus", event.target.value)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[
              ["meetingScheduled", "Reunião marcada"],
              ["optOut", "Opt-out"],
              ["validPhone", "Telefone válido"],
              ["waitingReply", "Aguardando resposta"],
              ["failure", "Falha"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-muted-foreground cursor-pointer hover:bg-muted/35 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(filters[key as keyof SdrFilters])}
                  onChange={(event) => updateFilter(key as keyof SdrFilters, event.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-white/10 accent-purple-600 cursor-pointer"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Seleção em lote</div>
              <div className="text-xs text-muted-foreground">{selectedLeads.length} leads elegíveis selecionados</div>
            </div>
            <Badge variant="outline">sandbox</Badge>
          </div>
          <Button className="mt-4 w-full" disabled={selectedLeads.length === 0} onClick={() => setSummaryVisible(true)}>
            <SendIcon data-icon="inline-start" className="size-4" />
            Enviar para Automação SDR
          </Button>
          {summaryVisible ? (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
              Resumo sandbox: {selectedLeads.length} elegíveis, 0 enviados em produção, confirmação local sem chamada externa.
              {productionBlocked ? <div className="mt-1 font-semibold">Production bloqueada por design.</div> : null}
            </div>
          ) : null}
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-lg border border-border bg-card/40 p-2">
        {tabs.map((tab) => (
          <Button key={tab.key} variant={activeTab === tab.key ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </Button>
        ))}
      </nav>

      {activeTab === "leads" ? (
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[40px_1.2fr_1fr_0.8fr_0.8fr_1fr] gap-3 bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span />
            <span>Empresa</span>
            <span>Cidade</span>
            <span>Temperatura</span>
            <span>Status</span>
            <span>Elegibilidade</span>
          </div>
          <div className="divide-y divide-border">
            {paginatedProspects.length === 0 ? (
              <EmptyState
                title="Sem leads encontrados"
                description="Altere os filtros de busca para encontrar outros leads."
                className="border-none rounded-none p-8"
              />
            ) : (
              paginatedProspects.map((prospect) => {
                const id = prospect.id || "";
                const outreach = getCurrentOutreach(prospect);
                const eligibility = isEligibleForSdrAutomation(prospect);
                return (
                  <div key={id || getProspectCompany(prospect)} className="grid grid-cols-[40px_1.2fr_1fr_0.8fr_0.8fr_1fr] gap-3 px-3 py-3 text-sm items-center">
                    <div className="flex h-5 w-5 items-center justify-center self-center justify-self-center shrink-0">
                      <input
                        type="checkbox"
                        disabled={!eligibility.eligible}
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleLead(id)}
                        aria-label={`Selecionar ${getProspectCompany(prospect)}`}
                        className="h-4 w-4 shrink-0 rounded border-white/10 accent-purple-600 cursor-pointer"
                      />
                    </div>
                    <span className="font-medium text-foreground">{getProspectCompany(prospect)}</span>
                    <span className="text-muted-foreground">{getProspectCity(prospect) || "-"}</span>
                    <span className="text-muted-foreground">{prospect.temperature || "-"}</span>
                    <span><Badge variant="outline">{outreach?.status || "not_started"}</Badge></span>
                    <span className={eligibility.eligible ? "text-emerald-300" : "text-muted-foreground"}>{eligibility.reason}</span>
                  </div>
                );
              })
            )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalLeadsPages} totalItems={totalLeads} onPageChange={setCurrentPage} className="p-3 border-t border-border" />
        </section>
      ) : null}

      {activeTab === "conversas" ? (
        <section className="grid gap-3">
          {paginatedConversations.length === 0 ? (
            <EmptyState
              title="Sem conversas ativas"
              description="Nenhuma conversa simulada ou real foi iniciada com os leads."
              className="p-8"
            />
          ) : (
            <>
              {paginatedConversations.map((conversation) => (
                <div key={`${conversation.prospect_id}-${conversation.datetime || "sem-data"}`} className="grid gap-2 rounded-lg border border-border bg-card/40 p-4 md:grid-cols-[1fr_160px_160px]">
                  <div>
                    <div className="font-medium text-foreground">{conversation.company}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{conversation.message || "Mensagem ainda não registrada"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>{conversation.origin}</div>
                    <div>{conversation.datetime || "-"}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline">{conversation.status}</Badge>
                    <span className="text-xs text-muted-foreground">n8n_execution_id: {conversation.n8n_execution_id || "-"}</span>
                    <Button variant="outline" size="sm" onClick={() => handleTakeover(conversation.prospect_id)}>
                      <HandIcon data-icon="inline-start" className="size-4" />
                      Assumir Conversa
                    </Button>
                  </div>
                </div>
              ))}
              <Pagination currentPage={currentPage} totalPages={totalConversationsPages} totalItems={totalConversations} onPageChange={setCurrentPage} />
            </>
          )}
          {takeovers.map((event) => (
            <div key={`${event.prospect_id}-${event.created_at}`} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Operador assumiu conversa: {event.operator_email}. Automação marcada para pausa imediata.
            </div>
          ))}
        </section>
      ) : null}

      {activeTab === "timeline" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredProspects.length === 0 ? (
            <EmptyState
              title="Sem histórico"
              description="Nenhum lead encontrado para exibir a timeline."
              className="lg:col-span-2 p-8"
            />
          ) : (
            filteredProspects.slice(0, 8).map((prospect) => (
              <div key={prospect.id || getProspectCompany(prospect)} className="rounded-lg border border-border bg-card/40 p-4">
                <div className="mb-3 font-medium text-foreground">{getProspectCompany(prospect)}</div>
                <div className="space-y-2">
                  {buildTimeline(prospect).map((entry, index) => (
                    <div key={`${entry.status}-${entry.created_at}-${index}`} className="flex gap-3 text-sm">
                      <CheckCircle2Icon className="mt-0.5 size-4 text-primary" />
                      <div>
                        <div className="text-foreground">{entry.status}</div>
                        <div className="text-xs text-muted-foreground">{entry.event_type} · {entry.created_at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {activeTab === "reunioes" ? (
        <section className="grid gap-3">
          {meetings.length === 0 ? (
            <EmptyState
              title="Sem reuniões detectadas"
              description="Nenhum agendamento foi identificado no histórico de conversas do SDR."
              className="p-8"
            />
          ) : (
            meetings.map((meeting) => (
              <div key={meeting.prospect_id} className="grid gap-3 rounded-lg border border-border bg-card/40 p-4 md:grid-cols-[1fr_180px_160px]">
                <div>
                  <div className="font-medium text-foreground">{meeting.company}</div>
                  <div className="text-sm text-muted-foreground">Origem: {meeting.origin}</div>
                </div>
                <div className="text-sm text-muted-foreground">{meeting.suggested_date || "Data sugerida pendente"}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled title="Confirmação de reunião em breve">Aprovar</Button>
                  <Button size="sm" variant="outline" disabled title="Confirmação de reunião em breve">Rejeitar</Button>
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {activeTab === "lotes" ? (
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[1fr_120px_120px_120px_120px_1fr] gap-3 bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>batch_id</span>
            <span>Status</span>
            <span>Ambiente</span>
            <span>Enviados</span>
            <span>Pulados</span>
            <span>Operador</span>
          </div>
          {paginatedBatches.length === 0 ? (
            <EmptyState
              title="Sem lotes de envio"
              description="Nenhum lote de prospecção foi disparado até o momento."
              className="border-none rounded-none p-8"
            />
          ) : (
            <>
              {paginatedBatches.map((batch) => (
                <div key={batch.batch_id} className="grid grid-cols-[1fr_120px_120px_120px_120px_1fr] gap-3 border-t border-border px-3 py-3 text-sm">
                  <span className="font-mono text-xs text-foreground">{batch.batch_id}</span>
                  <span>{batch.status}</span>
                  <span>{batch.environment}</span>
                  <span>{batch.total_dispatched}/{batch.total_requested}</span>
                  <span>{batch.total_skipped}</span>
                  <span>{batch.operator}</span>
                </div>
              ))}
              <Pagination currentPage={currentPage} totalPages={totalBatchesPages} totalItems={totalBatches} onPageChange={setCurrentPage} className="p-3 border-t border-border" />
            </>
          )}
        </section>
      ) : null}

      {activeTab === "monitor" ? (
        <section className="grid gap-3 md:grid-cols-5">
          {[
            ["Stuck 24h", health.stuck24h],
            ["Stuck 48h", health.stuck48h],
            ["Stuck 72h", health.stuck72h],
            ["Dead letters", health.deadLetters],
            ["Falhas recentes", health.recentFailures]
          ].map(([label, value]) => (
            <Card key={label} size="sm" className="rounded-lg">
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>Monitoramento local a partir de logs existentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground">{value}</div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
