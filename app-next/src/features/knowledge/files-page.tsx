import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FileRow } from "./data";
import { removeFileAction } from "@/features/governance/actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { FileIcon } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

export function FilesPageView({
  files,
  error,
  initialFilters = {},
  currentPage,
  totalPages,
  totalItems
}: {
  files: FileRow[];
  error: string | null;
  initialFilters?: { q?: string; entity_type?: string; file_type?: string };
  currentPage: number;
  totalPages: number;
  totalItems: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Central de Arquivos</h1>
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
            <Input name="q" placeholder="Buscar arquivo" defaultValue={initialFilters.q || ""} />
            <CustomSelect
              name="entity_type"
              defaultValue={initialFilters.entity_type || ""}
              options={[
                { value: "", label: "Todas entidades" },
                { value: "prospect", label: "Prospect" },
                { value: "client", label: "Cliente" },
                { value: "project", label: "Projeto" }
              ]}
              placeholder="Todas entidades"
            />
            <Input name="file_type" placeholder="Tipo MIME" defaultValue={initialFilters.file_type || ""} />
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Arquivos recentes</CardTitle>
          <CardDescription>{totalItems} arquivo(s)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {files.length === 0 ? (
            <EmptyState
              title="Sem arquivos"
              description="Nenhum arquivo de metadados foi encontrado."
              icon={<FileIcon className="size-5" />}
              className="p-6"
            />
          ) : null}
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
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} />
        </CardContent>
      </Card>
    </div>
  );
}

