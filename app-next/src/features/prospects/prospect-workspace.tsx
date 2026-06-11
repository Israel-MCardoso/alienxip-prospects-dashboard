"use client";

import Link from "next/link";
import { useState } from "react";

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
  CommercialTaskRow,
  FileRow,
  ProspectActivityRow,
  ProspectDiagnosticRow,
  ProspectNoteRow,
  ProspectRow
} from "./data";
import type { ProfileRow, ClientRow, CompanyRow } from "@/features/workspace/data";
import {
  archiveProspectAction,
  createNoteAction,
  duplicateProspectAction,
  restoreProspectAction,
  saveDiagnosticAction,
  updateNoteAction
} from "./actions";
import { activityLabel, formatActivityDate } from "./workspace-helpers";
import { completeTaskAction, convertProspectAction, createTaskAction } from "@/features/commercial/actions";
import { taskPriorities, taskStatuses } from "@/features/commercial/commercial-helpers";
import { FileList } from "@/features/tech/file-list";
import { statusLabel, priorityLabel, temperatureLabel } from "@/lib/display-helpers";

export function ProspectWorkspace({
  prospect,
  diagnostic,
  notes,
  activities,
  tasks,
  files,
  profiles = [],
  clients = [],
  companies = []
}: {
  prospect: ProspectRow;
  diagnostic: ProspectDiagnosticRow | null;
  notes: ProspectNoteRow[];
  activities: ProspectActivityRow[];
  tasks: CommercialTaskRow[];
  files: FileRow[];
  profiles?: ProfileRow[];
  clients?: ClientRow[];
  companies?: CompanyRow[];
}) {
  const clientObj = clients.find((c) => c.id === prospect.converted_client_id);
  const clientCompany = companies.find((c) => c.id === clientObj?.company_id);
  const resolvedClientLabel = clientCompany
    ? `${clientObj?.main_contact_name || "Contato"} (${clientCompany.name})`
    : (clientObj?.main_contact_name || prospect.converted_client_id || "-");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{statusLabel(prospect.status)}</Badge>
            <Badge variant={prospect.temperature === "hot" ? "destructive" : "outline"}>
              {temperatureLabel(prospect.temperature)}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{prospect.name}</h1>
          <p className="text-sm text-muted-foreground">
            Responsável: {profiles.find((p) => p.id === prospect.responsible_user_id)?.full_name || profiles.find((p) => p.id === prospect.responsible_user_id)?.email || prospect.responsible_user_id || "não definido"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" render={<Link href="/os/prospects" />}>Voltar</Button>
          <Button variant="outline" render={<Link href={`/os/prospects/${prospect.id}/edit`} />}>Editar</Button>
          <form action={duplicateProspectAction.bind(null, prospect.id)}>
            <Button variant="outline" type="submit">Duplicar</Button>
          </form>
          {prospect.status === "archived" ? (
            <form action={restoreProspectAction.bind(null, prospect.id)}>
              <Button variant="outline" type="submit">Restaurar</Button>
            </form>
          ) : (
            <form action={archiveProspectAction.bind(null, prospect.id)}>
              <Button variant="outline" type="submit">Arquivar</Button>
            </form>
          )}
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
          <TabsTrigger value="tasks">Follow-ups</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab prospect={prospect} resolvedClientLabel={resolvedClientLabel} />
        </TabsContent>
        <TabsContent value="diagnostic">
          <DiagnosticTab prospectId={prospect.id} diagnostic={diagnostic} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab prospectId={prospect.id} notes={notes} profiles={profiles} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab prospect={prospect} tasks={tasks} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab activities={activities} />
        </TabsContent>
        <TabsContent value="files">
          <FileList files={files} entityLabel="este prospect" entityType="prospect" entityId={prospect.id} />
        </TabsContent>
        <TabsContent value="conversations">
          <Placeholder title="Conversas" description="Chat real e integracoes externas ainda nao foram implementados." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TasksTab({ prospect, tasks }: { prospect: ProspectRow; tasks: CommercialTaskRow[] }) {
  const action = createTaskAction.bind(null, prospect.id);
  const convertAction = convertProspectAction.bind(null, prospect.id);
  const alreadyConverted = Boolean(prospect.converted_client_id);

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Novo follow-up</CardTitle>
            <CardDescription>Crie a proxima acao comercial para este prospect.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="flex flex-col gap-3">
              <Input name="title" required placeholder="Titulo da tarefa" />
              <Input name="description" placeholder="Descricao" />
              <select name="status" defaultValue="pending" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                {taskStatuses.map((status: string) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
              <select name="priority" defaultValue="medium" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                {taskPriorities.map((priority: string) => <option key={priority} value={priority}>{priorityLabel(priority)}</option>)}
              </select>
              <Input name="due_date" type="date" />
              <Button type="submit">Criar tarefa</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversao</CardTitle>
            <CardDescription>
              {alreadyConverted ? "Este prospect ja foi convertido." : prospect.status === "fechado" ? "Pronto para conversao." : "Pode converter com aviso mesmo antes de fechado."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={convertAction} className="flex flex-col gap-3">
              <Input name="main_contact_name" placeholder="Contato principal" disabled={alreadyConverted} />
              <Input name="main_contact_email" placeholder="Email do contato" disabled={alreadyConverted} />
              <Input name="main_contact_phone" placeholder="Telefone do contato" disabled={alreadyConverted} />
              <Input name="monthly_value" placeholder="Valor mensal futuro" disabled={alreadyConverted} />
              <select name="contract_status" defaultValue="draft" disabled={alreadyConverted} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <Button type="submit" disabled={alreadyConverted}>{alreadyConverted ? "Convertido" : "Converter em Cliente"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups</CardTitle>
          <CardDescription>{tasks.length} tarefa(s) vinculadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa ainda.</p> : null}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{task.title}</div>
                <Badge variant="outline">{statusLabel(task.status)}</Badge>
                <Badge variant={task.priority === "urgent" || task.priority === "high" ? "destructive" : "secondary"}>{priorityLabel(task.priority)}</Badge>
              </div>
              {task.description ? <p className="mt-1 text-sm text-muted-foreground">{task.description}</p> : null}
              <div className="mt-2 text-xs text-muted-foreground">Prazo: {task.due_date || "sem prazo"}</div>
              {task.status !== "completed" ? (
                <form action={completeTaskAction.bind(null, prospect.id, task.id)} className="mt-3">
                  <Button type="submit" size="sm" variant="outline">Marcar como concluida</Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewTab({ prospect, resolvedClientLabel }: { prospect: ProspectRow; resolvedClientLabel: string }) {
  const rows = [
    ["Parceiro", prospect.partner_name || "-"],
    ["Parceiro URL", prospect.partner_url || "-"],
    ["Segmento", prospect.segment || "-"],
    ["Localizacao", [prospect.city, prospect.state].filter(Boolean).join(" / ") || "-"],
    ["Oferta sugerida", prospect.suggested_offer || "-"],
    ["Prioridade", String(prospect.priority_score)],
    ["Cliente convertido", resolvedClientLabel],
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
            <div className="text-sm font-medium">
              {label === "Cliente convertido" && prospect.converted_client_id ? (
                <Link className="text-primary hover:underline" href={`/os/clients/${prospect.converted_client_id}`}>{resolvedClientLabel}</Link>
              ) : value}
            </div>
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

function NotesTab({
  prospectId,
  notes,
  profiles = []
}: {
  prospectId: string;
  notes: ProspectNoteRow[];
  profiles?: ProfileRow[];
}) {
  const action = createNoteAction.bind(null, prospectId);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleSaveNote = async (noteId: string, formData: FormData) => {
    try {
      await updateNoteAction(prospectId, noteId, formData);
      setEditingNoteId(null);
    } catch (err) {
      alert("Erro ao salvar nota: " + (err instanceof Error ? err.message : String(err)));
    }
  };

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
              <option value="observacao">Observação</option>
              <option value="follow_up">Follow-up</option>
              <option value="reuniao">Reunião</option>
              <option value="decisao">Decisão</option>
              <option value="risco">Risco</option>
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
          {notes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const author = profiles.find((p) => p.id === note.author_id);
            const authorName = author ? (author.full_name || author.email) : "não identificado";

            return (
              <div key={note.id} className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {note.type === "observacao" ? "Observação" :
                       note.type === "follow_up" ? "Follow-up" :
                       note.type === "reuniao" ? "Reunião" :
                       note.type === "decisao" ? "Decisão" :
                       note.type === "risco" ? "Risco" : note.type}
                    </Badge>
                    <span>{formatActivityDate(note.created_at)}</span>
                    <span className="font-medium text-white">autor: {authorName}</span>
                  </div>
                  {!isEditing && (
                    <Button variant="ghost" size="xs" onClick={() => setEditingNoteId(note.id)}>
                      Editar
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form action={handleSaveNote.bind(null, note.id)} className="mt-2 flex flex-col gap-2">
                    <select name="type" defaultValue={note.type} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                      <option value="observacao">Observação</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="reuniao">Reunião</option>
                      <option value="decisao">Decisão</option>
                      <option value="risco">Risco</option>
                    </select>
                    <textarea name="content" defaultValue={note.content} className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm" required />
                    <div className="flex gap-2">
                      <Button type="submit" variant="outline" size="sm" className="bg-[#7B2EFF] text-white hover:bg-[#9D5CFF]">Salvar nota</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            );
          })}
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
