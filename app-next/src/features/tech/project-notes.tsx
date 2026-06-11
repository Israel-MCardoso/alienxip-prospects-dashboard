import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createProjectNoteAction } from "./actions";
import type { ProjectNoteRow } from "./data";
import { projectNoteTypes } from "./tech-helpers";

export function ProjectNotes({ projectId, notes }: { projectId: string; notes: ProjectNoteRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas de projeto</CardTitle>
        <CardDescription>Notas persistentes para decisões, riscos, reuniões e contexto técnico.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <form action={createProjectNoteAction.bind(null, projectId)} className="flex flex-col gap-3">
          <Input name="title" placeholder="Título" required />
          <select name="type" defaultValue="general" className="h-8 rounded-lg border bg-background px-2 text-sm">
            {projectNoteTypes.map((type: string) => <option key={type} value={type}>{type}</option>)}
          </select>
          <textarea name="content" placeholder="Conteúdo" required className="min-h-28 rounded-lg border bg-background p-3 text-sm" />
          <Button type="submit">Salvar nota</Button>
        </form>
        <div className="flex flex-col gap-2">
          {notes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma nota persistente ainda.</p> : null}
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-3">
              <div className="font-medium">{note.title}</div>
              <div className="text-xs text-muted-foreground">{note.type} | {new Date(note.created_at).toLocaleString("pt-BR")}</div>
              <p className="mt-2 text-sm text-muted-foreground">{note.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
