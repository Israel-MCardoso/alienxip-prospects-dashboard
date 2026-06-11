import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActivityRow, ProfileRow, ProspectRow, ProjectRow } from "./data";

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
        {activities.length === 0 ? <p className="text-sm text-muted-foreground">Nada registrado neste periodo.</p> : null}
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
  error
}: {
  grouped: { today: ActivityRow[]; yesterday: ActivityRow[]; last7: ActivityRow[] };
  profiles: ProfileRow[];
  prospects: ProspectRow[];
  projects: ProjectRow[];
  error: string | null;
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
            <select name="actor_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos usuarios</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>)}
            </select>
            <select name="entity_type" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Todos tipos</option>
              <option value="prospect">Prospect</option>
              <option value="project">Projeto</option>
              <option value="client">Cliente</option>
              <option value="task">Task</option>
            </select>
            <select name="project_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Projeto</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <select name="prospect_id" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="">Prospect</option>
              {prospects.map((prospect) => <option key={prospect.id} value={prospect.id}>{prospect.name}</option>)}
            </select>
            <div className="flex gap-2">
              <Input name="client_id" placeholder="ID cliente" />
              <Button type="submit">Filtrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Group title="Hoje" activities={grouped.today} profiles={profiles} />
      <Group title="Ontem" activities={grouped.yesterday} profiles={profiles} />
      <Group title="Ultimos 7 dias" activities={grouped.last7} profiles={profiles} />
    </div>
  );
}
