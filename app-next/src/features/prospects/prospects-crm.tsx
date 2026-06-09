import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProspectForm } from "./prospect-form";
import type { ProspectRow } from "./data";
import { prospectStatuses, prospectTemperatures } from "./prospect-schema";

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
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <Input name="q" placeholder="Buscar por nome" />
            <select name="status" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Todos status</option>
              {prospectStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select name="temperature" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Todas temperaturas</option>
              {prospectTemperatures.map((temperature) => <option key={temperature} value={temperature}>{temperature}</option>)}
            </select>
            <Button type="submit" variant="outline">Filtrar</Button>
          </form>

          {prospects.length === 0 ? (
            <div className="rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
              Nenhum prospect encontrado. Configure Supabase e crie ou importe registros para iniciar o CRM.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell className="font-medium">
                      <Link href={`/os/prospects/${prospect.id}`} className="hover:underline">
                        {prospect.name}
                      </Link>
                    </TableCell>
                    <TableCell>{prospect.status}</TableCell>
                    <TableCell>
                      <Badge variant={prospect.temperature === "hot" ? "destructive" : "outline"}>
                        {prospect.temperature}
                      </Badge>
                    </TableCell>
                    <TableCell>{[prospect.city, prospect.state].filter(Boolean).join(" / ") || "-"}</TableCell>
                    <TableCell>{prospect.source}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" render={<Link href={`/os/prospects/${prospect.id}`} />}>
                        Abrir
                      </Button>
                      <Button variant="outline" size="sm" render={<Link href={`/os/prospects/${prospect.id}/edit`} />}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
