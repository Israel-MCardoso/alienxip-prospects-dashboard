import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TechBacklogRow, TechBugRow, TechIncidentRow, TechRoadmapRow, TechnicalDecisionRow } from "./data";

const modules = [
  { title: "Bugs", href: "/os/tech/bugs", description: "Falhas, regressões e problemas funcionais." },
  { title: "Incidentes", href: "/os/tech/incidents", description: "Eventos operacionais com impacto real." },
  { title: "Backlog Técnico", href: "/os/tech/backlog", description: "Dívida, refactors, infraestrutura e segurança." },
  { title: "Roadmap", href: "/os/tech/roadmap", description: "Evoluções técnicas planejadas." },
  { title: "Decisões Técnicas", href: "/os/tech/decisions", description: "ADR interno da ALIENXIP OS." },
  { title: "Deployments", href: "/os/tech", description: "Placeholder para integração futura com Vercel." }
];

export function TechCenter({
  bugs,
  incidents,
  backlog,
  roadmap,
  decisions,
  error
}: {
  bugs: TechBugRow[];
  incidents: TechIncidentRow[];
  backlog: TechBacklogRow[];
  roadmap: TechRoadmapRow[];
  decisions: TechnicalDecisionRow[];
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tech Center</h1>
        <p className="text-sm text-muted-foreground">Centro técnico para confiabilidade, arquitetura e evolução operacional.</p>
      </div>
      {error ? <Card><CardHeader><CardTitle>Dados parciais</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.title} href={module.href} className="rounded-lg border bg-background p-4 hover:bg-muted/50">
            <div className="font-semibold">{module.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Bugs abertos</div><div className="text-3xl font-semibold">{bugs.filter((item) => !["fixed", "closed", "wont_fix"].includes(item.status)).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Incidentes ativos</div><div className="text-3xl font-semibold">{incidents.filter((item) => item.status !== "resolved").length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Backlog aberto</div><div className="text-3xl font-semibold">{backlog.filter((item) => item.status !== "done").length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Roadmap ativo</div><div className="text-3xl font-semibold">{roadmap.filter((item) => !["shipped", "canceled"].includes(item.status)).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">ADRs</div><div className="text-3xl font-semibold">{decisions.length}</div></CardContent></Card>
      </div>
    </div>
  );
}
