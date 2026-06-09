import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanies } from "@/features/commercial/data";

export default async function CompaniesPage() {
  const { data, error } = await getCompanies();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-sm text-muted-foreground">Empresas criadas a partir da conversao de prospects.</p>
      </div>
      {error ? <Card><CardHeader><CardTitle>Conexao pendente</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <Card>
        <CardHeader><CardTitle>Empresas</CardTitle><CardDescription>{data.length} registro(s)</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma empresa ainda.</p> : null}
          {data.map((company) => (
            <Link key={company.id} href={`/os/companies/${company.id}`} className="rounded-lg border p-3 hover:bg-muted/50">
              <div className="font-medium">{company.name}</div>
              <div className="text-sm text-muted-foreground">{[company.segment, company.city, company.state].filter(Boolean).join(" | ") || "sem detalhes"}</div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
