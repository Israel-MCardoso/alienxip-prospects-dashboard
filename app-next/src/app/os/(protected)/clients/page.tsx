import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/features/commercial/data";
import { Button } from "@/components/ui/button";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ mine?: string }> }) {
  const filters = await searchParams;
  const { data, error } = await getClients(filters);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">Primeira lista de clientes convertidos a partir de prospects.</p>
      </div>
      {error ? <Card><CardHeader><CardTitle>Conexao pendente</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <Card>
        <CardHeader><CardTitle>Clientes</CardTitle><CardDescription>{data.length} registro(s)</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-2">
          <form className="mb-2">
            <select name="mine" className="mr-2 h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos clientes</option>
              <option value="1">Meus clientes</option>
            </select>
            <Button type="submit" variant="outline">Filtrar</Button>
          </form>
          {data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum cliente ainda.</p> : null}
          {data.map((client) => (
            <Link key={client.id} href={`/os/clients/${client.id}`} className="rounded-lg border p-3 hover:bg-muted/50">
              <div className="font-medium">{client.main_contact_name || client.id}</div>
              <div className="text-sm text-muted-foreground">status: {client.status} | contrato: {client.contract_status}</div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
