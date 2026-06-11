import Link from "next/link";

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
import type { ProspectRow } from "./data";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";
import { statusLabel, temperatureLabel } from "@/lib/display-helpers";

export function ProspectsCrm({
  prospects,
  error,
  isConfigured
}: {
  prospects: ProspectRow[];
  error: string | null;
  isConfigured: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary">Supabase CRM v1</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Primeira versao conectada ao Supabase em ambiente de desenvolvimento, com criacao e edicao basica.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Conexao pendente</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ProspectForm isConfigured={isConfigured} />

      <Card>
        <CardHeader>
          <CardTitle>Lista de prospects</CardTitle>
          <CardDescription>
            Dados lidos da tabela `prospects` quando Supabase esta configurado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px_auto]">
            <Input name="q" placeholder="Buscar por nome" />
            <select name="status" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Todos status</option>
              {prospectStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
            <select name="temperature" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Todas temperaturas</option>
              {prospectTemperatures.map((temperature) => <option key={temperature} value={temperature}>{temperatureLabel(temperature)}</option>)}
            </select>
            <select name="mine" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Todos</option>
              <option value="1">Meus prospects</option>
            </select>
            <Button type="submit" variant="outline">Filtrar</Button>
          </form>

          {prospects.length === 0 ? (
            <div className="rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
              Nenhum prospect encontrado. Configure Supabase e crie ou importe registros para iniciar o CRM.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/40 transition-all duration-300"
                >
                  {/* Informações Principais */}
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/os/prospects/${prospect.id}`}
                        className="text-sm font-semibold text-white hover:underline truncate"
                      >
                        {prospect.name}
                      </Link>
                      
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-purple-950/20 text-purple-300 border-purple-500/20 py-0 px-1.5 h-5">
                          {statusLabel(prospect.status)}
                        </Badge>

                        <Badge
                          variant={prospect.temperature === "hot" ? "destructive" : "outline"}
                          className={`text-[10px] uppercase font-mono py-0 px-1.5 h-5 ${
                            prospect.temperature === "hot"
                              ? "bg-rose-950/30 text-rose-300 border-rose-500/20"
                              : prospect.temperature === "warm"
                              ? "bg-amber-950/20 text-amber-300 border-amber-500/20"
                              : "bg-blue-950/20 text-blue-300 border-blue-500/20"
                          }`}
                        >
                          {temperatureLabel(prospect.temperature)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                      {prospect.segment ? (
                        <span className="font-medium text-purple-200/60">{prospect.segment}</span>
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
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                          {prospect.source}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/os/prospects/${prospect.id}`} />}
                    >
                      Abrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/os/prospects/${prospect.id}/edit`} />}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
