"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { XIcon, ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";
import {
  createBacklogItemAction,
  createBugAction,
  createIncidentAction,
  createRoadmapItemAction,
  createTechnicalDecisionAction,
  updateBugAction,
  archiveBugAction,
  updateIncidentAction,
  archiveIncidentAction,
  updateBacklogItemAction,
  archiveBacklogItemAction,
  updateRoadmapItemAction,
  archiveRoadmapItemAction,
  updateTechnicalDecisionAction,
  archiveTechnicalDecisionAction,
  updateBugStatusActionInline,
  updateBugPriorityActionInline,
  updateBugSeverityActionInline,
  updateIncidentStatusActionInline,
  updateIncidentSeverityActionInline
} from "./actions";
import type {
  ProjectRow,
  ClientRow,
  CompanyRow,
  ProfileRow,
  TechBacklogRow,
  TechBugRow,
  TechIncidentRow,
  TechRoadmapRow,
  TechnicalDecisionRow
} from "./data";
import {
  backlogTypes,
  bugStatuses,
  incidentStatuses,
  priorityLevels,
  roadmapStatuses,
  severityLevels,
  technicalDecisionStatuses
} from "./tech-helpers";

function projectName(projects: ProjectRow[], id: string | null) {
  return projects.find((p) => p.id === id)?.name || "-";
}

function clientName(clients: ClientRow[], companies: CompanyRow[], id: string | null) {
  if (!id) return "-";
  const client = clients.find((c) => c.id === id);
  if (!client) return "-";
  const company = companies.find((comp) => comp.id === client.company_id);
  return company?.name || client.main_contact_name || client.id;
}



