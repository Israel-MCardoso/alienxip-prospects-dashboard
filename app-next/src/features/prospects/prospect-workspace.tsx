import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ProspectActivityRow,
  ProspectDiagnosticRow,
  ProspectNoteRow,
  ProspectRow
} from "./data";
import { createNoteAction, saveDiagnosticAction, updateNoteAction } from "./actions";
import { activityLabel, formatActivityDate } from "./workspace-helpers";

export function ProspectWorkspace({
  prospect,
  diagnostic,
  notes,
  activities
}: {
  prospect: ProspectRow;
  diagnostic: ProspectDiagnosticRow | null;
  notes: ProspectNoteRow[];
  activities: ProspectActivityRow[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{prospect.status}</Badge>
            <Badge variant={prospect.temperature === "hot" ? "destructive" : "outline"}>
              {prospect.temperature}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{prospect.name}</h1>
          <p className="text-sm text-muted-foreground">
            Responsavel: {prospect.responsible_user_id || "nao definido"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/os/prospects" />}>Voltar</Button>
          <Button variant="outline" render={<Link href={`/os/prospects/${prospect.id}/edit`} />}>Editar</Button>
          {prospect.instagram_url ? <Button variant="outline" render={<a href={prospect.instagram_url} target="_blank" rel="noreferrer" />}>Instagram</Button> : null}
          {prospect.website_url ? <Button variant="outline" render={<a href={prospect.website_url} target="_blank" rel="noreferrer" />}>Site</Button> : null}
          {prospect.whatsapp ? <Button variant="outline" render={<a href={prospect.whatsapp} target="_blank" rel="noreferrer" />}>WhatsApp</Button> : null}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostico Digital</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab prospect={prospect} />
        </TabsContent>
        <TabsContent value="diagnostic">
          <DiagnosticTab prospectId={prospect.id} diagnostic={diagnostic} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab prospectId={prospect.id} notes={notes} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab activities={activities} />
        </TabsContent>
        <TabsContent value="files">
          <Placeholder title="Arquivos" description="Storage e anexos entram em sprint futura." />
        </TabsContent>
        <TabsContent value="conversations">
          <Placeholder title="Conversas" description="Chat real e integracoes externas ainda nao foram implementados." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ prospect }: { prospect: ProspectRow }) {
  const rows = [
    ["Parceiro", prospect.partner_name || "-"],
    ["Parceiro URL", prospect.partner_url || "-"],
    ["Segmento", prospect.segment || "-"],
    ["Localizacao", [prospect.city, prospect.state].filter(Boolean).join(" / ") || "-"],
    ["Oferta sugerida", prospect.suggested_offer || "-"],
    ["Prioridade", String(prospect.priority_score)],
    ["Observacoes", prospect.notes || "-"]
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visao Geral</CardTitle>
        <CardDescription>Dados principais do prospect e contexto comercial.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-medium">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DiagnosticTab({ prospectId, diagnostic }: { prospectId: string; diagnostic: ProspectDiagnosticRow | null }) {
  const action = saveDiagnosticAction.bind(null, prospectId, diagnostic?.id || null);
  const opportunities = Array.isArray(diagnostic?.opportunities) ? diagnostic.opportunities.join("\n") : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostico Digital</CardTitle>
        <CardDescription>Registre sinais digitais e oportunidades identificadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="facebook_notes" placeholder="Facebook" defaultValue={diagnostic?.facebook_notes || ""} />
          <Input name="instagram_notes" placeholder="Instagram" defaultValue={diagnostic?.instagram_notes || ""} />
          <Input name="whatsapp_notes" placeholder="WhatsApp automatizado" defaultValue={diagnostic?.whatsapp_notes || ""} />
          <Input name="website_notes" placeholder="Landing Page / Site" defaultValue={diagnostic?.website_notes || ""} />
          <Input name="google_business_notes" placeholder="Google Meu Negocio" defaultValue={diagnostic?.google_business_notes || ""} />
          <Input name="diagnosis_summary" placeholder="Resumo do diagnostico" defaultValue={diagnostic?.diagnosis_summary || ""} />
          <textarea name="opportunities" placeholder="Oportunidades identificadas, uma por linha" defaultValue={opportunities} className="min-h-28 rounded-lg border border-input bg-background px-3 py-2 text-sm md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">{diagnostic ? "Atualizar diagnostico" : "Criar diagnostico"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function NotesTab({ prospectId, notes }: { prospectId: string; notes: ProspectNoteRow[] }) {
  const action = createNoteAction.bind(null, prospectId);

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nova nota</CardTitle>
          <CardDescription>Notas internas para acompanhamento do prospect.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-3">
            <select name="type" defaultValue="observacao" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="observacao">observacao</option>
              <option value="follow_up">follow-up</option>
              <option value="reuniao">reuniao</option>
              <option value="decisao">decisao</option>
              <option value="risco">risco</option>
            </select>
            <textarea name="content" required placeholder="Escreva uma nota interna" className="min-h-28 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <Button type="submit">Criar nota</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas internas</CardTitle>
          <CardDescription>{notes.length} nota(s) registradas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {notes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma nota ainda.</p> : null}
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-background p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{note.type}</Badge>
                <span>{formatActivityDate(note.created_at)}</span>
                <span>autor: {note.author_id || "nao identificado"}</span>
              </div>
              <form action={updateNoteAction.bind(null, prospectId, note.id)} className="mt-2 flex flex-col gap-2">
                <select name="type" defaultValue={note.type} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                  <option value="observacao">observacao</option>
                  <option value="follow_up">follow-up</option>
                  <option value="reuniao">reuniao</option>
                  <option value="decisao">decisao</option>
                  <option value="risco">risco</option>
                </select>
                <textarea name="content" defaultValue={note.content} className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <div>
                  <Button type="submit" variant="outline" size="sm">Salvar nota</Button>
                </div>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineTab({ activities }: { activities: ProspectActivityRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>Historico operacional do prospect.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {activities.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p> : null}
        {activities.map((activity) => (
          <div key={activity.id} className="rounded-lg border bg-background p-3">
            <div className="font-medium">{activityLabel(activity.action_type)}</div>
            <div className="text-xs text-muted-foreground">{formatActivityDate(activity.created_at)}</div>
            {activity.description ? <p className="mt-1 text-sm">{activity.description}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
