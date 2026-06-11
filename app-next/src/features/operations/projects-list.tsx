import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { groupProjectsByStatus } from "./operations-helpers";
import type { ClientRow, CompanyRow, ProfileRow, ProjectRow } from "./data";
import { formatDate, priorityLabel, statusLabel } from "./format";
import { ProjectForm } from "./project-form";

function profileName(profiles: ProfileRow[], id: string | null) {
  const profile = profiles.find((item) => item.id === id);
  return profile?.full_name || profile?.email || "-";
}

function clientName(clients: ClientRow[], id: string | null) {
  const client = clients.find((item) => item.id === id);
  return client?.main_contact_name || id || "-";
}

function companyName(companies: CompanyRow[], id: string | null) {
  return companies.find((item) => item.id === id)?.name || "-";
}

export function ProjectsList({
  projects,
  clients,
  companies,
  profiles,
  error
}: {
  projects: ProjectRow[];
  clients: ClientRow[];
  companies: CompanyRow[];
  profiles: ProfileRow[];
  error: string | null;
}) {
  const grouped = groupProjectsByStatus(projects);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
        <p className="text-sm text-muted-foreground">Projetos por cliente, responsaveis, prazos e tarefas vinculadas.</p>
      </div>

      {error ? <Card><CardHeader><CardTitle>Erro ao carregar projetos</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}

      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(grouped).map(([status, items]) => (
          <Card key={status}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">{statusLabel(status)}</div>
              <div className="text-2xl font-semibold">{items.length}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Criar projeto</CardTitle></CardHeader>
        <CardContent><ProjectForm clients={clients} companies={companies} profiles={profiles} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5">
            <Input name="q" placeholder="Buscar projeto" />
            <select name="status" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos status</option>
              <option value="planning">Planejamento</option>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Concluido</option>
              <option value="canceled">Cancelado</option>
            </select>
            <select name="priority" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todas prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            <select name="owner_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos responsaveis</option>
              <option value="me">Meus projetos</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>)}
            </select>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista de projetos</CardTitle><CardDescription>{projects.length} registro(s)</CardDescription></CardHeader>
        <CardContent>
          {projects.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p> : null}
          {projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell><Link className="font-medium text-primary hover:underline" href={`/os/projects/${project.id}`}>{project.name}</Link></TableCell>
                    <TableCell><Badge variant="outline">{statusLabel(project.status)}</Badge></TableCell>
                    <TableCell>{priorityLabel(project.priority)}</TableCell>
                    <TableCell>
                      {project.client_id ? <Link className="text-primary hover:underline" href={`/os/clients/${project.client_id}`}>{clientName(clients, project.client_id)}</Link> : "-"}
                    </TableCell>
                    <TableCell>
                      {project.company_id ? <Link className="text-primary hover:underline" href={`/os/companies/${project.company_id}`}>{companyName(companies, project.company_id)}</Link> : "-"}
                    </TableCell>
                    <TableCell>{profileName(profiles, project.owner_id)}</TableCell>
                    <TableCell>{formatDate(project.due_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
