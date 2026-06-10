import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import { createPlaybookAction, updatePlaybookAction } from "./actions";
import type { PlaybookRow } from "./data";
import { playbookStatuses, wikiCategories } from "./knowledge-helpers";
import { duplicatePlaybookAction, updateKnowledgeReviewAction, updatePlaybookStatusAction } from "@/features/governance/actions";
import { reviewStatuses } from "@/features/governance/governance-helpers";

export function PlaybooksPageView({ playbooks, error }: { playbooks: PlaybookRow[]; error: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1><p className="text-sm text-muted-foreground">Processos operacionais reutilizáveis.</p></div>
      {error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <Card><CardHeader><CardTitle>Criar playbook</CardTitle></CardHeader><CardContent><form action={createPlaybookAction} className="grid gap-3 md:grid-cols-2"><Input name="title" placeholder="Título" required /><Input name="description" placeholder="Descrição" /><select name="category" defaultValue="geral" className="h-8 rounded-lg border bg-background px-2 text-sm">{wikiCategories.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><select name="status" defaultValue="draft" className="h-8 rounded-lg border bg-background px-2 text-sm">{playbookStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><textarea name="content" placeholder="Conteúdo" required className="min-h-36 rounded-lg border bg-background p-3 text-sm md:col-span-2" /><Button type="submit">Criar playbook</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Biblioteca</CardTitle><CardDescription>{playbooks.length} playbook(s)</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><form className="grid gap-2 md:grid-cols-5"><Input name="q" placeholder="Buscar playbook" /><select name="category" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todas categorias</option>{wikiCategories.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><select name="status" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos status</option>{playbookStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><select name="review_status" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos reviews</option>{reviewStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><Button type="submit" variant="outline">Filtrar</Button></form>{playbooks.map((playbook) => <Link href={`/os/playbooks/${playbook.id}`} key={playbook.id} className="rounded-lg border p-3 hover:bg-muted/50"><div className="font-medium">{playbook.title}</div><div className="text-sm text-muted-foreground">{playbook.category} | {playbook.status} | {playbook.review_status}</div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{playbook.content}</p></Link>)}</CardContent></Card>
    </div>
  );
}

export function PlaybookDetailView({ playbook }: { playbook: PlaybookRow }) {
  return (
    <div className="flex flex-col gap-4">
      <div><Button variant="outline" size="sm" render={<Link href="/os/playbooks" />}>Voltar</Button></div>
      <Card><CardHeader><CardTitle>{playbook.title}</CardTitle><CardDescription>{playbook.category} | {playbook.status} | {playbook.review_status}</CardDescription></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{playbook.content}</CardContent></Card>
      <Card><CardHeader><CardTitle>Editar playbook</CardTitle></CardHeader><CardContent><form action={updatePlaybookAction.bind(null, playbook.id)} className="grid gap-3 md:grid-cols-2"><Input name="title" defaultValue={playbook.title} required /><Input name="description" defaultValue={playbook.description || ""} /><select name="category" defaultValue={playbook.category} className="h-8 rounded-lg border bg-background px-2 text-sm">{wikiCategories.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><select name="status" defaultValue={playbook.status} className="h-8 rounded-lg border bg-background px-2 text-sm">{playbookStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><textarea name="content" defaultValue={playbook.content} required className="min-h-36 rounded-lg border bg-background p-3 text-sm md:col-span-2" /><Button type="submit">Salvar</Button></form></CardContent></Card>
      <div className="flex flex-wrap gap-2">
        <form action={updatePlaybookStatusAction.bind(null, playbook.id, "published")}><Button type="submit">Publicar</Button></form>
        <form action={updatePlaybookStatusAction.bind(null, playbook.id, "archived")}><Button type="submit" variant="outline">Arquivar</Button></form>
        <form action={duplicatePlaybookAction.bind(null, playbook.id)}><Button type="submit" variant="outline">Duplicar</Button></form>
        <form action={updateKnowledgeReviewAction.bind(null, "playbook", playbook.id, "approved")}><Button type="submit" variant="outline">Aprovar revisão</Button></form>
        <form action={updateKnowledgeReviewAction.bind(null, "playbook", playbook.id, "outdated")}><Button type="submit" variant="outline">Marcar outdated</Button></form>
      </div>
    </div>
  );
}
