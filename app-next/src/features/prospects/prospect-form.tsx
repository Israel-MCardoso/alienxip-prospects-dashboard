import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProspectRow } from "./data";
import { createProspectAction, updateProspectAction } from "./actions";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";

export function ProspectForm({
  prospect,
  isConfigured
}: {
  prospect?: ProspectRow | null;
  isConfigured: boolean;
}) {
  const action = prospect
    ? updateProspectAction.bind(null, prospect.id)
    : createProspectAction;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{prospect ? "Editar prospect" : "Novo prospect"}</CardTitle>
        <CardDescription>
          Cadastro basico para validar o CRM editavel antes da migracao completa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" placeholder="Nome da empresa" defaultValue={prospect?.name || ""} required disabled={!isConfigured} />
          <Input name="segment" placeholder="Segmento" defaultValue={prospect?.segment || ""} disabled={!isConfigured} />
          <select name="status" defaultValue={prospect?.status || "new"} disabled={!isConfigured} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
            {prospectStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select name="temperature" defaultValue={prospect?.temperature || "warm"} disabled={!isConfigured} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
            {prospectTemperatures.map((temperature) => (
              <option key={temperature} value={temperature}>{temperature}</option>
            ))}
          </select>
          <Input name="city" placeholder="Cidade" defaultValue={prospect?.city || ""} disabled={!isConfigured} />
          <Input name="state" placeholder="Estado" defaultValue={prospect?.state || ""} disabled={!isConfigured} />
          <Input name="instagram_url" placeholder="Instagram URL" defaultValue={prospect?.instagram_url || ""} disabled={!isConfigured} />
          <Input name="website_url" placeholder="Site URL" defaultValue={prospect?.website_url || ""} disabled={!isConfigured} />
          <Input name="whatsapp" placeholder="WhatsApp" defaultValue={prospect?.whatsapp || ""} disabled={!isConfigured} />
          <Input name="partner_name" placeholder="Parceiro" defaultValue={prospect?.partner_name || ""} disabled={!isConfigured} />
          <Input name="partner_url" placeholder="URL do parceiro" defaultValue={prospect?.partner_url || ""} disabled={!isConfigured} />
          <Input name="notes" placeholder="Observacoes" defaultValue={prospect?.notes || ""} disabled={!isConfigured} />
          <div className="md:col-span-2">
            <Button type="submit" disabled={!isConfigured}>
              {prospect ? "Salvar alteracoes" : "Criar prospect"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
