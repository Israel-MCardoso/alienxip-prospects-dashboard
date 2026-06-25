"use client";

import Link from "next/link";
import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2Icon,
  CalendarIcon,
  MapPinIcon,
  TrendingUpIcon,
  ChevronRightIcon,
  GlobeIcon,
  BookOpenIcon,
  PlusIcon,
  FileTextIcon,
  PlayIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RecordActionsPanel,
  RecordLayout,
  RecordPropertiesPanel,
  RecordTimeline,
  type RecordTimelineItem,
  type RecordProperty
} from "@/components/records";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CommercialTaskRow,
  FileRow,
  ProspectActivityRow,
  ProspectDiagnosticRow,
  ProspectNoteRow,
  ProspectRow,
  ProspectProposalRow
} from "./data";
import type { ProspectOutreachRow, OutreachEventRow } from "@/types/outreach";
import { pauseOutreachAction, stopOutreachAction, resumeOutreachAction, testSdrSandboxAction } from "@/features/outreach/actions";
import type { ProfileRow, ClientRow, CompanyRow } from "@/features/workspace/data";
import {
  createNoteAction,
  saveDiagnosticAction,
  updateNoteAction,
  generateAiDiagnosticAction,
  createProposalAction
} from "./actions";
import { activityLabel, formatActivityDate } from "./workspace-helpers";
import { completeTaskAction, convertProspectAction, createTaskAction } from "@/features/commercial/actions";
import { taskPriorities, taskStatuses } from "@/features/commercial/commercial-helpers";
import { FileList } from "@/features/tech/file-list";
import { statusLabel, priorityLabel, temperatureLabel, whatsappHref, formatCurrency } from "@/lib/display-helpers";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AiBrainPanel } from "@/features/ai/ai-brain-panel";
import { AssignResponsibleSelect } from "./assign-responsible-select";

// Industry Playbooks Recommendation Map
const getRecommendedPlaybooks = (segment: string | null) => {
  const seg = (segment || "").toLowerCase();
  const recs = [];
  
  if (seg.includes("dentista") || seg.includes("odont") || seg.includes("clinica") || seg.includes("estetica") || seg.includes("beleza")) {
    recs.push({ id: "055b9b3f-a9e9-4c80-a01b-5d6f042e63e3", title: "Diagnóstico Digital", desc: "Auditoria de presença online local." });
    recs.push({ id: "c91e4865-44fa-4ff7-b115-ceae264ce5ce", title: "Follow-up", desc: "Cadência pós-primeira abordagem." });
  } else if (seg.includes("restaurante") || seg.includes("alimen") || seg.includes("pizza") || seg.includes("burg")) {
    recs.push({ id: "055b9b3f-a9e9-4c80-a01b-5d6f042e63e3", title: "Diagnóstico Digital", desc: "Auditoria de canais de delivery e Google." });
    recs.push({ id: "4d366030-9c03-42fe-ac79-2d9f61a9fdf2", title: "Prospecção Fria", desc: "Script de abordagem comercial." });
  } else if (seg.includes("construtora") || seg.includes("engenha") || seg.includes("reform")) {
    recs.push({ id: "d69e1fb5-fbc0-4fdd-a7a1-c8276f2c1811", title: "Sistema Web", desc: "Venda de soluções e portfólio digital." });
    recs.push({ id: "c91e4865-44fa-4ff7-b115-ceae264ce5ce", title: "Follow-up", desc: "Cadência comercial corporativa." });
  } else {
    recs.push({ id: "4d366030-9c03-42fe-ac79-2d9f61a9fdf2", title: "Prospecção Fria", desc: "Aproximação inicial." });
    recs.push({ id: "c91e4865-44fa-4ff7-b115-ceae264ce5ce", title: "Follow-up", desc: "Roteiro de e-mail e ligações." });
  }
  return recs;
};

function buildProspectTimelineItems({
  prospect,
  diagnostic,
  notes,
  activities,
  tasks,
  proposals,
  outreachEvents
}: {
  prospect: ProspectRow;
  diagnostic: ProspectDiagnosticRow | null;
  notes: ProspectNoteRow[];
  activities: ProspectActivityRow[];
  tasks: CommercialTaskRow[];
  proposals: ProspectProposalRow[];
  outreachEvents: OutreachEventRow[];
}): RecordTimelineItem[] {
  return [
    {
      id: `prospect-created-${prospect.id}`,
      type: "status",
      title: "Prospect cadastrado",
      description: `${statusLabel(prospect.status)} | ${temperatureLabel(prospect.temperature)}`,
      datetime: prospect.created_at
    },
    ...(diagnostic ? [{
      id: `diagnostic-${diagnostic.id}`,
      type: "diagnostic" as const,
      title: "Diagnostico digital",
      description: diagnostic.diagnosis_summary || "Diagnostico registrado no workspace.",
      datetime: diagnostic.updated_at || diagnostic.created_at,
      meta: diagnostic.created_at ? `Criado em ${new Date(diagnostic.created_at).toLocaleDateString("pt-BR")}` : undefined
    }] : []),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      type: "note" as const,
      title: `Nota: ${note.type}`,
      description: note.content,
      datetime: note.updated_at || note.created_at
    })),
    ...activities.map((activity) => ({
      id: `activity-${activity.id}`,
      type: activity.action_type === "status_changed" ? "status" as const : "activity" as const,
      title: activityLabel(activity.action_type),
      description: activity.description || "Atividade registrada.",
      datetime: activity.created_at
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      type: "task" as const,
      title: task.title,
      description: task.description || `Status: ${statusLabel(task.status)} | Prioridade: ${priorityLabel(task.priority)}`,
      datetime: task.due_date || task.updated_at || task.created_at,
      meta: `Status: ${statusLabel(task.status)} | Prioridade: ${priorityLabel(task.priority)}`
    })),
    ...proposals.map((proposal) => ({
      id: `proposal-${proposal.id}`,
      type: "proposal" as const,
      title: proposal.title,
      description: proposal.content || `Valor: ${formatCurrency(Number(proposal.value))}`,
      datetime: proposal.updated_at || proposal.created_at,
      meta: `Status: ${proposal.status} | Valor: ${formatCurrency(Number(proposal.value))}`
    })),
    ...outreachEvents.map((event) => ({
      id: `outreach-${event.id}`,
      type: "outreach" as const,
      title: event.event_type,
      description: event.message || `Canal: ${event.channel}`,
      datetime: event.created_at,
      meta: `Status: ${event.status} | Canal: ${event.channel}`
    }))
  ];
}

