import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGeneralTaskAction } from "./actions";
import type { ClientRow, CompanyRow, ProfileRow, ProjectRow } from "./data";

export function TaskForm({
  companies,
  clients,
  profiles,
  projects,
  defaults = {}
}: {
  companies: CompanyRow[];
  clients: ClientRow[];
  profiles: ProfileRow[];
  projects: ProjectRow[];
  defaults?: { client_id?: string; company_id?: string; project_id?: string };
}) {
  function getClientCompanyName(client: ClientRow, companies: CompanyRow[]) {
    const company = companies.find((c) => c.id === client.company_id);
    return company?.name || client.main_contact_name || client.id;
  }

  return (
    <form action={createGeneralTaskAction} className="grid gap-3 rounded-lg border bg-[#0D0D0D] p-4 md:grid-cols-4">
      <Input name="title" placeholder="Nova tarefa" className="md:col-span-2" required />
      <select name="priority" defaultValue="medium" className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="low">Baixa</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="urgent">Urgente</option>
      </select>
      <Input name="due_date" type="date" />
      <textarea name="description" placeholder="Descricao" className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm md:col-span-4" />
      <select name="assigned_to" className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Responsavel atual</option>
        {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>)}
      </select>
      <select name="project_id" defaultValue={defaults.project_id || ""} className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Sem projeto</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      <select name="client_id" defaultValue={defaults.client_id || ""} className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Sem cliente</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {getClientCompanyName(client, companies)}
          </option>
        ))}
      </select>
      <select name="company_id" defaultValue={defaults.company_id || ""} className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="">Sem empresa</option>
        {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
      </select>
      <div className="md:col-span-4">
        <Button type="submit">Criar tarefa</Button>
      </div>
    </form>
  );
}
