import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FileRow } from "./data";
import { removeFileAction } from "@/features/governance/actions";

export function FilesPageView({ files, error }: { files: FileRow[]; error: string | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">File Center</h1>
        <p className="text-sm text-muted-foreground">Arquivos recentes e documentos vinculados a entidades.</p>
      </div>
      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Dados parciais</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-4">
            <Input name="q" placeholder="Buscar arquivo" />
            <select name="entity_type" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todas entidades</option>
              <option value="prospect">Prospect</option>
              <option value="client">Cliente</option>
              <option value="project">Projeto</option>
            </select>
            <Input name="file_type" placeholder="Tipo MIME" />
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Arquivos recentes</CardTitle>
          <CardDescription>{files.length} arquivo(s)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {files.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum arquivo registrado.</p> : null}
          {files.map((file) => (
            <div key={file.id} className="rounded-lg border p-3">
              <div className="font-medium">{file.file_name}</div>
              <div className="text-xs text-muted-foreground">
                {file.entity_type} | {file.file_type || "-"} | {file.bucket}/{file.path}
              </div>
              <form action={removeFileAction.bind(null, file.id)} className="mt-3 flex gap-2">
                <Input name="removal_reason" placeholder="Motivo da remoção" />
                <Button type="submit" variant="outline">
                  Remover metadata
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
