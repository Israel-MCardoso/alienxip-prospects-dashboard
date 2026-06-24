"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RecordAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  description?: string;
  disabled?: boolean;
};

export function RecordActionsPanel({
  title = "Ações rápidas",
  actions,
  sections,
  className
}: {
  title?: string;
  actions?: RecordAction[];
  sections?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card/75 p-4 backdrop-blur-md", className)}>
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</h2>
      {actions?.length ? (
        <div className="mt-4 flex flex-col gap-2">
          {actions.map((action) => (
            <div key={action.label} className="rounded-xl border border-border/60 bg-background/35 p-2">
              <Button
                size="sm"
                variant="outline"
                disabled={action.disabled}
                onClick={action.onClick}
                className="w-full justify-start text-xs"
                render={action.href ? <Link href={action.href} /> : undefined}
              >
                {action.label}
              </Button>
              {action.description ? <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground">{action.description}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {sections ? <div className="mt-4 flex flex-col gap-3">{sections}</div> : null}
    </section>
  );
}
