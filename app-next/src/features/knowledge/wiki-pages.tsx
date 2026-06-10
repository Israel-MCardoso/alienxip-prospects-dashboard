import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createWikiPageAction, updateWikiPageAction, updateWikiStatusAction } from "./actions";
import type { WikiPageRow } from "./data";
import { slugify, wikiCategories, wikiStatuses } from "./knowledge-helpers";
import { seedOfficialTemplatesAction, updateKnowledgeReviewAction } from "@/features/governance/actions";
import { reviewStatuses } from "@/features/governance/governance-helpers";

export function WikiList({ pages, error }: { pages: WikiPageRow[]; error: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">Wiki</h1><p className="text-sm text-muted-foreground">Base de conhecimento operacional da ALIENXIP.</p></div>
      {error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <Card><CardHeader><CardTitle>Criar página</CardTitle></CardHeader><CardContent className="flex flex-col gap-4"><form action={seedOfficialTemplatesAction}><Button type="submit" variant="outline">Inserir templates oficiais</Button></form><WikiForm /></CardContent></Card>
      <Card><CardHeader><CardTitle>Páginas</CardTitle><CardDescription>{pages.length} registro(s)</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">
        <form className="grid gap-2 md:grid-cols-5"><Input name="q" placeholder="Buscar wiki" /><CategorySelect /><StatusSelect /><ReviewSelect /><Button type="submit" variant="outline">Filtrar</Button></form>
        {pages.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma página encontrada.</p> : null}
        {pages.map((page) => <Link key={page.id} href={`/os/wiki/${page.slug}`} className="rounded-lg border p-3 hover:bg-muted/50"><div className="font-medium">{page.title}</div><div className="text-sm text-muted-foreground">{page.category} | {page.status}</div></Link>)}
      </CardContent></Card>
    </div>
  );
}

export function WikiDetail({ page }: { page: WikiPageRow }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Button variant="outline" size="sm" render={<Link href="/os/wiki" />}>Voltar</Button></div>
      <Card><CardHeader><CardTitle>{page.title}</CardTitle><CardDescription>{page.category} | {page.status}</CardDescription></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{page.content}</CardContent></Card>
      <Card><CardHeader><CardTitle>Editar página</CardTitle></CardHeader><CardContent><WikiForm page={page} /></CardContent></Card>
      <div className="flex gap-2">
        <form action={updateWikiStatusAction.bind(null, page.id, "published")}><Button type="submit">Publicar</Button></form>
        <form action={updateWikiStatusAction.bind(null, page.id, "archived")}><Button type="submit" variant="outline">Arquivar</Button></form>
        <form action={updateKnowledgeReviewAction.bind(null, "wiki", page.id, "approved")}><Button type="submit" variant="outline">Aprovar revisão</Button></form>
        <form action={updateKnowledgeReviewAction.bind(null, "wiki", page.id, "outdated")}><Button type="submit" variant="outline">Marcar outdated</Button></form>
      </div>
    </div>
  );
}

function WikiForm({ page }: { page?: WikiPageRow }) {
  const action = page ? updateWikiPageAction.bind(null, page.id) : createWikiPageAction;
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Input name="title" placeholder="Título" required defaultValue={page?.title || ""} />
      <Input name="slug" placeholder="slug" required defaultValue={page?.slug || slugify(page?.title || "")} />
      <CategorySelect defaultValue={page?.category} />
      <StatusSelect defaultValue={page?.status} />
      <textarea name="content" placeholder="Conteúdo" required defaultValue={page?.content || ""} className="min-h-40 rounded-lg border bg-background p-3 text-sm md:col-span-2" />
      <Button type="submit">{page ? "Salvar" : "Criar página"}</Button>
    </form>
  );
}

function CategorySelect({ defaultValue = "geral" }: { defaultValue?: string }) {
  return <select name="category" defaultValue={defaultValue} className="h-8 rounded-lg border bg-background px-2 text-sm">{wikiCategories.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>;
}

function StatusSelect({ defaultValue = "draft" }: { defaultValue?: string }) {
  return <select name="status" defaultValue={defaultValue} className="h-8 rounded-lg border bg-background px-2 text-sm">{wikiStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>;
}

function ReviewSelect({ defaultValue = "" }: { defaultValue?: string }) {
  return <select name="review_status" defaultValue={defaultValue} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos reviews</option>{reviewStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select>;
}
