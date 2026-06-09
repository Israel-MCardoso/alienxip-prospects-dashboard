import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/features/commercial/data";

export default async function ClientsPage() {
  const { data, error } = await getClients();

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
