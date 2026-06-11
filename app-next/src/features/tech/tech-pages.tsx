"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  archiveTechnicalDecisionAction
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

  const handleUpdate = async (formData: FormData) => {
    if (!editingBug) return;
    try {
      await updateBugAction(editingBug.id, formData);
      setEditingBug(null);
    } catch (err) {
      alert("Erro ao salvar bug: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TechList title="Bugs" description="Controle de falhas técnicas e regressões." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar bug</CardTitle></CardHeader>
        <CardContent>
          <form action={createBugAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Título" required className="md:col-span-2" />
            <select name="severity" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {severityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {priorityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
            
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select name="client_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
            </select>

            <select name="company_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem empresa</option>
              {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>

            <select name="assigned_to" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem atribuição</option>
              {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
            </select>

            <Button type="submit">Criar bug</Button>
          </form>
        </CardContent>
      </Card>

      <FilterBar status={bugStatuses} extraName="severity" extraOptions={severityLevels} />

      <Card>
        <CardHeader>
          <CardTitle>Bugs Registrados</CardTitle>
          <CardDescription>{bugs.length} bug(s) listado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {bugs.length === 0 ? (
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
                  {bugs.map((bug) => (
                    <TableRow key={bug.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{bug.title}</div>
                        {bug.description ? <div className="text-xs text-muted-foreground">{bug.description}</div> : null}
                      </TableCell>
                      <TableCell><Badge variant="outline">{bug.status}</Badge></TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={bug.severity === "critical" ? "border-red-500 text-red-400 bg-red-950/10" : bug.severity === "high" ? "border-amber-500 text-amber-400" : ""}
                        >
                          {bug.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{bug.priority}</TableCell>
                      <TableCell>
                        {bug.project_id ? <div>Proj: <Link href={`/os/projects/${bug.project_id}`} className="text-primary hover:underline">{projectName(projects, bug.project_id)}</Link></div> : null}
                        {bug.client_id ? <div>Cli: <Link href={`/os/clients/${bug.client_id}`} className="text-primary hover:underline">{clientName(clients, companies, bug.client_id)}</Link></div> : null}
                      </TableCell>
                      <TableCell>{profileName(profiles, bug.assigned_to)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingBug(bug)}>Editar</Button>
                          {bug.status !== "closed" && bug.status !== "fixed" ? (
                            <form action={archiveBugAction.bind(null, bug.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-950/20">Fechar</Button>
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

      {editingBug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Editar Bug</h3>
              <p className="text-xs text-muted-foreground">Atualize as informações do bug técnico.</p>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <Input name="title" defaultValue={editingBug.title} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <select name="status" defaultValue={editingBug.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {bugStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Severidade</label>
                  <select name="severity" defaultValue={editingBug.severity} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {severityLevels.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                  <select name="priority" defaultValue={editingBug.priority} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {priorityLevels.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Atribuído a</label>
                  <select name="assigned_to" defaultValue={editingBug.assigned_to || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Nenhum</option>
                    {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Descrição</label>
                <textarea name="description" defaultValue={editingBug.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                  <select name="project_id" defaultValue={editingBug.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-1 text-xs">
                    <option value="">Sem projeto</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                  <select name="client_id" defaultValue={editingBug.client_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-1 text-xs">
                    <option value="">Sem cliente</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Empresa</label>
                  <select name="company_id" defaultValue={editingBug.company_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-1 text-xs">
                    <option value="">Sem empresa</option>
                    {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingBug(null)}>Cancelar</Button>
                <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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

  const handleUpdate = async (formData: FormData) => {
    if (!editingIncident) return;
    try {
      await updateIncidentAction(editingIncident.id, formData);
      setEditingIncident(null);
    } catch (err) {
      alert("Erro ao salvar incidente: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <TechList title="Incidentes" description="Registro e acompanhamento de incidentes operacionais." error={error}>
      <Card>
        <CardHeader><CardTitle>Criar incidente</CardTitle></CardHeader>
        <CardContent>
          <form action={createIncidentAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Título" required className="md:col-span-2" />
            <select name="severity" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
              {severityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Input name="started_at" type="date" />
            <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
            
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem projeto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select name="client_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
            </select>

            <select name="owner_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Sem responsável</option>
              {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
            </select>

            <Button type="submit">Criar incidente</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidentes Registrados</CardTitle>
          <CardDescription>{incidents.length} incidente(s) listado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
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
                  {incidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{inc.title}</div>
                        {inc.description ? <div className="text-xs text-muted-foreground">{inc.description}</div> : null}
                      </TableCell>
                      <TableCell><Badge variant="outline">{inc.status}</Badge></TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={inc.severity === "critical" ? "border-red-500 text-red-400 bg-red-950/10" : inc.severity === "high" ? "border-amber-500 text-amber-400" : ""}
                        >
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{inc.started_at ? String(inc.started_at).slice(0, 10) : "-"}</TableCell>
                      <TableCell>
                        {inc.project_id ? <div>Proj: <Link href={`/os/projects/${inc.project_id}`} className="text-primary hover:underline">{projectName(projects, inc.project_id)}</Link></div> : null}
                        {inc.client_id ? <div>Cli: <Link href={`/os/clients/${inc.client_id}`} className="text-primary hover:underline">{clientName(clients, companies, inc.client_id)}</Link></div> : null}
                      </TableCell>
                      <TableCell>{profileName(profiles, inc.owner_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingIncident(inc)}>Editar</Button>
                          {inc.status !== "resolved" ? (
                            <form action={archiveIncidentAction.bind(null, inc.id)}>
                              <Button size="sm" variant="outline" type="submit" className="text-green-400 hover:text-green-300 border-green-500/20 hover:bg-green-950/20">Resolver</Button>
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

      {editingIncident ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Editar Incidente</h3>
              <p className="text-xs text-muted-foreground">Atualize as informações do incidente operacional.</p>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <Input name="title" defaultValue={editingIncident.title} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <select name="status" defaultValue={editingIncident.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {incidentStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Severidade</label>
                  <select name="severity" defaultValue={editingIncident.severity} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {severityLevels.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Data de Início</label>
                  <Input name="started_at" type="date" defaultValue={editingIncident.started_at ? String(editingIncident.started_at).slice(0, 10) : ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                  <select name="owner_id" defaultValue={editingIncident.owner_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Nenhum</option>
                    {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Descrição</label>
                <textarea name="description" defaultValue={editingIncident.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                  <select name="project_id" defaultValue={editingIncident.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Sem projeto</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Cliente</label>
                  <select name="client_id" defaultValue={editingIncident.client_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Sem cliente</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{clientName(clients, companies, c.id)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingIncident(null)}>Cancelar</Button>
                <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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

      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Editar Item do Backlog</h3>
              <p className="text-xs text-muted-foreground">Atualize as informações do item técnico.</p>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <Input name="title" defaultValue={editingItem.title} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <select name="status" defaultValue={editingItem.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {backlogStatusesLocal.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Tipo</label>
                  <select name="type" defaultValue={editingItem.type} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {backlogTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                  <select name="priority" defaultValue={editingItem.priority} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {priorityLevels.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                  <select name="owner_id" defaultValue={editingItem.owner_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Nenhum</option>
                    {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Descrição</label>
                <textarea name="description" defaultValue={editingItem.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                <select name="project_id" defaultValue={editingItem.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                  <option value="">Sem projeto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
                <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
                        {item.description ? <div className="text-xs text-muted-foreground">{item.description}</div> : null}
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                      <TableCell>{item.priority}</TableCell>
                      <TableCell>{item.target_date ? String(item.target_date).slice(0, 10) : "-"}</TableCell>
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

      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Editar Item do Roadmap</h3>
              <p className="text-xs text-muted-foreground">Atualize as informações do item planejado.</p>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <Input name="title" defaultValue={editingItem.title} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <select name="status" defaultValue={editingItem.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {roadmapStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                  <select name="priority" defaultValue={editingItem.priority} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {priorityLevels.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Data Alvo</label>
                  <Input name="target_date" type="date" defaultValue={editingItem.target_date ? String(editingItem.target_date).slice(0, 10) : ""} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Responsável</label>
                  <select name="owner_id" defaultValue={editingItem.owner_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Nenhum</option>
                    {profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name || pr.email}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Descrição</label>
                <textarea name="description" defaultValue={editingItem.description || ""} className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                <select name="project_id" defaultValue={editingItem.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                  <option value="">Sem projeto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
                <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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

      {editingDecision ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Editar Decisão Técnica</h3>
              <p className="text-xs text-muted-foreground">Atualize os detalhes da decisão arquitetural (ADR).</p>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <Input name="title" defaultValue={editingDecision.title} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <select name="status" defaultValue={editingDecision.status} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    {technicalDecisionStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Projeto</label>
                  <select name="project_id" defaultValue={editingDecision.project_id || ""} className="w-full h-9 rounded-lg border bg-[#151515] text-white px-2 text-sm">
                    <option value="">Sem projeto</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Contexto</label>
                <textarea name="context" defaultValue={editingDecision.context} required className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Decisão</label>
                <textarea name="decision" defaultValue={editingDecision.decision} required className="w-full min-h-20 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Consequências</label>
                <textarea name="consequences" defaultValue={editingDecision.consequences || ""} className="w-full min-h-16 rounded-lg border bg-[#151515] text-white px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingDecision(null)}>Cancelar</Button>
                <Button type="submit" className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </TechList>
  );
}

function TechList({ title, description, error, children }: { title: string; description: string; error: string | null; children: React.ReactNode }) {
  return <div className="flex flex-col gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>{error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}{children}</div>;
}

function FilterBar({ status, extraName, extraOptions }: { status: string[]; extraName?: string; extraOptions?: string[] }) {
  return <Card><CardContent className="p-4"><form className="flex flex-wrap gap-2"><select name="status" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos status</option>{status.map((item) => <option key={item} value={item}>{item}</option>)}</select>{extraName ? <select name={extraName} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos</option>{extraOptions?.map((item) => <option key={item} value={item}>{item}</option>)}</select> : null}<Button type="submit" variant="outline">Filtrar</Button></form></CardContent></Card>;
}

function ProjectSelect({ projects }: { projects: ProjectRow[] }) {
  return (
    <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
      <option value="">Sem projeto</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
  );
}


