import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileRow } from "./data";

export function FileList({ files, entityLabel }: { files: FileRow[]; entityLabel: string }) {
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
        <Button variant="outline" disabled>Registrar arquivo</Button>
      </CardContent>
    </Card>
  );
}
