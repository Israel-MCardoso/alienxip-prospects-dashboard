import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadEntityFileAction } from "./actions";

export function UploadForm({ entityType, entityId }: { entityType: string; entityId: string }) {
  return (
    <form action={uploadEntityFileAction.bind(null, entityType, entityId)} className="flex flex-wrap gap-2">
      <Input name="file" type="file" required />
      <Button type="submit" variant="outline">Enviar arquivo</Button>
    </form>
  );
}
