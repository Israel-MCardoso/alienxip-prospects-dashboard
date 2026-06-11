import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProjectAction } from "./actions";
import type { ClientRow, CompanyRow, ProfileRow } from "./data";

export function ProjectForm({
  clients,
  companies,
  profiles,
  defaults = {}
}: {
  clients: ClientRow[];
  companies: CompanyRow[];
  profiles: ProfileRow[];
  defaults?: { client_id?: string; company_id?: string };
}) {
  return (
    <form action={createProjectAction} className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-4">
      <Input name="name" placeholder="Nome do projeto" className="md:col-span-2" required />
      <select name="status" defaultValue="planning" className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="planning">Planejamento</option>
        <option value="active">Ativo</option>
        <option value="paused">Pausado</option>
        <option value="completed">Concluido</option>
        <option value="canceled">Cancelado</option>
      </select>
      <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="low">Baixa</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="urgent">Urgente</option>
      </select>
      <textarea name="description" placeholder="Descricao" className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm md:col-span-4" />
      <Input name="start_date" type="date" />
      <Input name="due_date" type="date" />
      <select name="owner_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Responsavel atual</option>
        {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>)}
      </select>
      <select name="client_id" defaultValue={defaults.client_id || ""} className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Sem cliente</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.main_contact_name || client.id}</option>)}
      </select>
      <select name="company_id" defaultValue={defaults.company_id || ""} className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Sem empresa</option>
        {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
      </select>
      <div className="md:col-span-4">
        <Button type="submit">Criar projeto</Button>
      </div>
    </form>
  );
}
