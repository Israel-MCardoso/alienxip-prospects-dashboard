"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RecordHeader({
  entityName,
  entityType,
  status,
  badges = [],
  actions,
  meta,
  className
}: {
  entityName: string;
  entityType: string;
  status?: string;
  badges?: React.ReactNode[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_34%),linear-gradient(90deg,rgba(99,102,241,0.08),transparent)]" />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-5 border-primary/25 bg-primary/10 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-primary">
              {entityType}
            </Badge>
            {status ? (
              <Badge variant="secondary" className="h-5 px-2 py-0 text-[10px] font-semibold uppercase tracking-wider">
                {status}
              </Badge>
            ) : null}
            {badges.map((badge, index) => (
              <span key={index}>{badge}</span>
            ))}
          </div>
          <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{entityName}</h1>
          {meta ? <div className="mt-3">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
