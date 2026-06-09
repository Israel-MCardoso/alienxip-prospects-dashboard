"use client";

import Link from "next/link";
import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildGlobalSearchResults } from "@/features/workspace/workspace-helpers";
import type { ClientRow, CompanyRow, ProjectRow, ProspectRow, TaskRow } from "@/features/workspace/data";
import { buildTechSearchResults } from "@/features/tech/tech-helpers";
import type { ProjectNoteRow, TechBacklogRow, TechBugRow, TechIncidentRow, TechRoadmapRow, TechnicalDecisionRow } from "@/features/tech/data";
import { buildKnowledgeSearchResults } from "@/features/knowledge/knowledge-helpers";
import type { FileRow, PlaybookRow, WikiPageRow } from "@/features/knowledge/data";

export type GlobalSearchData = {
  prospects: ProspectRow[];
  companies: CompanyRow[];
  clients: ClientRow[];
  projects: ProjectRow[];
  tasks: TaskRow[];
  bugs?: TechBugRow[];
  incidents?: TechIncidentRow[];
  backlog?: TechBacklogRow[];
  roadmap?: TechRoadmapRow[];
  decisions?: TechnicalDecisionRow[];
  projectNotes?: ProjectNoteRow[];
  wikiPages?: WikiPageRow[];
  playbooks?: PlaybookRow[];
  files?: FileRow[];
};

export function GlobalSearch({ data }: { data: GlobalSearchData }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => [
    ...buildGlobalSearchResults(query, data),
    ...buildTechSearchResults(query, {
      bugs: data.bugs || [],
      incidents: data.incidents || [],
      backlog: data.backlog || [],
      roadmap: data.roadmap || [],
      decisions: data.decisions || [],
      projectNotes: data.projectNotes || []
    }),
    ...buildKnowledgeSearchResults(query, {
      wikiPages: data.wikiPages || [],
      playbooks: data.playbooks || [],
      files: data.files || []
    })
  ].slice(0, 16), [query, data]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
        <SearchIcon data-icon="inline-start" />
        Search
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur">
          <div className="mx-auto mt-16 max-w-2xl rounded-lg border bg-background shadow-lg">
            <div className="flex items-center gap-2 border-b p-3">
              <SearchIcon className="text-muted-foreground" />
              <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar prospects, empresas, clientes, projetos e tarefas" />
              <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}><XIcon /></Button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-2">
              {query && results.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum resultado encontrado.</p> : null}
              {!query ? <p className="p-4 text-sm text-muted-foreground">Digite para pesquisar. Atalho: Ctrl + K.</p> : null}
              {results.map((item) => (
                <Link
                  key={`${item.type}-${item.href}-${item.title}`}
                  href={item.href}
                  className="block rounded-lg p-3 hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs uppercase text-muted-foreground">{item.type}</span>
                  </div>
                  {item.description ? <div className="text-sm text-muted-foreground">{item.description}</div> : null}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
