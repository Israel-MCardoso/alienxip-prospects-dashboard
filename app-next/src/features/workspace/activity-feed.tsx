import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { ActivityRow, ProfileRow, ProspectRow, ProjectRow } from "./data";
import { Pagination } from "@/components/ui/pagination";

function actorName(profiles: ProfileRow[], actorId: string | null) {
  const profile = profiles.find((item) => item.id === actorId);
  return profile?.full_name || profile?.email || "Sistema";
}

function activityHref(activity: ActivityRow) {
  if (activity.entity_type === "prospect") return `/os/prospects/${activity.entity_id}`;
  if (activity.entity_type === "project") return `/os/projects/${activity.entity_id}`;
  if (activity.entity_type === "client") return `/os/clients/${activity.entity_id}`;
  if (activity.entity_type === "company") return `/os/companies/${activity.entity_id}`;
  return "/os/activity";
}

function Group({ title, activities, profiles }: { title: string; activities: ActivityRow[]; profiles: ProfileRow[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{activities.length} atividade(s)</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-2">
        {activities.length === 0 ? (
          <EmptyState
            title="Sem atividades"
            description="Nenhum evento operacional foi registrado neste período."
            className="p-6"
          />
        ) : null}
        {activities.map((activity) => (
          <Link key={activity.id} href={activityHref(activity)} className="rounded-lg border p-3 hover:bg-muted/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{actorName(profiles, activity.actor_id)}</span>
              <span>{activity.title}</span>
              <Badge variant="outline">{activity.entity_type}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{activity.description || activity.action}</div>
            <div className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString("pt-BR")}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function ActivityFeed({
  grouped,
  profiles,
  prospects,
  projects,
  error,
  currentPage,
  totalPages,
  totalItems
}: {
  grouped: { today: ActivityRow[]; yesterday: ActivityRow[]; last7: ActivityRow[] };
  profiles: ProfileRow[];
  prospects: ProspectRow[];
  projects: ProjectRow[];
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Atividades</h1>
        <p className="text-sm text-muted-foreground">Linha do tempo operacional unificada do MOTHERXIP.</p>
      </div>

      {error ? <Card><CardHeader><CardTitle>Erro ao carregar atividades</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card> : null}

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5">
            <CustomSelect
              name="actor_id"
              defaultValue=""
              options={[
                { value: "", label: "Todos os usuários" },
                ...profiles.map((profile) => ({ value: profile.id, label: profile.full_name || profile.email }))
              ]}
            />
            <CustomSelect
              name="entity_type"
              defaultValue=""
              options={[
                { value: "", label: "Todos os tipos" },
                { value: "prospect", label: "Prospect" },
                { value: "project", label: "Projeto" },
                { value: "client", label: "Cliente" },
                { value: "task", label: "Task" }
              ]}
            />
            <CustomSelect
              name="project_id"
              defaultValue=""
              options={[
                { value: "", label: "Projeto" },
                ...projects.map((project) => ({ value: project.id, label: project.name }))
              ]}
            />
            <CustomSelect
              name="prospect_id"
              defaultValue=""
              options={[
                { value: "", label: "Prospect" },
                ...prospects.map((prospect) => ({ value: prospect.id, label: prospect.name }))
              ]}
            />
            <div className="flex gap-2">
              <Input name="client_id" placeholder="ID do cliente" />
              <Button type="submit">Filtrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Group title="Hoje" activities={grouped.today} profiles={profiles} />
      <Group title="Ontem" activities={grouped.yesterday} profiles={profiles} />
      <Group title="Últimos 7 dias" activities={grouped.last7} profiles={profiles} />
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} />
    </div>
  );
}
