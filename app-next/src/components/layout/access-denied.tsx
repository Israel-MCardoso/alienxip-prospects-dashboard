import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-950/20">
        <ShieldAlertIcon className="size-7 text-rose-400" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold text-foreground font-mono uppercase tracking-wider">
          Acesso restrito
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Seu perfil não tem permissão para acessar esta área.
        </p>
      </div>
      <Button variant="outline" size="sm" render={<Link href="/os" />}>
        Voltar ao início
      </Button>
    </div>
  );
}
