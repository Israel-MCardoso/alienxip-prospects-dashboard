import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { linkWikiToProjectAction } from "./actions";
import type { WikiPageRow } from "./data";

export function ProjectWikiLinks({ projectId, pages, allPages }: { projectId: string; pages: WikiPageRow[]; allPages: WikiPageRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wiki Links</CardTitle>
        <CardDescription>Páginas de conhecimento vinculadas a este projeto.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action={linkWikiToProjectAction.bind(null, projectId)} className="flex flex-wrap gap-2">
          <select name="wiki_page_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
            <option value="">Selecionar página</option>
            {allPages.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}
          </select>
          <Button type="submit" variant="outline">Vincular</Button>
        </form>
        {pages.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma página Wiki vinculada.</p> : null}
        {pages.map((page) => (
          <Link key={page.id} href={`/os/wiki/${page.slug}`} className="rounded-lg border p-3 hover:bg-muted/50">
            <div className="font-medium">{page.title}</div>
            <div className="text-xs text-muted-foreground">{page.category} | {page.status}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
