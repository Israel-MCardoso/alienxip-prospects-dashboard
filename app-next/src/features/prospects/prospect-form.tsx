"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { ProspectRow } from "./data";
import { createProspectAction, updateProspectAction } from "./actions";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import { statusLabel, temperatureLabel } from "@/lib/display-helpers";

export function ProspectForm({
  prospect,
  isConfigured,
  onSuccess,
  onCancel,
  flat = false
}: {
  prospect?: ProspectRow | null;
  isConfigured: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  flat?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const rawAction = prospect
    ? updateProspectAction.bind(null, prospect.id)
    : createProspectAction;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (onSuccess) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const result = await rawAction(formData);
          const errorMsg = (result as { error?: string } | undefined)?.error;
          if (errorMsg) {
            toast.error("Não foi possível salvar o prospect.", errorMsg);
            return;
          }
          onSuccess();
        } catch (err) {
          const isRedirect = err instanceof Error && (
            err.message.includes("NEXT_REDIRECT") ||
            (err as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
          );
          if (isRedirect) {
            onSuccess();
          } else {
            toast.error("Não foi possível salvar o prospect.", err instanceof Error ? err.message : String(err));
          }
        }
      });
    }
  };

  // Keyboard Esc listener inside the form container
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  };

  const formContent = (
    <form 
      onSubmit={handleSubmit} 
      action={onSuccess ? undefined : (rawAction as (formData: FormData) => Promise<void>)}
      onKeyDown={handleKeyDown}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Nome da empresa *</label>
        <Input name="name" placeholder="Nome da empresa" defaultValue={prospect?.name || ""} required disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Empresa</label>
        <Input name="company_name" placeholder="Ex: Clínica Aurora, Barbearia Alfa, Restaurante Central" defaultValue={prospect?.company_name || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Segmento</label>
        <Input name="segment" placeholder="Segmento" defaultValue={prospect?.segment || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">WhatsApp</label>
        <Input name="whatsapp" placeholder="(12) 99999-9999 ou deixe vazio" defaultValue={prospect?.whatsapp || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Etapa comercial</label>
        <select 
          name="status" 
          defaultValue={prospect?.status || "new"} 
          disabled={!isConfigured || isPending} 
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-purple-500 outline-none"
        >
          {prospectStatuses.map((status) => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Temperatura</label>
        <select 
          name="temperature" 
          defaultValue={prospect?.temperature || "warm"} 
          disabled={!isConfigured || isPending} 
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-purple-500 outline-none"
        >
          {prospectTemperatures.map((temperature) => (
            <option key={temperature} value={temperature}>{temperatureLabel(temperature)}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 mt-1">
        <span className="text-[11px] font-semibold font-mono text-purple-300/80 uppercase tracking-wider">Localização</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Cidade</label>
        <Input name="city" placeholder="São Paulo" defaultValue={prospect?.city || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Estado</label>
        <Input name="state" placeholder="SP" defaultValue={prospect?.state || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Bairro</label>
        <Input name="neighborhood" placeholder="Centro" defaultValue={prospect?.neighborhood || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">CEP</label>
        <Input name="postal_code" placeholder="00000-000" defaultValue={prospect?.postal_code || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Rua / Avenida</label>
        <Input name="address_street" placeholder="Av. Paulista" defaultValue={prospect?.address_street || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Número</label>
        <Input name="address_number" placeholder="123" defaultValue={prospect?.address_number || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Complemento</label>
        <Input name="address_complement" placeholder="Sala 04 / Próximo ao mercado" defaultValue={prospect?.address_complement || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Instagram</label>
        <Input name="instagram_url" placeholder="@perfil ou deixe vazio" defaultValue={prospect?.instagram_url || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Site</label>
        <Input name="website_url" placeholder="https://empresa.com.br ou deixe vazio" defaultValue={prospect?.website_url || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Nome do Parceiro</label>
        <Input name="partner_name" placeholder="Parceiro" defaultValue={prospect?.partner_name || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">URL do parceiro</label>
        <Input name="partner_url" placeholder="URL do parceiro" defaultValue={prospect?.partner_url || ""} disabled={!isConfigured || isPending} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className="text-xs font-semibold font-mono text-muted-foreground uppercase">Observações</label>
        <textarea 
          name="notes" 
          placeholder="Observacoes" 
          defaultValue={prospect?.notes || ""} 
          disabled={!isConfigured || isPending}
          className="min-h-[80px] rounded-lg border border-input bg-background p-3 text-xs focus:ring-1 focus:ring-purple-500 outline-none resize-none"
        />
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-2.5 pt-2 border-t border-border/40 mt-2">
        <Button 
          type="submit" 
          disabled={!isConfigured || isPending} 
          className="bg-[#7B2EFF] hover:bg-[#9D5CFF] text-white font-mono text-xs cursor-pointer"
        >
          {isPending ? "Salvando..." : prospect ? "Salvar alterações" : "Criar prospect"}
        </Button>
        {onCancel ? (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="font-mono text-xs cursor-pointer"
            disabled={isPending}
          >
            Cancelar
          </Button>
        ) : prospect ? (
          <Button 
            type="button" 
            variant="outline" 
            render={<Link href={`/os/prospects/${prospect.id}`} />}
            className="font-mono text-xs cursor-pointer"
          >
            Cancelar
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            render={<Link href="/os/prospects" />}
            className="font-mono text-xs cursor-pointer"
          >
            Voltar
          </Button>
        )}
      </div>
    </form>
  );

  if (flat) {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{prospect ? "Editar prospect" : "Novo prospect"}</CardTitle>
        <CardDescription>
          {prospect ? "Atualize as informações operacionais do prospect." : "Cadastro básico para validar o CRM de prospects."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
