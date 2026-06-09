import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileRow } from "./data";
import { UploadForm } from "@/features/knowledge/upload-form";

export function FileList({ files, entityLabel, entityType, entityId }: { files: FileRow[]; entityLabel: string; entityType?: string; entityId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivos</CardTitle>
        <CardDescription>Bucket recomendado: alienxip-files. Upload completo entra em refinamento futuro.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {files.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum arquivo registrado para {entityLabel}.</p> : null}
        {files.map((file) => (
          <div key={file.id} className="rounded-lg border p-3">
            <div className="font-medium">{file.file_name}</div>
            <div className="text-xs text-muted-foreground">{file.bucket}/{file.path}</div>
          </div>
        ))}
        {entityType && entityId ? <UploadForm entityType={entityType} entityId={entityId} /> : null}
      </CardContent>
    </Card>
  );
}
