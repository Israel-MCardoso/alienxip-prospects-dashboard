import { ActivityIcon, AlertTriangleIcon, MessageCircleIcon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductionReadinessStrip() {
  const items = [
    { label: "Fila", value: "monitoravel", icon: ActivityIcon },
    { label: "Retries", value: "3 tentativas", icon: RotateCcwIcon },
    { label: "Dead Letters", value: "schema pronto", icon: AlertTriangleIcon },
    { label: "Opt-Outs", value: "bloqueio preparado", icon: ShieldCheckIcon },
    { label: "Evolution", value: "desligado", icon: MessageCircleIcon }
  ];

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Production Readiness
        </CardTitle>
        <Badge variant="outline" className="border-amber-500/30 text-amber-500">
          Sem envio real
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3">
              <Icon className="size-4 text-emerald-500" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{item.label}</div>
                <div className="truncate text-xs font-semibold text-foreground">{item.value}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
