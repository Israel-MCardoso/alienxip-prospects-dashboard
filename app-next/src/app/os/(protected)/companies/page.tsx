import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanies } from "@/features/commercial/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCompanyAction } from "@/features/commercial/actions";
import { Pagination } from "@/components/ui/pagination";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10);
  const { data, error } = await getCompanies();

  const itemsPerPage = 10;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCompanies = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumbs */}
      <div className="text-xs text-muted-foreground mb-1">
        <Link href="/os/dashboard" className="hover:underline">Dashboard</Link>
        {" > "}
        <span className="text-white">Empresas</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-sm text-muted-foreground">Empresas criadas a partir de conversão ou manualmente.</p>
      </div>

      {error ? <Card><CardHeader><CardTitle>Erro de Conexão</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}

      <div className="grid gap-6 md:grid-cols-[1fr_1.8fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Criar Empresa</CardTitle>
            <CardDescription>Cadastrar empresa parceira ou cliente manual.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCompanyAction} className="flex flex-col gap-3">
              <Input name="name" placeholder="Nome da empresa" required />
              <Input name="legal_name" placeholder="Razão social" />
              <Input name="segment" placeholder="Segmento" />
              <div className="grid grid-cols-2 gap-2">
                <Input name="city" placeholder="Cidade" />
                <Input name="state" placeholder="Estado" />
              </div>
              <Input name="website_url" placeholder="Site URL" />
              <Input name="instagram_url" placeholder="Instagram URL" />
              <Input name="whatsapp" placeholder="WhatsApp" />
              <textarea name="notes" placeholder="Observações" className="min-h-20 rounded-lg border bg-background p-2 text-sm" />
              <Button type="submit">Criar Empresa</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
            <CardDescription>{totalItems} registro(s)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {totalItems === 0 ? <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p> : null}
            {paginatedCompanies.map((company) => (
              <Link key={company.id} href={`/os/companies/${company.id}`} className="rounded-lg border p-3 hover:bg-muted/50 block">
                <div className="font-medium text-white">{company.name}</div>
                <div className="text-sm text-muted-foreground">
                  {[company.segment, company.city, company.state].filter(Boolean).join(" | ") || "sem detalhes"}
                </div>
              </Link>
            ))}
            <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} perPage={itemsPerPage} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