function profileName(profiles: ProfileRow[], id: string | null) {
  const profile = profiles.find((p) => p.id === id);
  return profile?.full_name || profile?.email || "-";
}

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function RightDrawer({ isOpen, onClose, title, subtitle, children }: RightDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />
      <div className="fixed md:inset-y-0 md:right-0 inset-x-0 bottom-0 z-50 flex md:w-auto w-full max-h-[95vh] md:max-h-full">
        <div className="w-full md:w-screen md:max-w-lg bg-card border-t md:border-t-0 md:border-l border-border text-foreground flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200 ease-out rounded-t-xl md:rounded-t-none">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-widest">{title}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{subtitle}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0 cursor-pointer"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-background/10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BugsPageView({
  bugs,
  projects,
  clients = [],
  companies = [],
  profiles = [],
  error
}: {
  bugs: TechBugRow[];
  projects: ProjectRow[];
  clients?: ClientRow[];
  companies?: CompanyRow[];
  profiles?: ProfileRow[];
  error: string | null;
}) {
  const [editingBug, setEditingBug] = useState<TechBugRow | null>(null);
  
  // Local state for bugs to support Optimistic UI
  const [prevBugs, setPrevBugs] = useState<TechBugRow[]>(bugs);
  const [localBugs, setLocalBugs] = useState<TechBugRow[]>(bugs);
  if (bugs !== prevBugs) {
    setPrevBugs(bugs);
    setLocalBugs(bugs);
  }

  const handleUpdate = async (formData: FormData) => {
    if (!editingBug) return;
    try {
      await updateBugAction(editingBug.id, formData);
      setEditingBug(null);
    } catch (err) {
      alert("Erro ao salvar bug: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateBugStatus = async (id: string, newStatus: string) => {
    const originalBugs = [...localBugs];
    setLocalBugs(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as TechBugRow["status"] } : b));
    try {
      await updateBugStatusActionInline(id, newStatus);
    } catch (err) {
      setLocalBugs(originalBugs);
      alert("Falha ao salvar status inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateBugPriority = async (id: string, newPriority: string) => {
    const originalBugs = [...localBugs];
    setLocalBugs(prev => prev.map(b => b.id === id ? { ...b, priority: newPriority as TechBugRow["priority"] } : b));
    try {
      await updateBugPriorityActionInline(id, newPriority);
    } catch (err) {
      setLocalBugs(originalBugs);
      alert("Falha ao salvar prioridade inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateBugSeverity = async (id: string, newSeverity: string) => {
    const originalBugs = [...localBugs];
    setLocalBugs(prev => prev.map(b => b.id === id ? { ...b, severity: newSeverity as TechBugRow["severity"] } : b));
    try {
      await updateBugSeverityActionInline(id, newSeverity);
    } catch (err) {
      setLocalBugs(originalBugs);
      alert("Falha ao salvar severidade inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TechList title="Bugs" description="Controle de falhas técnicas e regressões." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar bug</CardTitle></CardHeader>
        <CardContent>
          <form action={createBugAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Título" required className="md:col-span-2" />
            <select name="severity" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              {severityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              {priorityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2 focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select name="client_id" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
            </select>

            <select name="company_id" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem empresa</option>
              {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>

            <select name="assigned_to" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem atribuição</option>
              {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
            </select>

            <Button type="submit" className="cursor-pointer">Criar bug</Button>
          </form>
        </CardContent>
      </Card>

      <FilterBar status={bugStatuses} extraName="severity" extraOptions={severityLevels} />

      <Card>
        <CardHeader>
          <CardTitle>Bugs Registrados</CardTitle>
          <CardDescription>{localBugs.length} bug(s) listado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {localBugs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bug encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Vinculos</TableHead>
                    <TableHead>Atribuído a</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localBugs.map((bug) => (
                    <TableRow key={bug.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{bug.title}</div>
                        {bug.description ? <div className="text-xs text-muted-foreground mt-0.5">{bug.description}</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="relative group/status flex items-center">
                          <select
                            value={bug.status}
                            onChange={(e) => handleUpdateBugStatus(bug.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider bg-opacity-20 border py-0.5 px-2.5 h-6 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-opacity-30 transition-colors cursor-pointer appearance-none pr-5.5 font-bold",
                              bug.status === "open"
                                ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                                : bug.status === "in_progress"
                                ? "bg-blue-950/20 text-blue-400 border-blue-500/20"
                                : bug.status === "fixed"
                                ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20"
                                : "bg-purple-950/20 text-purple-400 border-purple-500/20"
                            )}
                          >
                            {bugStatuses.map((st) => (
                              <option key={st} value={st} className="bg-popover text-popover-foreground">{st}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-1.5 flex items-center opacity-60">
                            <ChevronDownIcon className={cn("h-3 w-3",
                              bug.status === "open" ? "text-zinc-500" :
                              bug.status === "in_progress" ? "text-blue-400" :
                              bug.status === "fixed" ? "text-emerald-400" :
                              "text-purple-400"
                            )} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative group/severity flex items-center">
                          <select
                            value={bug.severity}
                            onChange={(e) => handleUpdateBugSeverity(bug.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider bg-opacity-20 border py-0.5 px-2.5 h-6 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-opacity-30 transition-colors cursor-pointer appearance-none pr-5.5 font-bold",
                              bug.severity === "critical"
                                ? "bg-rose-950/30 text-rose-400 border-rose-500/30"
                                : bug.severity === "high"
                                ? "bg-amber-950/30 text-amber-400 border-amber-500/30"
                                : bug.severity === "medium"
                                ? "bg-blue-950/20 text-blue-400 border-blue-500/20"
                                : "bg-zinc-900/40 text-zinc-400 border-zinc-800/20"
                            )}
                          >
                            {severityLevels.map((sv) => (
                              <option key={sv} value={sv} className="bg-popover text-popover-foreground">{sv}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-1.5 flex items-center opacity-60">
                            <ChevronDownIcon className={cn("h-3 w-3",
                              bug.severity === "critical" ? "text-rose-400" :
                              bug.severity === "high" ? "text-amber-400" :
                              bug.severity === "medium" ? "text-blue-400" :
                              "text-zinc-400"
                            )} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative group/priority flex items-center">
                          <select
                            value={bug.priority}
                            onChange={(e) => handleUpdateBugPriority(bug.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider bg-opacity-20 border py-0.5 px-2.5 h-6 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-opacity-30 transition-colors cursor-pointer appearance-none pr-5.5 font-bold",
                              bug.priority === "urgent"
                                ? "bg-rose-950/30 text-rose-400 border-rose-500/20"
                                : bug.priority === "high"
                                ? "bg-amber-950/20 text-amber-400 border-amber-500/20"
                                : bug.priority === "medium"
                                ? "bg-blue-950/20 text-blue-400 border-blue-500/20"
                                : "bg-zinc-900/40 text-zinc-400 border-zinc-80"
                            )}
                          >
                            {priorityLevels.map((pr) => (
                              <option key={pr} value={pr} className="bg-popover text-popover-foreground">{pr}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-1.5 flex items-center opacity-60">
                            <ChevronDownIcon className={cn("h-3 w-3",
                              bug.priority === "urgent" ? "text-rose-400" :
                              bug.priority === "high" ? "text-amber-400" :
                              bug.priority === "medium" ? "text-blue-400" :
                              "text-zinc-400"
                            )} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {bug.project_id ? <div className="mb-0.5"><span className="text-[10px] text-zinc-500 font-mono">PROJ: </span><Link href={`/os/projects/${bug.project_id}`} className="text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline">{projectName(projects, bug.project_id)}</Link></div> : null}
                        {bug.client_id ? <div><span className="text-[10px] text-zinc-500 font-mono">CLI: </span><Link href={`/os/clients/${bug.client_id}`} className="text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline">{clientName(clients, companies, bug.client_id)}</Link></div> : null}
                      </TableCell>
                      <TableCell className="text-zinc-300">{profileName(profiles, bug.assigned_to)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingBug(bug)} className="cursor-pointer">Editar</Button>
                          {bug.status !== "closed" && bug.status !== "fixed" ? (
                            <form action={archiveBugAction.bind(null, bug.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-950/20 cursor-pointer">Fechar</Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RightDrawer
        isOpen={!!editingBug}
        onClose={() => setEditingBug(null)}
        title="Editar Bug"
        subtitle="Atualize as informações do bug técnico."
      >
        {editingBug && (
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Título</label>
              <Input name="title" defaultValue={editingBug.title} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select name="status" defaultValue={editingBug.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {bugStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Severidade</label>
                <select name="severity" defaultValue={editingBug.severity} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {severityLevels.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                <select name="priority" defaultValue={editingBug.priority} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {priorityLevels.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Atribuído a</label>
                <select name="assigned_to" defaultValue={editingBug.assigned_to || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Nenhum</option>
                  {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Descrição</label>
              <textarea name="description" defaultValue={editingBug.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                <select name="project_id" defaultValue={editingBug.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Sem projeto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                <select name="client_id" defaultValue={editingBug.client_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Sem cliente</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Empresa</label>
                <select name="company_id" defaultValue={editingBug.company_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Sem empresa</option>
                  {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingBug(null)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white cursor-pointer">Salvar</Button>
            </div>
          </form>
        )}
      </RightDrawer>
    </TechList>
  );
}

export function IncidentsPageView({
  incidents,
  projects,
  clients = [],
  companies = [],
  profiles = [],
  error
}: {
  incidents: TechIncidentRow[];
  projects: ProjectRow[];
  clients?: ClientRow[];
  companies?: CompanyRow[];
  profiles?: ProfileRow[];
  error: string | null;
}) {
  const [editingIncident, setEditingIncident] = useState<TechIncidentRow | null>(null);

  // Local state for incidents to support Optimistic UI
  const [prevIncidents, setPrevIncidents] = useState<TechIncidentRow[]>(incidents);
  const [localIncidents, setLocalIncidents] = useState<TechIncidentRow[]>(incidents);
  if (incidents !== prevIncidents) {
    setPrevIncidents(incidents);
    setLocalIncidents(incidents);
  }

  const handleUpdate = async (formData: FormData) => {
    if (!editingIncident) return;
    try {
      await updateIncidentAction(editingIncident.id, formData);
      setEditingIncident(null);
    } catch (err) {
      alert("Erro ao salvar incidente: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateIncidentStatus = async (id: string, newStatus: string) => {
    const originalIncidents = [...localIncidents];
    setLocalIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as TechIncidentRow["status"] } : i));
    try {
      await updateIncidentStatusActionInline(id, newStatus);
    } catch (err) {
      setLocalIncidents(originalIncidents);
      alert("Falha ao salvar status inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateIncidentSeverity = async (id: string, newSeverity: string) => {
    const originalIncidents = [...localIncidents];
    setLocalIncidents(prev => prev.map(i => i.id === id ? { ...i, severity: newSeverity as TechIncidentRow["severity"] } : i));
    try {
      await updateIncidentSeverityActionInline(id, newSeverity);
    } catch (err) {
      setLocalIncidents(originalIncidents);
      alert("Falha ao salvar severidade inline. Revertendo alteração.\nErro: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TechList title="Incidentes" description="Registro e acompanhamento de incidentes operacionais." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar incidente</CardTitle></CardHeader>
        <CardContent>
          <form action={createIncidentAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Título" required className="md:col-span-2" />
            <select name="severity" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              {severityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Input name="started_at" type="date" className="focus:ring-1 focus:ring-purple-500 outline-none" />
            <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2 focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select name="client_id" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
            </select>

            <select name="owner_id" className="h-8 rounded-lg border bg-background px-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
              <option value="">Sem responsável</option>
              {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
            </select>

            <Button type="submit" className="cursor-pointer">Criar incidente</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidentes Registrados</CardTitle>
          <CardDescription>{localIncidents.length} incidente(s) listado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {localIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum incidente encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Vinculos</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localIncidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{inc.title}</div>
                        {inc.description ? <div className="text-xs text-muted-foreground mt-0.5">{inc.description}</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="relative group/status flex items-center">
                          <select
                            value={inc.status}
                            onChange={(e) => handleUpdateIncidentStatus(inc.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider bg-opacity-20 border py-0.5 px-2.5 h-6 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-opacity-30 transition-colors cursor-pointer appearance-none pr-5.5 font-bold",
                              (inc.status === "investigating" || inc.status === "identified")
                                ? "bg-rose-950/30 text-rose-450 border-rose-500/30"
                                : inc.status === "monitoring"
                                ? "bg-amber-950/20 text-amber-400 border-amber-500/20"
                                : "bg-emerald-950/20 text-emerald-400 border-emerald-500/20"
                            )}
                          >
                            {incidentStatuses.map((st) => (
                              <option key={st} value={st} className="bg-popover text-popover-foreground">{st}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-1.5 flex items-center opacity-60">
                            <ChevronDownIcon className={cn("h-3 w-3",
                              (inc.status === "investigating" || inc.status === "identified") ? "text-rose-400" :
                              inc.status === "monitoring" ? "text-amber-400" :
                              "text-emerald-400"
                            )} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative group/severity flex items-center">
                          <select
                            value={inc.severity}
                            onChange={(e) => handleUpdateIncidentSeverity(inc.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider bg-opacity-20 border py-0.5 px-2.5 h-6 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-opacity-30 transition-colors cursor-pointer appearance-none pr-5.5 font-bold",
                              inc.severity === "critical"
                                ? "bg-rose-950/30 text-rose-450 border-rose-500/30"
                                : inc.severity === "high"
                                ? "bg-amber-950/30 text-amber-400 border-amber-500/30"
                                : inc.severity === "medium"
                                ? "bg-blue-950/20 text-blue-400 border-blue-500/20"
                                : "bg-zinc-900/40 text-zinc-400 border-zinc-800/20"
                            )}
                          >
                            {severityLevels.map((sv) => (
                              <option key={sv} value={sv} className="bg-popover text-popover-foreground">{sv}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-1.5 flex items-center opacity-60">
                            <ChevronDownIcon className={cn("h-3 w-3",
                              inc.severity === "critical" ? "text-rose-450" :
                              inc.severity === "high" ? "text-amber-450" :
                              inc.severity === "medium" ? "text-blue-400" :
                              "text-zinc-400"
                            )} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">{inc.started_at ? String(inc.started_at).slice(0, 10) : "-"}</TableCell>
                      <TableCell>
                        {inc.project_id ? <div className="mb-0.5"><span className="text-[10px] text-zinc-500 font-mono">PROJ: </span><Link href={`/os/projects/${inc.project_id}`} className="text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline">{projectName(projects, inc.project_id)}</Link></div> : null}
                        {inc.client_id ? <div><span className="text-[10px] text-zinc-500 font-mono">CLI: </span><Link href={`/os/clients/${inc.client_id}`} className="text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline">{clientName(clients, companies, inc.client_id)}</Link></div> : null}
                      </TableCell>
                      <TableCell className="text-zinc-300">{profileName(profiles, inc.owner_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingIncident(inc)} className="cursor-pointer">Editar</Button>
                          {inc.status !== "resolved" ? (
                            <form action={archiveIncidentAction.bind(null, inc.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-green-400 hover:text-green-300 border-green-500/20 hover:bg-green-950/20 cursor-pointer">Resolver</Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RightDrawer
        isOpen={!!editingIncident}
        onClose={() => setEditingIncident(null)}
        title="Editar Incidente"
        subtitle="Atualize as informações do incidente operacional."
      >
        {editingIncident && (
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Título</label>
              <Input name="title" defaultValue={editingIncident.title} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select name="status" defaultValue={editingIncident.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {incidentStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Severidade</label>
                <select name="severity" defaultValue={editingIncident.severity} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {severityLevels.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Data de Início</label>
                <Input name="started_at" type="date" defaultValue={editingIncident.started_at ? String(editingIncident.started_at).slice(0, 10) : ""} className="focus:ring-1 focus:ring-purple-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                <select name="owner_id" defaultValue={editingIncident.owner_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Nenhum</option>
                  {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Descrição</label>
              <textarea name="description" defaultValue={editingIncident.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                <select name="project_id" defaultValue={editingIncident.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Sem projeto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                <select name="client_id" defaultValue={editingIncident.client_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Sem cliente</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingIncident(null)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white cursor-pointer">Salvar</Button>
            </div>
          </form>
        )}
      </RightDrawer>
    </TechList>
  );
}

export function BacklogPageView({
  items,
  projects,
  profiles = [],
  error
}: {
  items: TechBacklogRow[];
  projects: ProjectRow[];
  profiles?: ProfileRow[];
  error: string | null;
}) {
  const [editingItem, setEditingItem] = useState<TechBacklogRow | null>(null);

  const handleUpdate = async (formData: FormData) => {
    if (!editingItem) return;
    try {
      await updateBacklogItemAction(editingItem.id, formData);
      setEditingItem(null);
    } catch (err) {
      alert("Erro ao salvar item de backlog: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const backlogStatusesLocal = ["open", "planned", "in_progress", "done", "archived"];

  return (
    <TechList title="Backlog Técnico" description="Dívida técnica, infraestrutura, segurança e performance." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar item de backlog</CardTitle></CardHeader>
        <CardContent>
          <form action={createBacklogItemAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Título" required className="md:col-span-2" />
            <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {priorityLevels.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="type" defaultValue="debt" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {backlogTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="owner_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem responsável</option>
              {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
            </select>
            <Button type="submit">Criar item</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens de Backlog</CardTitle>
          <CardDescription>{items.length} item(ns) listado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{item.title}</div>
                        {item.description ? <div className="text-xs text-muted-foreground">{item.description}</div> : null}
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                      <TableCell>{item.priority}</TableCell>
                      <TableCell>
                        {item.project_id ? (
                          <Link href={`/os/projects/${item.project_id}`} className="text-primary hover:underline">
                            {projectName(projects, item.project_id)}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{profileName(profiles, item.owner_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>Editar</Button>
                          {item.status !== "archived" ? (
                            <form action={archiveBacklogItemAction.bind(null, item.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-950/20">Arquivar</Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RightDrawer
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Item do Backlog"
        subtitle="Atualize as informações do item técnico."
      >
        {editingItem && (
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Título</label>
              <Input name="title" defaultValue={editingItem.title} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select name="status" defaultValue={editingItem.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {backlogStatusesLocal.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Tipo</label>
                <select name="type" defaultValue={editingItem.type} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {backlogTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                <select name="priority" defaultValue={editingItem.priority} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {priorityLevels.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                <select name="owner_id" defaultValue={editingItem.owner_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Nenhum</option>
                  {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Descrição</label>
              <textarea name="description" defaultValue={editingItem.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Projeto</label>
              <select name="project_id" defaultValue={editingItem.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                <option value="">Sem projeto</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white cursor-pointer">Salvar</Button>
            </div>
          </form>
        )}
      </RightDrawer>
    </TechList>
  );
}

export function RoadmapPageView({
  items,
  projects,
  profiles = [],
  error
}: {
  items: TechRoadmapRow[];
  projects: ProjectRow[];
  profiles?: ProfileRow[];
  error: string | null;
}) {
  const [editingItem, setEditingItem] = useState<TechRoadmapRow | null>(null);

  const handleUpdate = async (formData: FormData) => {
    if (!editingItem) return;
    try {
      await updateRoadmapItemAction(editingItem.id, formData);
      setEditingItem(null);
    } catch (err) {
      alert("Erro ao salvar item de roadmap: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TechList title="Roadmap Técnico" description="Planejamento técnico de médio prazo." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar item de roadmap</CardTitle></CardHeader>
        <CardContent>
          <form action={createRoadmapItemAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Título" required className="md:col-span-2" />
            <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {priorityLevels.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Input name="target_date" type="date" />
            <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="owner_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem responsável</option>
              {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
            </select>
            <Button type="submit">Criar item</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap de Produto</CardTitle>
          <CardDescription>{items.length} item(ns) listado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item no roadmap.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data Limite</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{item.title}</div>
                        {item.description ? <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div> : null}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono uppercase tracking-wider",
                            item.status === "shipped"
                              ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20"
                              : item.status === "in_progress"
                              ? "bg-blue-950/20 text-blue-400 border-blue-500/20"
                              : item.status === "canceled"
                              ? "bg-zinc-950/20 text-zinc-500 border-zinc-800/25"
                              : "bg-[#0b0b0e] text-zinc-400 border-white/5"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono uppercase tracking-wider",
                            item.priority === "urgent"
                              ? "bg-rose-950/30 text-rose-400 border-rose-500/20"
                              : item.priority === "high"
                              ? "bg-amber-950/20 text-amber-400 border-amber-500/20"
                              : item.priority === "medium"
                              ? "bg-blue-950/20 text-blue-400 border-blue-500/20"
                              : "bg-zinc-900/40 text-zinc-400 border-zinc-80"
                          )}
                        >
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">{item.target_date ? String(item.target_date).slice(0, 10) : "-"}</TableCell>
                      <TableCell>
                        {item.project_id ? (
                          <Link href={`/os/projects/${item.project_id}`} className="text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline">
                            {projectName(projects, item.project_id)}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-zinc-300">{profileName(profiles, item.owner_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>Editar</Button>
                          {item.status !== "canceled" ? (
                            <form action={archiveRoadmapItemAction.bind(null, item.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-950/20">Cancelar</Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RightDrawer
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Item do Roadmap"
        subtitle="Atualize as informações do item planejado."
      >
        {editingItem && (
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Título</label>
              <Input name="title" defaultValue={editingItem.title} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select name="status" defaultValue={editingItem.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {roadmapStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                <select name="priority" defaultValue={editingItem.priority} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {priorityLevels.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Data Alvo</label>
                <Input name="target_date" type="date" defaultValue={editingItem.target_date ? String(editingItem.target_date).slice(0, 10) : ""} className="focus:ring-1 focus:ring-purple-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                <select name="owner_id" defaultValue={editingItem.owner_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Nenhum</option>
                  {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Descrição</label>
              <textarea name="description" defaultValue={editingItem.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Projeto</label>
              <select name="project_id" defaultValue={editingItem.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                <option value="">Sem projeto</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white cursor-pointer">Salvar</Button>
            </div>
          </form>
        )}
      </RightDrawer>
    </TechList>
  );
}

export function DecisionsPageView({
  items,
  projects,
  error
}: {
  items: TechnicalDecisionRow[];
  projects: ProjectRow[];
  error: string | null;
}) {
  const [editingDecision, setEditingDecision] = useState<TechnicalDecisionRow | null>(null);

  const handleUpdate = async (formData: FormData) => {
    if (!editingDecision) return;
    try {
      await updateTechnicalDecisionAction(editingDecision.id, formData);
      setEditingDecision(null);
    } catch (err) {
      alert("Erro ao salvar decisão técnica: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TechList title="Decisões Técnicas" description="ADR interno para decisões de arquitetura." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar decisão</CardTitle></CardHeader>
        <CardContent>
          <form action={createTechnicalDecisionAction} className="grid gap-3 md:grid-cols-2">
            <Input name="title" placeholder="Título" required />
            <select name="status" defaultValue="proposed" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {technicalDecisionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea name="context" placeholder="Contexto" required className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
            <textarea name="decision" placeholder="Decisão" required className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
            <textarea name="consequences" placeholder="Consequências" className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
            <ProjectSelect projects={projects} />
            <Button type="submit">Criar decisão</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decisões Registradas (ADRs)</CardTitle>
          <CardDescription>{items.length} decisão(ões) registrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma decisão técnica encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Decisão</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((dec) => (
                    <TableRow key={dec.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{dec.title}</div>
                        {dec.context ? <div className="text-xs text-muted-foreground line-clamp-1">Ctx: {dec.context}</div> : null}
                      </TableCell>
                      <TableCell><Badge variant="outline">{dec.status}</Badge></TableCell>
                      <TableCell>
                        <div className="text-xs max-w-md line-clamp-2">{dec.decision}</div>
                        {dec.consequences ? <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Cons: {dec.consequences}</div> : null}
                      </TableCell>
                      <TableCell>
                        {dec.project_id ? (
                          <Link href={`/os/projects/${dec.project_id}`} className="text-primary hover:underline">
                            {projectName(projects, dec.project_id)}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingDecision(dec)}>Editar</Button>
                          {dec.status !== "deprecated" ? (
                            <form action={archiveTechnicalDecisionAction.bind(null, dec.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-950/20">Depreciar</Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RightDrawer
        isOpen={!!editingDecision}
        onClose={() => setEditingDecision(null)}
        title="Editar Decisão Técnica"
        subtitle="Atualize os detalhes da decisão arquitetural (ADR)."
      >
        {editingDecision && (
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Título</label>
              <Input name="title" defaultValue={editingDecision.title} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select name="status" defaultValue={editingDecision.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  {technicalDecisionStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                <select name="project_id" defaultValue={editingDecision.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none">
                  <option value="">Sem projeto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Contexto</label>
              <textarea name="context" defaultValue={editingDecision.context} required className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Decisão</label>
              <textarea name="decision" defaultValue={editingDecision.decision} required className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Consequências</label>
              <textarea name="consequences" defaultValue={editingDecision.consequences || ""} className="w-full min-h-16 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingDecision(null)} className="cursor-pointer">Cancelar</Button>
              <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white cursor-pointer">Salvar</Button>
            </div>
          </form>
        )}
      </RightDrawer>
    </TechList>
  );
}

function TechList({ title, description, error, children }: { title: string; description: string; error: string | null; children: React.ReactNode }) {
  return <div className="flex flex-col gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>{error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}{children}</div>;
}

function FilterBar({ status, extraName, extraOptions }: { status: string[]; extraName?: string; extraOptions?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentExtra = extraName ? (searchParams.get(extraName) || "") : "";

  const handleChange = (name: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(name, val);
    } else {
      params.delete(name);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isFilterActive = currentStatus || currentExtra;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={currentStatus}
            onChange={(val) => handleChange("status", val)}
            options={[
              { value: "", label: "Todos status" },
              ...status.map((item) => ({ value: item, label: item }))
            ]}
            placeholder="Todos status"
            className="w-48"
          />

          {extraName && extraOptions ? (
            <CustomSelect
              value={currentExtra}
              onChange={(val) => handleChange(extraName, val)}
              options={[
                { value: "", label: `Todos ${extraName}` },
                ...extraOptions.map((item) => ({ value: item, label: item }))
              ]}
              placeholder={`Todos ${extraName}`}
              className="w-48"
            />
          ) : null}

          {isFilterActive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-mono text-xs cursor-pointer"
              onClick={() => router.push(pathname, { scroll: false })}
            >
              Limpar Filtros
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSelect({ projects }: { projects: ProjectRow[] }) {
  return (
    <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
      <option value="">Sem projeto</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
  );
}


