import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createBacklogItemAction,
  createBugAction,
  createIncidentAction,
  createRoadmapItemAction,
  createTechnicalDecisionAction,
  updateIncidentStatusAction
} from "./actions";
import type { ProjectRow, TechBacklogRow, TechBugRow, TechIncidentRow, TechRoadmapRow, TechnicalDecisionRow } from "./data";
import { backlogTypes, bugStatuses, incidentStatuses, priorityLevels, roadmapStatuses, severityLevels, technicalDecisionStatuses } from "./tech-helpers";

function ProjectSelect({ projects }: { projects: ProjectRow[] }) {
  return (
    <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
      <option value="">Sem projeto</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
  );
}

export function BugsPageView({ bugs, projects, error }: { bugs: TechBugRow[]; projects: ProjectRow[]; error: string | null }) {
  return (
    <TechList title="Bugs" description="Controle de falhas técnicas e regressões." error={error}>
      <Card><CardHeader><CardTitle>Criar bug</CardTitle></CardHeader><CardContent>
        <form action={createBugAction} className="grid gap-3 md:grid-cols-4">
          <Input name="title" placeholder="Título" required className="md:col-span-2" />
          <select name="severity" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">{severityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>
          <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">{priorityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>
          <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
          <ProjectSelect projects={projects} />
          <Button type="submit">Criar bug</Button>
        </form>
      </CardContent></Card>
      <FilterBar status={bugStatuses} extraName="severity" extraOptions={severityLevels} />
      <SimpleTable rows={bugs} columns={["title", "status", "severity", "priority"]} />
    </TechList>
  );
}

export function IncidentsPageView({ incidents, projects, error }: { incidents: TechIncidentRow[]; projects: ProjectRow[]; error: string | null }) {
  return (
    <TechList title="Incidentes" description="Registro e acompanhamento de incidentes operacionais." error={error}>
      <Card><CardHeader><CardTitle>Criar incidente</CardTitle></CardHeader><CardContent>
        <form action={createIncidentAction} className="grid gap-3 md:grid-cols-4">
          <Input name="title" placeholder="Título" required className="md:col-span-2" />
          <select name="severity" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">{severityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>
          <Input name="started_at" type="date" />
          <textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
          <ProjectSelect projects={projects} />
          <Button type="submit">Criar incidente</Button>
        </form>
      </CardContent></Card>
      <SimpleTable rows={incidents} columns={["title", "status", "severity"]} statusAction />
    </TechList>
  );
}

export function BacklogPageView({ items, projects, error }: { items: TechBacklogRow[]; projects: ProjectRow[]; error: string | null }) {
  return (
    <TechList title="Backlog Técnico" description="Dívida técnica, infraestrutura, segurança e performance." error={error}>
      <GenericCreateForm action={createBacklogItemAction} projects={projects} typeOptions={backlogTypes} />
      <SimpleTable rows={items} columns={["title", "status", "type", "priority"]} />
    </TechList>
  );
}

export function RoadmapPageView({ items, projects, error }: { items: TechRoadmapRow[]; projects: ProjectRow[]; error: string | null }) {
  return (
    <TechList title="Roadmap Técnico" description="Planejamento técnico de médio prazo." error={error}>
      <GenericCreateForm action={createRoadmapItemAction} projects={projects} statusOptions={roadmapStatuses} withDate />
      <SimpleTable rows={items} columns={["title", "status", "priority", "target_date"]} />
    </TechList>
  );
}

export function DecisionsPageView({ items, projects, error }: { items: TechnicalDecisionRow[]; projects: ProjectRow[]; error: string | null }) {
  return (
    <TechList title="Decisões Técnicas" description="ADR interno para decisões de arquitetura." error={error}>
      <Card><CardHeader><CardTitle>Criar decisão</CardTitle></CardHeader><CardContent>
        <form action={createTechnicalDecisionAction} className="grid gap-3 md:grid-cols-2">
          <Input name="title" placeholder="Título" required />
          <select name="status" defaultValue="proposed" className="h-8 rounded-lg border bg-background px-2 text-sm">{technicalDecisionStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>
          <textarea name="context" placeholder="Contexto" required className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
          <textarea name="decision" placeholder="Decisão" required className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
          <textarea name="consequences" placeholder="Consequências" className="min-h-20 rounded-lg border bg-background p-3 text-sm" />
          <ProjectSelect projects={projects} />
          <Button type="submit">Criar decisão</Button>
        </form>
      </CardContent></Card>
      <SimpleTable rows={items} columns={["title", "status", "decision"]} />
    </TechList>
  );
}

function TechList({ title, description, error, children }: { title: string; description: string; error: string | null; children: React.ReactNode }) {
  return <div className="flex flex-col gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>{error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}{children}</div>;
}

function FilterBar({ status, extraName, extraOptions }: { status: string[]; extraName?: string; extraOptions?: string[] }) {
  return <Card><CardContent className="p-4"><form className="flex flex-wrap gap-2"><select name="status" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos status</option>{status.map((item) => <option key={item} value={item}>{item}</option>)}</select>{extraName ? <select name={extraName} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos</option>{extraOptions?.map((item) => <option key={item} value={item}>{item}</option>)}</select> : null}<Button type="submit" variant="outline">Filtrar</Button></form></CardContent></Card>;
}

function GenericCreateForm({ action, projects, typeOptions, statusOptions, withDate }: { action: (formData: FormData) => void; projects: ProjectRow[]; typeOptions?: string[]; statusOptions?: string[]; withDate?: boolean }) {
  return <Card><CardHeader><CardTitle>Criar item</CardTitle></CardHeader><CardContent><form action={action} className="grid gap-3 md:grid-cols-4"><Input name="title" placeholder="Título" required className="md:col-span-2" /><select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">{priorityLevels.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>{statusOptions ? <select name="status" defaultValue={statusOptions[0]} className="h-8 rounded-lg border bg-background px-2 text-sm">{statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select> : null}{typeOptions ? <select name="type" defaultValue={typeOptions[0]} className="h-8 rounded-lg border bg-background px-2 text-sm">{typeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select> : null}{withDate ? <Input name="target_date" type="date" /> : null}<textarea name="description" placeholder="Descrição" className="min-h-20 rounded-lg border bg-background p-3 text-sm md:col-span-2" /><ProjectSelect projects={projects} /><Button type="submit">Criar</Button></form></CardContent></Card>;
}

function SimpleTable({ rows, columns, statusAction }: { rows: Array<Record<string, string | number | null>>; columns: string[]; statusAction?: boolean }) {
  return <Card><CardHeader><CardTitle>Registros</CardTitle><CardDescription>{rows.length} item(ns)</CardDescription></CardHeader><CardContent>{rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p> : <Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}{statusAction ? <TableHead>Ação</TableHead> : null}</TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={String(row.id)}>{columns.map((column) => <TableCell key={column}>{String(row[column] ?? "-")}</TableCell>)}{statusAction ? <TableCell><form action={updateIncidentStatusAction.bind(null, String(row.id))} className="flex gap-2"><select name="status" defaultValue={String(row.status)} className="h-8 rounded-lg border bg-background px-2 text-sm">{incidentStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><Button type="submit" size="sm" variant="outline">Atualizar</Button></form></TableCell> : null}</TableRow>)}</TableBody></Table>}</CardContent></Card>;
}
