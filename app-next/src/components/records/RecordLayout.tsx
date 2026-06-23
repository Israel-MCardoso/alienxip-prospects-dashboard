"use client";

import { cn } from "@/lib/utils";

export function RecordLayout({
  header,
  left,
  main,
  right,
  className
}: {
  header?: React.ReactNode;
  left?: React.ReactNode;
  main: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-5", className)}>
      {header ? <div>{header}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px] lg:grid-cols-[260px_minmax(0,1fr)]">
        {left ? <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">{left}</aside> : null}
        <main className="min-w-0">{main}</main>
        {right ? <aside className="min-w-0 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-20 xl:self-start">{right}</aside> : null}
      </div>
    </section>
  );
}
