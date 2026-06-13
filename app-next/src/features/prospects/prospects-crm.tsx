"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  SendIcon, 
  AlertTriangleIcon,
  TargetIcon,
  PlusIcon,
  XIcon,
  ChevronDownIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProspectForm } from "./prospect-form";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import type { ProspectRow } from "./data";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import { statusLabel, temperatureLabel } from "@/lib/display-helpers";
import { updateProspectStatusAction, updateProspectTemperatureAction } from "./actions";
import { cn } from "@/lib/utils";

export function ProspectsCrm({
  prospects,
  error,
  isConfigured
}: {
  prospects: ProspectRow[];
  error: string | null;
  isConfigured: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search filter params
  const currentQ = searchParams.get("q") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentTemperature = searchParams.get("temperature") || "";
  const currentOutreach = searchParams.get("outreach") || "";
  const currentMine = searchParams.get("mine") || "";

  // Local state for debounced search text input
  const [prevQ, setPrevQ] = useState(currentQ);
  const [searchText, setSearchText] = useState(currentQ);
  
  if (currentQ !== prevQ) {
    setPrevQ(currentQ);
    setSearchText(currentQ);
  }
  
  // Local state for prospects (enabling Optimistic UI updates)
  const [prevProspects, setPrevProspects] = useState<ProspectRow[]>(prospects);
  const [localProspects, setLocalProspects] = useState<ProspectRow[]>(prospects);
  
  // Sync local prospects when prop list updates from server via render-phase sync
  if (prospects !== prevProspects) {
    setPrevProspects(prospects);
    setLocalProspects(prospects);
  }

  // Drawer visibility states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<ProspectRow | null>(null);



  // Handle drawer Escape keyboard triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCreateOpen) setIsCreateOpen(false);
        if (editingProspect) setEditingProspect(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateOpen, editingProspect]);

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Text search input debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== currentQ) {
        updateFilters({ q: searchText });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, currentQ, updateFilters]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [automationSource, setAutomationSource] = useState<"production" | "sandbox">("sandbox");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === localProspects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localProspects.map(p => p.id));
    }
  };

  // Optimistic UI Inline Actions with database commit and automatic reversion on error
  const handleUpdateStatusInline = async (prospectId: string, newStatus: string) => {
    const originalProspects = [...localProspects];
    
    // Update local state immediately
    setLocalProspects(prev =>
      prev.map(p => p.id === prospectId ? { ...p, status: newStatus as ProspectRow["status"] } : p)
    );

    try {
      await updateProspectStatusAction(prospectId, newStatus);
    } catch (err) {
      // Revert status on failure
      setLocalProspects(originalProspects);
      alert("Falha ao salvar status comercial inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateTemperatureInline = async (prospectId: string, newTemperature: string) => {
    const originalProspects = [...localProspects];
    
    // Update local state immediately
    setLocalProspects(prev =>
      prev.map(p => p.id === prospectId ? { ...p, temperature: newTemperature as ProspectRow["temperature"] } : p)
    );

    try {
      await updateProspectTemperatureAction(prospectId, newTemperature);
    } catch (err) {
      // Revert temperature on failure
      setLocalProspects(originalProspects);
      alert("Falha ao salvar temperatura inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Extract outreach records helper
  const getOutreach = (p: ProspectRow) => {
    return p.prospect_outreach?.[0] || null;
  };

  const hasPhone = (p: ProspectRow) => {
    const digits = (p.whatsapp || "").replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  };

  const activeStatuses = [
    "queued",
    "sent",
    "delivered",
    "waiting_reply",
    "replied",
    "negotiating",
    "meeting_scheduled"
  ];

  const selectedProspects = localProspects.filter(p => selectedIds.includes(p.id));
  
  const eligibleProspects = selectedProspects.filter(p => {
    const o = getOutreach(p);
    const validPhone = hasPhone(p);
    const notActive = !o || !activeStatuses.includes(o.status);
    return validPhone && notActive;
  });

  const noWhatsappCount = selectedProspects.filter(p => !hasPhone(p)).length;
  const alreadyActiveCount = selectedProspects.filter(p => {
    const o = getOutreach(p);
    return o && activeStatuses.includes(o.status);
  }).length;

  const handleSendBulk = async () => {
    if (eligibleProspects.length === 0) return;

    if (automationSource === "production" && eligibleProspects.length > 100) {
      alert(`Erro: O limite de lote para o ambiente de Produção é de 100 leads por vez (atualmente elegível: ${eligibleProspects.length} leads). Selecione menos registros.`);
      return;
    }

    if (automationSource === "sandbox" && eligibleProspects.length > 2) {
      alert(`Erro: O limite inicial do Sandbox SDR é de 2 leads por vez (atualmente elegível: ${eligibleProspects.length} leads). Selecione 1 ou 2 registros para validar sem WhatsApp real.`);
      return;
    }

    setIsDispatching(true);
    try {
      const response = await fetch("/api/outreach/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          prospect_ids: eligibleProspects.map(p => p.id),
          automation_source: automationSource
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      
      await response.json();
      alert(`${automationSource === "sandbox" ? "Teste SDR Sandbox" : "Automação"} iniciado com sucesso para ${eligibleProspects.length} leads.`);
      setSelectedIds([]);
      setIsConfirmOpen(false);
      router.refresh();
    } catch (err) {
      alert("Erro ao despachar automação: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDispatching(false);
    }
  };

  const isAnyFilterActive = currentQ || currentStatus || currentTemperature || currentOutreach || currentMine;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-950/40 text-purple-300 dark:text-purple-300 border-purple-800/40 dark:border-purple-800/40 border-purple-200 font-mono">
            Supabase CRM v1.5
          </Badge>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase bg-gradient-to-r dark:from-white dark:via-purple-100 dark:to-purple-400 from-slate-900 via-purple-800 to-purple-600 bg-clip-text text-transparent">
          PROSPECTS PIPELINE
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Gestão e prospecção ativa de leads e inteligência comercial integrados no Supabase.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Conexão pendente</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Lista de prospects</CardTitle>
            <CardDescription>
              Dados lidos da tabela `prospects` quando Supabase está configurado.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedIds.length} selecionados
                </span>
                <Button
                  size="sm"
                  className="bg-purple-950/40 text-purple-300 hover:bg-purple-950/60 border border-purple-500/20 font-mono flex items-center gap-1 cursor-pointer"
                  onClick={() => setIsConfirmOpen(true)}
                >
                  <SendIcon className="size-3" />
                  <span>{automationSource === "sandbox" ? "Testar SDR Sandbox" : "Enviar p/ Automação"}</span>
                </Button>
              </div>
            )}

            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white font-mono flex items-center gap-1 cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              <span>Novo Prospect</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Filters Form - Now fully reactive! */}
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px_120px_auto]">
            <Input 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)} 
              placeholder="Buscar por nome..." 
            />
            <CustomSelect
              value={currentStatus}
              onChange={(val) => updateFilters({ status: val })}
              options={[
                { value: "", label: "Todos status" },
                ...prospectStatuses.map((status) => ({
                  value: status,
                  label: statusLabel(status)
                }))
              ]}
              placeholder="Todos status"
            />
            <CustomSelect
              value={currentTemperature}
              onChange={(val) => updateFilters({ temperature: val })}
              options={[
                { value: "", label: "Todas temperaturas" },
                ...prospectTemperatures.map((temp) => ({
                  value: temp,
                  label: temperatureLabel(temp)
                }))
              ]}
              placeholder="Todas temperaturas"
            />
            <CustomSelect
              value={currentOutreach}
              onChange={(val) => updateFilters({ outreach: val })}
              options={[
                { value: "", label: "Automação: Todos" },
                { value: "ready", label: "Pronto para automação" },
                { value: "active", label: "Em automação ativa" },
                { value: "meeting", label: "Reunião marcada" },
                { value: "failed", label: "Falhou" }
              ]}
              placeholder="Automação: Todos"
            />
            <CustomSelect
              value={currentMine}
              onChange={(val) => updateFilters({ mine: val })}
              options={[
                { value: "", label: "Todos" },
                { value: "1", label: "Meus prospects" }
              ]}
              placeholder="Todos"
            />
            {isAnyFilterActive ? (
              <Button 
                type="button" 
                variant="outline" 
                className="h-8 cursor-pointer font-mono text-xs"
                onClick={() => {
                  setSearchText("");
                  router.push(pathname, { scroll: false });
                }}
              >
                Limpar
              </Button>
            ) : null}
          </div>

          {localProspects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/85 bg-card/25 p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 animate-in fade-in duration-300">
              <TargetIcon className="size-8 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">Nenhum prospect encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                Nenhum lead corresponde aos filtros definidos. Remova os filtros ou cadastre novos prospects.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Select All Row */}
              <div className="flex items-center gap-2 px-2 py-1 select-none text-xs font-mono text-muted-foreground border-b border-white/5 pb-2">
                <CustomCheckbox
                  checked={localProspects.length > 0 && selectedIds.length === localProspects.length}
                  onChange={toggleSelectAll}
                />
                <span>Selecionar todos nesta visualização</span>
              </div>

              {localProspects.map((prospect) => {
                const isSelected = selectedIds.includes(prospect.id);
                const o = getOutreach(prospect);
                const hasPhoneNum = hasPhone(prospect);

                return (
                  <div
                    key={prospect.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 shadow-sm ${
                      isSelected 
                        ? "border-primary/40 dark:border-purple-500/40 bg-primary/5 dark:bg-purple-950/5" 
                        : "border-border dark:border-white/5 bg-gradient-to-r dark:from-zinc-950/40 dark:to-zinc-900/20 from-slate-100/40 to-slate-50/20 hover:from-purple-50/20 dark:hover:from-purple-950/10 hover:to-white dark:hover:to-zinc-900/40 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-purple-950/5"
                    }`}
                  >
                    {/* Checkbox & Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <CustomCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(prospect.id)}
                        />
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/os/prospects/${prospect.id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {prospect.name}
                          </Link>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Inline status switcher - Optimistic UI */}
                            <div className="relative group/status flex items-center">
                              <select
                                value={prospect.status}
                                onChange={(e) => handleUpdateStatusInline(prospect.id, e.target.value)}
                                className="text-[10px] uppercase font-mono bg-primary/10 dark:bg-purple-950/20 text-primary dark:text-purple-300 border border-primary/20 dark:border-purple-500/20 py-0 px-2.5 h-5 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-primary/20 dark:hover:bg-purple-950/40 transition-colors cursor-pointer appearance-none pr-5.5 font-bold"
                              >
                                {prospectStatuses.map((st) => (
                                  <option key={st} value={st} className="bg-popover text-popover-foreground">
                                    {statusLabel(st)}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute right-1.5 flex items-center text-primary dark:text-purple-350 opacity-60">
                                <ChevronDownIcon className="h-3 w-3" />
                              </div>
                            </div>

                            {/* Inline temperature switcher - Optimistic UI */}
                            <div className="relative group/temp flex items-center">
                              <select
                                value={prospect.temperature}
                                onChange={(e) => handleUpdateTemperatureInline(prospect.id, e.target.value)}
                                className={cn(
                                  "text-[10px] uppercase font-mono py-0 px-2.5 h-5 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-opacity-20 transition-colors cursor-pointer appearance-none pr-5.5 font-bold border",
                                  prospect.temperature === "hot"
                                    ? "bg-rose-500/10 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300 border-rose-500/20"
                                    : prospect.temperature === "warm"
                                    ? "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-300 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 border-blue-500/20"
                                )}
                              >
                                {prospectTemperatures.map((temp) => (
                                  <option key={temp} value={temp} className="bg-popover text-popover-foreground">
                                    {temperatureLabel(temp)}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute right-1.5 flex items-center opacity-65">
                                <ChevronDownIcon className={cn("h-3 w-3", 
                                  prospect.temperature === "hot" ? "text-rose-450 dark:text-rose-400" :
                                  prospect.temperature === "warm" ? "text-amber-500 dark:text-amber-400" :
                                  "text-blue-500 dark:text-blue-400"
                                )} />
                              </div>
                            </div>

                            {o && (
                              <Badge variant="outline" className="text-[9px] font-mono bg-indigo-500/10 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/20 py-0 px-1.5 h-5 uppercase">
                                Automação: {o.status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                          {prospect.segment ? (
                            <span className="font-medium text-primary dark:text-purple-200/60">{prospect.segment}</span>
                          ) : null}
                          {prospect.segment && (prospect.city || prospect.state) ? (
                            <span className="text-muted-foreground/30">•</span>
                          ) : null}
                          {prospect.city || prospect.state ? (
                            <span>{[prospect.city, prospect.state].filter(Boolean).join(" / ")}</span>
                          ) : null}
                          {(prospect.segment || prospect.city || prospect.state) && prospect.source ? (
                            <span className="text-muted-foreground/30">•</span>
                          ) : null}
                          {prospect.source ? (
                            <span className="bg-muted border border-border px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                              {prospect.source}
                            </span>
                          ) : null}
                          {!hasPhoneNum && (
                            <>
                              <span className="text-muted-foreground/30">•</span>
                              <span className="text-rose-500 dark:text-rose-400 font-mono text-[10px] flex items-center gap-0.5">
                                <AlertTriangleIcon className="size-3" /> Sem WhatsApp
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions - Edit triggers Drawer! */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/os/prospects/${prospect.id}`} />}
                        className="cursor-pointer transition-all hover:bg-primary/10 font-mono text-xs"
                      >
                        Abrir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProspect(prospect)}
                        className="cursor-pointer transition-all font-mono text-xs"
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Drawer Component (Right/Bottom Sheet) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />
          <div className="fixed md:inset-y-0 md:right-0 inset-x-0 bottom-0 z-50 flex md:w-auto w-full max-h-[95vh] md:max-h-full">
            <div className="w-full md:w-screen md:max-w-lg bg-card border-t md:border-t-0 md:border-l border-border text-foreground flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200 ease-out rounded-t-xl md:rounded-t-none">
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-widest">Novo Prospect</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Cadastre um novo lead diretamente no pipeline do CRM.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 w-8 shrink-0 cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-background/10">
                <ProspectForm
                  isConfigured={isConfigured}
                  flat
                  onSuccess={() => {
                    setIsCreateOpen(false);
                    router.refresh();
                  }}
                  onCancel={() => setIsCreateOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drawer Component (Right/Bottom Sheet) */}
      {editingProspect && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setEditingProspect(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />
          <div className="fixed md:inset-y-0 md:right-0 inset-x-0 bottom-0 z-50 flex md:w-auto w-full max-h-[95vh] md:max-h-full">
            <div className="w-full md:w-screen md:max-w-lg bg-card border-t md:border-t-0 md:border-l border-border text-foreground flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200 ease-out rounded-t-xl md:rounded-t-none">
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-widest">Editar Prospect</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Atualize os dados comerciais e de prospecção do lead.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingProspect(null)}
                  className="h-8 w-8 shrink-0 cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-background/10">
                <ProspectForm
                  prospect={editingProspect}
                  isConfigured={isConfigured}
                  flat
                  onSuccess={() => {
                    setEditingProspect(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingProspect(null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl animate-in scale-in duration-200">
            <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">Confirmar Envio Outreach</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
              Você está prestes a despachar prospects selecionados para o fluxo n8n. O ambiente Sandbox não envia WhatsApp real.
            </p>
            
            <div className="mt-4 p-3.5 rounded-lg bg-zinc-950/40 border border-white/5 flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between text-muted-foreground border-b border-white/5 pb-2">
                <span>Leads Selecionados:</span>
                <span className="text-white font-bold">{selectedIds.length}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Elegíveis para Envio:</span>
                <span className="font-bold">{eligibleProspects.length}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Já em Automação (Ignorados):</span>
                <span className="font-bold">{alreadyActiveCount}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Sem WhatsApp Válido (Ignorados):</span>
                <span className="font-bold">{noWhatsappCount}</span>
              </div>
              {automationSource === "sandbox" ? (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-950/20 p-2 text-yellow-300 leading-normal">
                  Sandbox SDR Mock: limitado a 2 leads nesta validação. Não usa IA paga, Evolution API ou WhatsApp real.
                </div>
              ) : null}
            </div>
            
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono text-muted-foreground uppercase">Ambiente de Automação</label>
              <select
                value={automationSource}
                onChange={(e) => setAutomationSource(e.target.value as "production" | "sandbox")}
                className="w-full h-9 rounded-lg border border-white/10 bg-zinc-950 px-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="production">🚀 Produção (Real)</option>
                <option value="sandbox">🛠️ Sandbox / Homologação (Mock, sem WhatsApp real)</option>
              </select>
            </div>
            
            <div className="mt-5 flex gap-2.5 justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
              <Button
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                size="sm"
                disabled={eligibleProspects.length === 0 || isDispatching}
                onClick={handleSendBulk}
              >
                {isDispatching ? "Enviando..." : automationSource === "sandbox" ? `Testar ${eligibleProspects.length} Lead(s)` : `Enviar ${eligibleProspects.length} Leads`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
