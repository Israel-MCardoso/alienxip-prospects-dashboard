import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlaybookAction } from "./actions";
import type { PlaybookRow } from "./data";
import { playbookStatuses, wikiCategories } from "./knowledge-helpers";

export function PlaybooksPageView({ playbooks, error }: { playbooks: PlaybookRow[]; error: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1><p className="text-sm text-muted-foreground">Processos operacionais reutilizáveis.</p></div>
      {error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <Card><CardHeader><CardTitle>Criar playbook</CardTitle></CardHeader><CardContent><form action={createPlaybookAction} className="grid gap-3 md:grid-cols-2"><Input name="title" placeholder="Título" required /><Input name="description" placeholder="Descrição" /><select name="category" defaultValue="geral" className="h-8 rounded-lg border bg-background px-2 text-sm">{wikiCategories.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><select name="status" defaultValue="draft" className="h-8 rounded-lg border bg-background px-2 text-sm">{playbookStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><textarea name="content" placeholder="Conteúdo" required className="min-h-36 rounded-lg border bg-background p-3 text-sm md:col-span-2" /><Button type="submit">Criar playbook</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Biblioteca</CardTitle><CardDescription>{playbooks.length} playbook(s)</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><form className="grid gap-2 md:grid-cols-4"><Input name="q" placeholder="Buscar playbook" /><select name="category" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todas categorias</option>{wikiCategories.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><select name="status" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Todos status</option>{playbookStatuses.map((item: string) => <option key={item} value={item}>{item}</option>)}</select><Button type="submit" variant="outline">Filtrar</Button></form>{playbooks.map((playbook) => <div key={playbook.id} className="rounded-lg border p-3"><div className="font-medium">{playbook.title}</div><div className="text-sm text-muted-foreground">{playbook.category} | {playbook.status}</div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{playbook.content}</p></div>)}</CardContent></Card>
    </div>
  );
}
