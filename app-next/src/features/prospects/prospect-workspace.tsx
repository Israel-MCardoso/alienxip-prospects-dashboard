"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2Icon, 
  CalendarIcon, 
  MapPinIcon, 
  TrendingUpIcon, 
  UserIcon,
  ChevronRightIcon,
  GlobeIcon,
  BookOpenIcon,
  PlusIcon,
  FileTextIcon
} from "lucide-react";

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
  ProspectRow,
  ProspectProposalRow
} from "./data";
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
import { statusLabel, priorityLabel, temperatureLabel } from "@/lib/display-helpers";

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
  companies = []
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
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();
  const [aiStep, setAiStep] = useState<string | null>(null);

  const clientObj = clients.find((c) => c.id === prospect.converted_client_id);
  const clientCompany = companies.find((c) => c.id === clientObj?.company_id);
  const resolvedClientLabel = clientCompany
    ? `${clientObj?.main_contact_name || "Contato"} (${clientCompany.name})`
    : (clientObj?.main_contact_name || prospect.converted_client_id || "-");

  const playbooks = getRecommendedPlaybooks(prospect.segment);

  // IA Generation Simulation
  const handleGenerateDiagnostic = () => {
    setActiveTab("diagnostic");
    startTransition(async () => {
      setAiStep("Mapeando presença digital local...");
      await new Promise((r) => setTimeout(r, 600));
      setAiStep("Analisando perfil de Google Meu Negócio...");
      await new Promise((r) => setTimeout(r, 600));
      setAiStep("Avaliando SEO de site e redes sociais...");
      await new Promise((r) => setTimeout(r, 600));
      setAiStep("Cruzando dados de mercado e gerando sugestões...");
      await new Promise((r) => setTimeout(r, 700));

      try {
        await generateAiDiagnosticAction(prospect.id);
      } catch (err) {
        alert("Erro na geração do diagnóstico: " + (err instanceof Error ? err.message : String(err)));
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
            <Button variant="outline" size="sm" onClick={() => setActiveTab("tasks")}>Criar Tarefa</Button>
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

      {/* 2. MODULAR 2-COLUMN OPERATIONAL LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap bg-[#08080a]/60 border border-white/5 p-1 rounded-xl w-full justify-start overflow-x-auto scrollbar-none">
              <TabsTrigger value="overview" className="rounded-lg text-xs font-mono py-1.5 px-3">Resumo</TabsTrigger>
              <TabsTrigger value="diagnostic" className="rounded-lg text-xs font-mono py-1.5 px-3">Diagnóstico IA</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg text-xs font-mono py-1.5 px-3">Histórico</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg text-xs font-mono py-1.5 px-3">Atividades</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg text-xs font-mono py-1.5 px-3">Tarefas</TabsTrigger>
              <TabsTrigger value="files" className="rounded-lg text-xs font-mono py-1.5 px-3">Arquivos</TabsTrigger>
              <TabsTrigger value="proposals" className="rounded-lg text-xs font-mono py-1.5 px-3">Propostas</TabsTrigger>
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
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
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
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Responsável</span>
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <UserIcon className="size-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">
                    {profiles.find((p) => p.id === prospect.responsible_user_id)?.full_name || 
                     profiles.find((p) => p.id === prospect.responsible_user_id)?.email || 
                     "Não definido"}
                  </span>
                </div>
              </div>

              {prospect.whatsapp && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">WhatsApp</span>
                  <a href={prospect.whatsapp} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline truncate">
                    {prospect.whatsapp.replace("https://wa.me/", "+")}
                  </a>
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
      </div>
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
      alert("Erro ao salvar nota: " + (err instanceof Error ? err.message : String(err)));
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
              <select name="status" defaultValue="pending" className="h-8 rounded-lg border border-white/5 bg-zinc-950/40 text-white px-2.5 text-xs focus:outline-none">
                {taskStatuses.map((status: string) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
              <select name="priority" defaultValue="medium" className="h-8 rounded-lg border border-white/5 bg-zinc-950/40 text-white px-2.5 text-xs focus:outline-none">
                {taskPriorities.map((priority: string) => <option key={priority} value={priority}>{priorityLabel(priority)}</option>)}
              </select>
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
              <select name="contract_status" defaultValue="draft" disabled={alreadyConverted} className="h-8 rounded-lg border border-white/5 bg-zinc-950/40 text-white px-2.5 text-xs focus:outline-none">
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="cancelled">Cancelado</option>
              </select>
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

  // Formatter for currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(val);
  };

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
                  alert(e instanceof Error ? e.message : String(e));
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
