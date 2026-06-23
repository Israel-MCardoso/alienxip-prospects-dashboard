import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center", className)}>
      {icon ? <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground">{icon}</div> : null}
      <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