export function ProspectWorkspace({
  prospect,
  diagnostic,
  notes,
  activities,
  tasks,
  files,
  proposals = [],
  profiles = [],
  clients = [],
  companies = [],
  outreach,
  outreachEvents = []
}: {
  prospect: ProspectRow;
  diagnostic: ProspectDiagnosticRow | null;
  notes: ProspectNoteRow[];
  activities: ProspectActivityRow[];
  tasks: CommercialTaskRow[];
  files: FileRow[];
  proposals?: ProspectProposalRow[];
  profiles?: ProfileRow[];
  clients?: ClientRow[];
  companies?: CompanyRow[];
  outreach?: ProspectOutreachRow | null;
  outreachEvents?: OutreachEventRow[];
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleOpenTasksTab = () => {
    setActiveTab("tasks");
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  const [aiStep, setAiStep] = useState<string | null>(null);

  const clientObj = clients.find((c) => c.id === prospect.converted_client_id);
  const clientCompany = companies.find((c) => c.id === clientObj?.company_id);
  const resolvedClientLabel = clientCompany
    ? `${clientObj?.main_contact_name || "Contato"} (${clientCompany.name})`
    : (clientObj?.main_contact_name || prospect.converted_client_id || "-");

  const playbooks = getRecommendedPlaybooks(prospect.segment);
  const responsibleProfile = profiles.find((p) => p.id === prospect.responsible_user_id);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const timelineItems = buildProspectTimelineItems({
    prospect,
    diagnostic,
    notes,
    activities,
    tasks,
    proposals,
    outreachEvents
  });
  const recordProperties: RecordProperty[] = [
    { label: "Segmento", value: prospect.segment || "Sem segmento" },
    { label: "Cidade/UF", value: [prospect.city, prospect.state].filter(Boolean).join(" / ") || "Local nao definido" },
    { label: "Origem", value: prospect.source || "-" },
    { label: "Score", value: prospect.priority_score ?? 0 },
    { label: "Responsavel", value: responsibleProfile?.full_name || responsibleProfile?.email || "Nao definido" },
    { label: "Cliente convertido", value: resolvedClientLabel },
    { label: "Criado em", value: new Date(prospect.created_at).toLocaleDateString("pt-BR") }
  ];

  const handleGenerateDiagnostic = () => {
    setActiveTab("diagnostic");
    startTransition(async () => {
      setAiStep("Auditando presença digital...");
      try {
        await generateAiDiagnosticAction(prospect.id);
      } catch (err) {
        toast.error("Não foi possível gerar o diagnóstico.", err instanceof Error ? err.message : String(err));
      } finally {
        setAiStep(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. CABEÇALHO COMERCIAL OPERACIONAL */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#0e0e12]/80 to-[#060608]/80 p-6 backdrop-blur-md shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="text-[10px] uppercase font-mono bg-purple-950/20 text-purple-300 border-purple-500/20 py-0 px-2 h-5">
                {statusLabel(prospect.status)}
              </Badge>
              <Badge
                variant={prospect.temperature === "hot" ? "destructive" : "outline"}
                className={`text-[10px] uppercase font-mono py-0 px-2 h-5 ${
                  prospect.temperature === "hot"
                    ? "bg-rose-950/30 text-rose-300 border-rose-500/20"
                    : prospect.temperature === "warm"
                    ? "bg-amber-950/20 text-amber-300 border-amber-500/20"
                    : "bg-blue-950/20 text-blue-300 border-blue-500/20"
                }`}
              >
                {temperatureLabel(prospect.temperature)}
              </Badge>
              <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Score: {prospect.priority_score ?? 0}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1 truncate">{prospect.name}</h1>
            
            {/* Meta Grid */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2Icon className="size-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{prospect.segment || "Sem segmento"}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPinIcon className="size-3.5 text-purple-400 shrink-0" />
                <span className="truncate">
                  {[prospect.city, prospect.state].filter(Boolean).join(" / ") || "Local não definido"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <CalendarIcon className="size-3.5 text-purple-400 shrink-0" />
                <span>Criado em: {new Date(prospect.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <GlobeIcon className="size-3.5 text-purple-400 shrink-0" />
                <span className="uppercase font-mono text-[10px]">Origem: {prospect.source}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 items-center shrink-0 self-end lg:self-start">
            <Button variant="outline" size="sm" render={<Link href="/os/prospects" />}>Voltar</Button>
            <Button variant="outline" size="sm" render={<Link href={`/os/prospects/${prospect.id}/edit`} />}>Editar</Button>
            <Button variant="outline" size="sm" onClick={handleOpenTasksTab}>Criar Tarefa</Button>
            <Button 
              className="bg-purple-950/40 text-purple-300 hover:bg-purple-950/60 border border-purple-500/20" 
              size="sm"
              onClick={handleGenerateDiagnostic}
              disabled={isPending}
            >
              {isPending ? "Analisando..." : "Gerar Diagnóstico IA"}
            </Button>
            <Button 
              className="bg-purple-600 text-white hover:bg-purple-500" 
              size="sm"
              onClick={() => setActiveTab("proposals")}
            >
              Gerar Proposta
            </Button>
          </div>
        </div>
      </div>

      {/* 2. MODULAR RECORD OPERATIONAL LAYOUT */}
      <RecordLayout
        left={
          <RecordPropertiesPanel
            title="Propriedades do prospect"
            description="Dados operacionais principais do registro."
            properties={recordProperties}
          />
        }
        main={
        <div className="flex flex-col gap-5">
          <RecordTimeline
            title="Timeline operacional"
            items={timelineItems}
            emptyLabel="Nenhum historico operacional registrado para este prospect."
          />
          <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap !h-auto bg-[#08080a]/60 border border-white/5 p-1 rounded-xl w-full justify-start gap-1.5 overflow-visible">
              <TabsTrigger value="overview" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Resumo</TabsTrigger>
              <TabsTrigger value="diagnostic" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Diagnóstico IA</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Histórico</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Atividades</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Tarefas</TabsTrigger>
              <TabsTrigger value="files" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Arquivos</TabsTrigger>
              <TabsTrigger value="proposals" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Propostas</TabsTrigger>
              <TabsTrigger value="outreach" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">Automação</TabsTrigger>
              <TabsTrigger value="ai-brain" className="rounded-lg text-xs font-mono py-1.5 px-3 h-8 flex-none">AI Brain</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="overview" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <OverviewTab prospect={prospect} resolvedClientLabel={resolvedClientLabel} notesCount={notes.length} tasksCount={tasks.length} filesCount={files.length} proposalsCount={proposals.length} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="diagnostic" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="diagnostic"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <DiagnosticTab prospectId={prospect.id} diagnostic={diagnostic} aiStep={aiStep} onGenerate={handleGenerateDiagnostic} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <TimelineTab activities={activities} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="notes" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <NotesTab prospectId={prospect.id} notes={notes} profiles={profiles} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <TasksTab prospect={prospect} tasks={tasks} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="files" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <FileList files={files} entityLabel="este prospect" entityType="prospect" entityId={prospect.id} />
                </motion.div>
              </TabsContent>

              <TabsContent value="proposals" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="proposals"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProposalsTab prospectId={prospect.id} proposals={proposals} />
                </motion.div>
              </TabsContent>

              <TabsContent value="outreach" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="outreach"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <OutreachTab prospect={prospect} outreach={outreach || null} outreachEvents={outreachEvents} />
                </motion.div>
              </TabsContent>

              <TabsContent value="ai-brain" className="mt-4 focus-visible:outline-none">
                <motion.div
                  key="ai-brain"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <AiBrainPanel prospect={prospect} diagnostic={diagnostic} />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
          </div>
        </div>
        }
        right={
        <RecordActionsPanel
          actions={[
            { label: "Editar prospect", href: `/os/prospects/${prospect.id}/edit` },
            { label: "Ver pipeline", href: "/os/prospects/pipeline" },
            { label: "Abrir tarefas", onClick: handleOpenTasksTab, description: `${openTasks.length} tarefa(s) aberta(s) neste prospect.` }
          ]}
          sections={
        <div className="flex flex-col gap-6">
          {/* Industry Playbooks Widget */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="size-4 text-purple-400" />
                <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Playbooks Recomendados</CardTitle>
              </div>
              <CardDescription className="text-[10px] text-muted-foreground mt-0.5">Roteiros operacionais baseados no segmento.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              {playbooks.map((pb) => (
                <Link
                  key={pb.id}
                  href={`/os/playbooks/${pb.id}`}
                  target="_blank"
                  className="group flex flex-col rounded-lg border border-white/5 bg-zinc-950/30 p-3 hover:bg-purple-950/10 hover:border-purple-500/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    <span className="truncate">{pb.title}</span>
                    <ChevronRightIcon className="size-3.5 text-muted-foreground group-hover:text-purple-300 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 leading-normal">{pb.desc}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Quick Info Sidebar */}
          <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md text-xs">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Informações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3.5">
              <AssignResponsibleSelect
                prospectId={prospect.id}
                initialResponsibleUserId={prospect.responsible_user_id}
                profiles={profiles}
              />

              {prospect.whatsapp && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">WhatsApp</span>
                  {whatsappHref(prospect.whatsapp) ? (
                    <a href={whatsappHref(prospect.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline truncate">
                      {prospect.whatsapp}
                    </a>
                  ) : (
                    <span className="text-zinc-400 truncate">{prospect.whatsapp}</span>
                  )}
                </div>
              )}

              {prospect.website_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Site Oficial</span>
                  <a href={prospect.website_url} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline truncate">
                    {prospect.website_url}
                  </a>
                </div>
              )}

              {prospect.instagram_url && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Instagram</span>
                  <a href={prospect.instagram_url} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline truncate">
                    {prospect.instagram_url.split("/").pop() || "Acessar Instagram"}
                  </a>
                </div>
              )}

              {(prospect.address_street || prospect.address_number || prospect.address_complement || prospect.neighborhood || prospect.postal_code) && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Endereço</span>
                  <span className="text-zinc-400">
                    {[
                      [prospect.address_street, prospect.address_number].filter(Boolean).join(", "),
                      prospect.address_complement,
                      prospect.neighborhood,
                      prospect.postal_code ? `CEP ${prospect.postal_code}` : null
                    ].filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}

              {prospect.partner_name && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Indicação / Parceiro</span>
                  <div className="text-white">
                    {prospect.partner_url ? (
                      <a href={prospect.partner_url} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline">
                        {prospect.partner_name}
                      </a>
                    ) : prospect.partner_name}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          }
        />
        }
      />
    </div>
  );
}

/* ============================================================================
   Overview Tab Component
   ============================================================================ */
function OverviewTab({ 
  prospect, 
  resolvedClientLabel,
  notesCount,
  tasksCount,
  filesCount,
  proposalsCount
}: { 
  prospect: ProspectRow; 
  resolvedClientLabel: string;
  notesCount: number;
  tasksCount: number;
  filesCount: number;
  proposalsCount: number;
}) {
  const rows = [
    ["Segmento", prospect.segment || "-"],
    ["Localização", [prospect.city, prospect.state].filter(Boolean).join(" / ") || "-"],
    ["Prioridade", String(prospect.priority_score)],
    ["Oferta sugerida", prospect.suggested_offer || "-"],
    ["Cliente convertido", resolvedClientLabel],
    ["Observações", prospect.notes || "-"]
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Counters summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Atividades/Notas", notesCount],
          ["Tarefas/Follow-ups", tasksCount],
          ["Documentos/Anexos", filesCount],
          ["Propostas Geradas", proposalsCount]
        ].map(([label, val]) => (
          <div key={label} className="border border-white/5 rounded-xl bg-[#08080a]/40 p-4 font-mono">
            <span className="text-[9px] uppercase text-zinc-500 tracking-wider block">{label}</span>
            <span className="text-2xl font-bold text-white mt-1 block">{val}</span>
          </div>
        ))}
      </div>

      <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Visão Geral</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Parâmetros e contexto cadastral do lead.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/5 bg-zinc-950/20 p-3.5">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</div>
              <div className="text-sm font-medium mt-1 text-white">
                {label === "Cliente convertido" && prospect.converted_client_id ? (
                  <Link className="text-purple-400 hover:underline" href={`/os/clients/${prospect.converted_client_id}`}>{resolvedClientLabel}</Link>
                ) : value}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================================
   Diagnostic Tab Component (Mock AI execution inside)
   ============================================================================ */
function DiagnosticTab({ 
  prospectId, 
  diagnostic, 
  aiStep, 
  onGenerate 
}: { 
  prospectId: string; 
  diagnostic: ProspectDiagnosticRow | null; 
  aiStep: string | null;
  onGenerate: () => void;
}) {
  const action = saveDiagnosticAction.bind(null, prospectId, diagnostic?.id || null);
  const opportunities = Array.isArray(diagnostic?.opportunities) ? diagnostic.opportunities.join("\n") : "";

  return (
    <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-zinc-950/20">
        <div>
          <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Diagnóstico Digital IA</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Mapeamento da presença digital e pontos de melhoria.</CardDescription>
        </div>
        <Button 
          type="button" 
          onClick={onGenerate} 
          disabled={aiStep !== null} 
          className="bg-purple-950/40 text-purple-300 hover:bg-purple-950/60 border border-purple-500/20 text-xs font-mono h-8 shrink-0"
        >
          {aiStep ? "Processando..." : "Auditar presença"}
        </Button>
      </CardHeader>

      <CardContent className="pt-5">
        {aiStep && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-950/5 p-8 text-center flex flex-col items-center justify-center gap-3 animate-pulse mb-6">
            <TrendingUpIcon className="size-8 text-purple-400 animate-spin" />
            <div className="text-sm font-semibold text-purple-300 font-mono">{aiStep}</div>
            <p className="text-[10px] text-zinc-500">Mecanismos de IA simulando auditoria de SEO local, anúncios e canais.</p>
          </div>
        )}

        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Facebook</span>
            <Input name="facebook_notes" placeholder="Presença no Facebook" defaultValue={diagnostic?.facebook_notes || ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Instagram</span>
            <Input name="instagram_notes" placeholder="Presença no Instagram" defaultValue={diagnostic?.instagram_notes || ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">WhatsApp</span>
            <Input name="whatsapp_notes" placeholder="WhatsApp automatizado" defaultValue={diagnostic?.whatsapp_notes || ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Site / Landing Page</span>
            <Input name="website_notes" placeholder="Landing Page / Site" defaultValue={diagnostic?.website_notes || ""} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Google Meu Negócio</span>
            <Input name="google_business_notes" placeholder="Google Meu Negócio / Avaliação de Notas" defaultValue={diagnostic?.google_business_notes || ""} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Resumo do Diagnóstico</span>
            <Input name="diagnosis_summary" placeholder="Resumo do diagnóstico geral" defaultValue={diagnostic?.diagnosis_summary || ""} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Oportunidades Identificadas (uma por linha)</span>
            <textarea name="opportunities" placeholder="Escreva as oportunidades para oferta digital" defaultValue={opportunities} className="min-h-24 rounded-lg border border-white/5 bg-zinc-950/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/40" />
          </div>

          <div className="md:col-span-2 mt-2">
            <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-500">
              {diagnostic ? "Atualizar diagnóstico" : "Criar diagnóstico"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ============================================================================
   Timeline Tab Component
   ============================================================================ */
function TimelineTab({ activities }: { activities: ProspectActivityRow[] }) {
  return (
    <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Histórico Operacional</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Linha do tempo cronológica com alterações do lead.</CardDescription>
      </CardHeader>
      <CardContent className="relative pl-6 pr-4 pb-6 flex flex-col gap-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-[1px] before:bg-gradient-to-b before:from-purple-500/40 before:via-purple-500/15 before:to-transparent">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>
        ) : null}
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex flex-col gap-1.5 group">
            {/* Glowing dot indicator */}
            <div className="absolute -left-[19.5px] top-1.5 size-2.5 rounded-full bg-purple-500 ring-4 ring-[#07070a] shadow-[0_0_8px_rgba(147,51,234,0.5)] transition-all duration-300 group-hover:bg-purple-400 group-hover:scale-110" />
            
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors leading-none tracking-tight">
                {activityLabel(activity.action_type)}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider">
                {formatActivityDate(activity.created_at)}
              </span>
            </div>
            
            {activity.description ? (
              <p className="text-xs text-muted-foreground bg-[#0a0a0c]/45 rounded-xl p-3 border border-white/5 group-hover:border-purple-500/10 transition-colors leading-relaxed shadow-sm">
                {activity.description}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ============================================================================
   Atividades (Notes) Tab Component
   ============================================================================ */
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
      toast.error("Não foi possível salvar a nota.", err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md self-start">
        <CardHeader>
          <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Nova Atividade</CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">Registros manuais e follow-up.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-3">
            <select name="type" defaultValue="observacao" className="h-8 rounded-lg border border-white/5 bg-zinc-950/40 text-white px-2.5 text-xs focus:outline-none">
              <option value="observacao">Observação</option>
              <option value="follow_up">Follow-up</option>
              <option value="reuniao">Reunião</option>
              <option value="decisao">Decisão</option>
              <option value="risco">Risco</option>
            </select>
            <textarea name="content" required placeholder="Descreva a atividade ou nota de contato..." className="min-h-24 rounded-lg border border-white/5 bg-zinc-950/40 px-3 py-2 text-xs text-white focus:outline-none" />
            <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-500 text-xs">Registrar</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Histórico de Atividades</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{notes.length} notas internas salvas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {notes.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Nenhuma anotação de atividade.</p> : null}
          {notes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const author = profiles.find((p) => p.id === note.author_id);
            const authorName = author ? (author.full_name || author.email) : "Membro";

            return (
              <div key={note.id} className="rounded-xl border border-white/5 bg-zinc-950/20 p-3.5 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[8px] font-mono uppercase border-white/5 bg-[#0a0a0c] text-zinc-400">
                      {note.type === "observacao" ? "Observação" :
                       note.type === "follow_up" ? "Follow-up" :
                       note.type === "reuniao" ? "Reunião" :
                       note.type === "decisao" ? "Decisão" :
                       note.type === "risco" ? "Risco" : note.type}
                    </Badge>
                    <span className="text-muted-foreground font-mono">{formatActivityDate(note.created_at)}</span>
                    <span className="text-zinc-500">Por: {authorName}</span>
                  </div>
                  {!isEditing && (
                    <Button variant="ghost" className="h-6 px-2 text-[10px] text-purple-400 hover:text-purple-300" onClick={() => setEditingNoteId(note.id)}>
                      Editar
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form action={handleSaveNote.bind(null, note.id)} className="mt-2 flex flex-col gap-2">
                    <select name="type" defaultValue={note.type} className="h-8 rounded-lg border border-white/5 bg-zinc-950/40 text-white px-2.5 text-xs focus:outline-none">
                      <option value="observacao">Observação</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="reuniao">Reunião</option>
                      <option value="decisao">Decisão</option>
                      <option value="risco">Risco</option>
                    </select>
                    <textarea name="content" defaultValue={note.content} className="min-h-16 rounded-lg border border-white/5 bg-zinc-950/40 px-3 py-2 text-xs text-white focus:outline-none" required />
                    <div className="flex gap-2">
                      <Button type="submit" variant="outline" size="sm" className="bg-purple-600 text-white hover:bg-purple-500 text-xs">Salvar</Button>
                      <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setEditingNoteId(null)}>Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-[#0a0a0c]/25 border border-white/5 rounded p-2.5">{note.content}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================================
   Tarefas (Follow-ups) Tab Component
   ============================================================================ */
function TasksTab({ prospect, tasks }: { prospect: ProspectRow; tasks: CommercialTaskRow[] }) {
  const action = createTaskAction.bind(null, prospect.id);
  const convertAction = convertProspectAction.bind(null, prospect.id);
  const alreadyConverted = Boolean(prospect.converted_client_id);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Novo Follow-up</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">Agendar tarefa para o lead.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="flex flex-col gap-3">
              <Input name="title" required placeholder="Assunto/Título" className="h-8 text-xs" />
              <Input name="description" placeholder="Instruções adicionais" className="h-8 text-xs" />
              <CustomSelect
                name="status"
                defaultValue="pending"
                options={taskStatuses.map((status: string) => ({ value: status, label: statusLabel(status) }))}
                triggerClassName="h-8 border-white/5 bg-zinc-950/40 text-xs text-white"
              />
              <CustomSelect
                name="priority"
                defaultValue="medium"
                options={taskPriorities.map((priority: string) => ({ value: priority, label: priorityLabel(priority) }))}
                triggerClassName="h-8 border-white/5 bg-zinc-950/40 text-xs text-white"
              />
              <Input name="due_date" type="date" className="h-8 text-xs text-white" />
              <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-500 text-xs">Agendar</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Conversão de Lead</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">Tornar este prospect um cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={convertAction} className="flex flex-col gap-3">
              <Input name="main_contact_name" placeholder="Nome do Contato" disabled={alreadyConverted} className="h-8 text-xs" />
              <Input name="main_contact_email" placeholder="E-mail principal" disabled={alreadyConverted} className="h-8 text-xs" />
              <Input name="main_contact_phone" placeholder="Telefone" disabled={alreadyConverted} className="h-8 text-xs" />
              <Input name="monthly_value" placeholder="Valor mensal (Ex: 2000)" disabled={alreadyConverted} className="h-8 text-xs" />
              <CustomSelect
                name="contract_status"
                defaultValue="draft"
                options={[
                  { value: "draft", label: "Rascunho" },
                  { value: "active", label: "Ativo" },
                  { value: "paused", label: "Pausado" },
                  { value: "cancelled", label: "Cancelado" }
                ]}
                triggerClassName="h-8 border-white/5 bg-zinc-950/40 text-xs text-white"
              />
              <Button type="submit" disabled={alreadyConverted} className="bg-purple-600 text-white hover:bg-purple-500 text-xs">
                {alreadyConverted ? "Convertido" : "Converter em Cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Lista de Follow-ups</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{tasks.length} tarefa(s) agendada(s).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tasks.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Sem follow-ups agendados.</p> : null}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-white/5 bg-zinc-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-white">{task.title}</span>
                  <Badge variant="outline" className="text-[8px] font-mono uppercase border-white/5 bg-[#0a0a0c] text-zinc-400">{statusLabel(task.status)}</Badge>
                  <Badge variant={task.priority === "urgent" || task.priority === "high" ? "destructive" : "secondary"} className="text-[8px] uppercase font-mono">{priorityLabel(task.priority)}</Badge>
                </div>
                {task.description ? <p className="text-xs text-muted-foreground mt-1 leading-normal">{task.description}</p> : null}
                <div className="text-[10px] text-zinc-500 font-mono mt-1">Prazo final: {task.due_date ? new Date(task.due_date).toLocaleDateString("pt-BR") : "sem prazo"}</div>
              </div>
              {task.status !== "completed" ? (
                <form action={completeTaskAction.bind(null, prospect.id, task.id)} className="shrink-0 self-end sm:self-center">
                  <Button type="submit" size="xs" variant="outline" className="text-[10px] h-7">Concluir</Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================================
   Propostas Tab Component (Sprint 12 Proposals Feature)
   ============================================================================ */
function ProposalsTab({ 
  prospectId, 
  proposals 
}: { 
  prospectId: string; 
  proposals: ProspectProposalRow[]; 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const action = createProposalAction.bind(null, prospectId);

  const totalProposalsValue = proposals.reduce((sum, p) => sum + Number(p.value), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* Sidebar with sum details and Quick Form Trigger */}
      <div className="flex flex-col gap-4">
        <div className="border border-white/5 rounded-xl bg-[#08080a]/40 p-4 font-mono">
          <span className="text-[9px] uppercase text-zinc-500 tracking-wider block">Valor de Propostas</span>
          <span className="text-2xl font-bold text-white mt-1 block">{formatCurrency(totalProposalsValue)}</span>
          <span className="text-[9px] text-purple-400 mt-0.5 block">{proposals.length} proposta(s) registrada(s)</span>
        </div>

        <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Gerar Proposta</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">Registre uma proposta comercial para este prospect.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFormOpen ? (
              <form action={async (fd) => {
                try {
                  await action(fd);
                  setIsFormOpen(false);
                } catch(e) {
                  toast.error("Não foi possível salvar a proposta.", e instanceof Error ? e.message : String(e));
                }
              }} className="flex flex-col gap-3">
                <Input name="title" required placeholder="Título da Proposta (Ex: Presença Local v1)" className="h-8 text-xs" />
                <Input name="value" type="number" required placeholder="Valor Financeiro (Ex: 2500)" className="h-8 text-xs" />
                <Input name="valid_until" type="date" placeholder="Validade da Proposta" className="h-8 text-xs text-white" />
                <textarea name="content" placeholder="Detalhes dos itens / serviços ofertados..." className="min-h-20 rounded-lg border border-white/5 bg-zinc-950/40 px-3 py-2 text-xs text-white focus:outline-none" />
                <div className="flex gap-2">
                  <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-500 text-xs flex-1 h-8">Salvar</Button>
                  <Button type="button" variant="outline" className="text-xs h-8" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setIsFormOpen(true)} className="w-full bg-purple-600 text-white hover:bg-purple-500 text-xs h-8">
                <PlusIcon className="size-3.5 mr-1" />
                Criar Proposta
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main List of Proposals */}
      <Card className="bg-[#08080a]/60 border-white/5 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Histórico de Propostas Comerciais</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Registro cronológico de ofertas formais enviadas ao cliente.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {proposals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 italic bg-[#0a0a0c]/25 border border-white/5 border-dashed rounded-xl">
              Nenhuma proposta comercial gerada para este prospect.
            </p>
          ) : null}

          {proposals.map((proposal) => {
            return (
              <div key={proposal.id} className="rounded-xl border border-white/5 bg-zinc-950/20 p-4 flex flex-col gap-2 hover:border-purple-500/15 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="size-4 text-purple-400" />
                    <span className="font-semibold text-xs text-white">{proposal.title}</span>
                    <Badge variant="outline" className="text-[8px] font-mono uppercase border-white/5 bg-[#0a0a0c] text-zinc-400">
                      {proposal.status === "draft" ? "Rascunho" : 
                       proposal.status === "sent" ? "Enviada" : 
                       proposal.status === "accepted" ? "Aceita" : 
                       proposal.status === "rejected" ? "Recusada" : proposal.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-purple-400 font-bold font-mono">{formatCurrency(Number(proposal.value))}</span>
                </div>

                {proposal.content && (
                  <p className="text-xs text-muted-foreground bg-[#0a0a0c]/20 border border-white/5 rounded p-2.5 whitespace-pre-wrap leading-relaxed">
                    {proposal.content}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between text-[9px] text-zinc-500 font-mono mt-1 border-t border-white/5 pt-2">
                  <span>Criado em: {new Date(proposal.created_at).toLocaleDateString("pt-BR")}</span>
                  {proposal.valid_until && (
                    <span className="text-amber-500/80">Validade: {new Date(proposal.valid_until).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function OutreachTab({
  prospect,
  outreach,
  outreachEvents
}: {
  prospect: ProspectRow;
  outreach: ProspectOutreachRow | null;
  outreachEvents: OutreachEventRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [sandboxConfirmOpen, setSandboxConfirmOpen] = useState(false);

  const handlePause = () => {
    startTransition(async () => {
      try {
        await pauseOutreachAction(prospect.id);
      } catch (err) {
        toast.error("Não foi possível pausar o outreach.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleStop = () => {
    startTransition(async () => {
      try {
        await stopOutreachAction(prospect.id);
      } catch (err) {
        toast.error("Não foi possível parar o outreach.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      try {
        await resumeOutreachAction(prospect.id);
      } catch (err) {
        toast.error("Não foi possível retomar o outreach.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleTestSandbox = () => {
    setSandboxConfirmOpen(true);
  };

  const runTestSandbox = () => {
    startTransition(async () => {
      try {
        await testSdrSandboxAction(prospect.id);
        toast.success("Teste SDR Sandbox iniciado.");
        setSandboxConfirmOpen(false);
      } catch (err) {
        toast.error("Não foi possível executar o teste SDR Sandbox.", err instanceof Error ? err.message : String(err));
      }
    });
  };

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    not_started: { label: "Não Iniciado", bg: "bg-zinc-950/20", text: "text-zinc-400", border: "border-zinc-500/20" },
    queued: { label: "Fila", bg: "bg-blue-950/20", text: "text-blue-300", border: "border-blue-500/20" },
    sent: { label: "Enviado", bg: "bg-cyan-950/20", text: "text-cyan-300", border: "border-cyan-500/20" },
    delivered: { label: "Entregue", bg: "bg-sky-950/20", text: "text-sky-300", border: "border-sky-500/20" },
    waiting_reply: { label: "Aguardando Resposta", bg: "bg-indigo-950/20", text: "text-indigo-300", border: "border-indigo-500/20" },
    replied: { label: "Respondeu", bg: "bg-purple-950/20", text: "text-purple-300", border: "border-purple-500/20" },
    negotiating: { label: "Negociando", bg: "bg-amber-950/20", text: "text-amber-300", border: "border-amber-500/20" },
    meeting_scheduled: { label: "Reunião Marcada", bg: "bg-emerald-950/20", text: "text-emerald-300", border: "border-emerald-500/20" },
    failed: { label: "Falhou", bg: "bg-rose-950/20", text: "text-rose-300", border: "border-rose-500/20" },
    paused: { label: "Pausado", bg: "bg-yellow-950/20", text: "text-yellow-300", border: "border-yellow-500/20" },
    stopped: { label: "Parado", bg: "bg-zinc-950/20", text: "text-zinc-400", border: "border-zinc-500/20" },
    disqualified: { label: "Desqualificado", bg: "bg-orange-950/20", text: "text-orange-300", border: "border-orange-500/20" }
  };

  const getStatusStyle = (status: string) => {
    return statusConfig[status] || { label: status, bg: "bg-white/5", text: "text-white", border: "border-white/10" };
  };

  const style = getStatusStyle(outreach?.status || "not_started");

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-white/5 bg-[#08080a]/40 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold font-mono text-white uppercase tracking-wider">Painel de Automação n8n</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Supervisão operacional da prospecção fria.</CardDescription>
          </div>
          
          <div className="flex items-center gap-1.5">
            {outreach?.status && ["queued", "sent", "delivered", "waiting_reply", "replied", "negotiating"].includes(outreach.status) ? (
              <>
                <Button variant="outline" size="sm" onClick={handlePause} disabled={isPending} className="h-8 text-xs font-mono">
                  Pausar
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs font-mono text-rose-300 hover:text-rose-200" onClick={handleStop} disabled={isPending}>
                  Parar
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-500 text-white flex items-center gap-1 h-8 text-xs font-mono cursor-pointer"
                  onClick={handleTestSandbox}
                  disabled={isPending}
                >
                  <PlayIcon className="size-3" />
                  <span>Testar SDR Sandbox</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 h-8 text-xs font-mono cursor-pointer"
                  onClick={handleResume}
                  disabled={isPending}
                >
                  <PlayIcon className="size-3" />
                  <span>Retomar</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 font-mono text-xs text-muted-foreground">
            <div className="p-3.5 border border-white/5 rounded-xl bg-zinc-950/20 flex flex-col gap-1">
              <span>Status</span>
              <Badge className={`text-[9px] uppercase border font-semibold tracking-wider w-max ${style.bg} ${style.text} ${style.border}`}>
                {style.label}
              </Badge>
            </div>
            <div className="p-3.5 border border-white/5 rounded-xl bg-zinc-950/20 flex flex-col gap-1">
              <span>Canal</span>
              <span className="text-white font-bold uppercase">{outreach?.channel || "whatsapp"}</span>
            </div>
            <div className="p-3.5 border border-white/5 rounded-xl bg-zinc-950/20 flex flex-col gap-1">
              <span>Ambiente</span>
              {outreach?.automation_source === "sandbox" ? (
                <Badge className="text-[8px] bg-yellow-950/40 text-yellow-300 border-yellow-800/30 uppercase font-bold tracking-wider w-max">
                  Sandbox
                </Badge>
              ) : (
                <Badge className="text-[8px] bg-purple-950/40 text-purple-300 border-purple-800/30 uppercase font-bold tracking-wider w-max">
                  Produção
                </Badge>
              )}
            </div>
            <div className="p-3.5 border border-white/5 rounded-xl bg-zinc-950/20 flex flex-col gap-1 min-w-0">
              <span>Execution ID</span>
              <span className="text-white font-bold truncate" title={outreach?.n8n_execution_id || ""}>
                {outreach?.n8n_execution_id || "-"}
              </span>
            </div>
          </div>

          {outreach?.last_message_preview && (
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/15">
              <h4 className="text-[10px] font-bold font-mono text-purple-300 uppercase tracking-wider mb-2">Última Mensagem da Automação</h4>
              <p className="text-xs text-purple-100 italic leading-relaxed">
                &quot;{outreach.last_message_preview}&quot;
              </p>
              {outreach.last_message_at && (
                <span className="block text-[9px] text-zinc-500 font-mono mt-2">
                  Recebida em: {new Date(outreach.last_message_at).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
          )}

          {outreach?.status === "meeting_scheduled" && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 flex flex-col gap-1.5 font-mono">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Reunião Marcada</h4>
              {outreach.meeting_title && (
                <p className="text-xs text-white font-bold">Título: {outreach.meeting_title}</p>
              )}
              {outreach.meeting_scheduled_at && (
                <p className="text-xs text-muted-foreground">
                  Data/Hora: {new Date(outreach.meeting_scheduled_at).toLocaleString("pt-BR")}
                </p>
              )}
              {outreach.meeting_link && (
                <a href={outreach.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-emerald-300 underline mt-1 hover:text-emerald-200">
                  Link da Reunião
                </a>
              )}
            </div>
          )}

          {outreach?.error_message && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/15 flex flex-col gap-1">
              <h4 className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider">Erro na Automação</h4>
              <p className="text-xs text-rose-200 leading-normal">{outreach.error_message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events Timeline */}
      <Card className="border-white/5 bg-[#08080a]/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold font-mono text-white uppercase tracking-wider">Histórico de Eventos da Automação</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Linha do tempo das interações do n8n.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {outreachEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">Nenhum evento registrado ainda.</p>
          ) : (
            <div className="relative border-l border-white/5 pl-4 ml-2 flex flex-col gap-5">
              {outreachEvents.map((evt) => {
                const evtStyle = getStatusStyle(evt.status);
                return (
                  <div key={evt.id} className="relative">
                    {/* Timeline bullet */}
                    <div className={`absolute -left-[21px] top-1 size-2 rounded-full border bg-[#09090c] ${evtStyle.border}`} />
                    
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-white font-mono uppercase">{evt.event_type}</span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-2">({evt.channel})</span>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{evt.message}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <Badge className={`text-[8px] font-mono py-0 h-4 border ${evtStyle.bg} ${evtStyle.text} ${evtStyle.border}`}>
                          {evtStyle.label}
                        </Badge>
                        <span className="block text-[9px] text-muted-foreground font-mono mt-1">
                          {new Date(evt.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={sandboxConfirmOpen}
        onOpenChange={setSandboxConfirmOpen}
        title="Executar teste SDR Sandbox?"
        description="Isso vai disparar o fluxo de teste para este prospect usando o ambiente Sandbox. Use apenas para validação operacional."
        confirmLabel="Executar teste"
        cancelLabel="Cancelar"
        variant="warning"
        isPending={isPending}
        onConfirm={runTestSandbox}
      />
    </div>
  );
}
