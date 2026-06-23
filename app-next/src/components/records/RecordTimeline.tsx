"use client";

import {
  ActivityIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  MessageSquareIcon,
  NotebookTextIcon,
  RadioIcon,
  SendIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RecordTimelineItem = {
  id: string;
  type: "note" | "task" | "diagnostic" | "proposal" | "activity" | "outreach" | "status";
  title: string;
  description?: React.ReactNode;
  datetime?: string | null;
  meta?: React.ReactNode;
};

const timelineIconMap = {
  activity: ActivityIcon,
  diagnostic: RadioIcon,
  note: NotebookTextIcon,
  outreach: SendIcon,
  proposal: FileTextIcon,
  status: MessageSquareIcon,
  task: ClipboardCheckIcon
};

const timelineTypeLabel = {
  activity: "Atividade",
  diagnostic: "Diagnóstico",
  note: "Nota",
  outreach: "Outreach",
  proposal: "Proposta",
  status: "Status",
  task: "Tarefa"
};

function getDateLabel(datetime?: string | null) {
  if (!datetime) return "Sem data";
  const parsed = new Date(datetime);
  if (Number.isNaN(parsed.getTime())) return "Sem data";
  return parsed.toLocaleDateString("pt-BR");
}

function getTimeLabel(datetime?: string | null) {
  if (!datetime) return null;
  const parsed = new Date(datetime);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function RecordTimeline({
  title = "Timeline",
  items,
  emptyLabel = "Nenhum evento registrado.",
  className
}: {
  title?: string;
  items: RecordTimelineItem[];
  emptyLabel?: string;
  className?: string;
}) {
  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.datetime ? new Date(a.datetime).getTime() : 0;
    const dateB = b.datetime ? new Date(b.datetime).getTime() : 0;
    return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
  });

  const groups = sortedItems.reduce<Record<string, RecordTimelineItem[]>>((acc, item) => {
    const label = getDateLabel(item.datetime);
    acc[label] = acc[label] ? [...acc[label], item] : [item];
    return acc;
  }, {});

  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card/75 p-4 backdrop-blur-md", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</h2>
        <Badge variant="outline" className="text-[10px]">{items.length} itens</Badge>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(groups).map(([date, dateItems]) => (
            <div key={date} className="flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{date}</div>
              <div className="relative flex flex-col gap-2 border-l border-border/70 pl-4">
                {dateItems.map((item) => {
                  const Icon = timelineIconMap[item.type];
                  const label = timelineTypeLabel[item.type];

                  return (
                    <article key={item.id} className="relative rounded-xl border border-border/70 bg-background/45 p-3">
                      <span className="absolute -left-[23px] top-4 flex size-4 items-center justify-center rounded-full border border-border bg-background">
                        <Icon className="size-2.5 text-primary" />
                      </span>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="h-5 px-1.5 py-0 text-[9px] uppercase tracking-wider">
                              {label}
                            </Badge>
                            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                          </div>
                          {item.description ? <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</div> : null}
                        </div>
                        {getTimeLabel(item.datetime) ? (
                          <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{getTimeLabel(item.datetime)}</span>
                        ) : null}
                      </div>
                      {item.meta ? <div className="mt-2 text-[10px] text-muted-foreground">{item.meta}</div> : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
