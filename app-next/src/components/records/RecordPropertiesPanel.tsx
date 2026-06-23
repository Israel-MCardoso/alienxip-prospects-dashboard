"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export type RecordProperty = {
  label: string;
  value: React.ReactNode;
  href?: string;
};

export function RecordPropertiesPanel({
  title = "Propriedades",
  description,
  properties,
  className
}: {
  title?: string;
  description?: string;
  properties: RecordProperty[];
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card/75 p-4 backdrop-blur-md", className)}>
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <dl className="flex flex-col divide-y divide-border/60">
        {properties.map((property) => (
          <div key={property.label} className="grid gap-1 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{property.label}</dt>
            <dd className="min-w-0 text-sm font-medium text-foreground">
              {property.href ? (
                <Link href={property.href} className="truncate text-primary hover:underline">
                  {property.value || "-"}
                </Link>
              ) : (
                property.value || "-"
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
