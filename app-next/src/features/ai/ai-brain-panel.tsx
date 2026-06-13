"use client";

import { useMemo, useState, useTransition } from "react";
import { BrainCircuitIcon, CalendarCheckIcon, FileTextIcon, MessageSquareIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProspectDiagnosticRow, ProspectRow } from "@/features/prospects/data";
import {
  analyzeLeadSandboxAction,
  decideMeetingSandboxAction,
  generateProposalBriefSandboxAction,
  generateReplySandboxAction,
  handleObjectionSandboxAction,
  qualifyLeadSandboxAction
} from "./actions";

type PanelResult = {
  title: string;
  items: Array<[string, string]>;
  lists?: Array<{ label: string; values: string[] }>;
};

function toProspectContext(prospect: ProspectRow) {
  return {
    id: prospect.id,
    name: prospect.name,
    segment: prospect.segment,
    city: prospect.city,
    temperature: prospect.temperature,
    priority_score: prospect.priority_score,
    website_url: prospect.website_url,
    instagram_url: prospect.instagram_url,
    whatsapp: prospect.whatsapp,
    notes: prospect.notes
  };
}

function toDiagnosticContext(diagnostic: ProspectDiagnosticRow | null) {
  if (!diagnostic) return null;
  const opportunities = Array.isArray(diagnostic.opportunities)
    ? diagnostic.opportunities.filter((item): item is string => typeof item === "string")
    : null;
  return {
    website_notes: diagnostic.website_notes,
    instagram_notes: diagnostic.instagram_notes,
    whatsapp_notes: diagnostic.whatsapp_notes,
    google_business_notes: diagnostic.google_business_notes,
    diagnosis_summary: diagnostic.diagnosis_summary,
    opportunities
  };
}

function formatBoolean(value: boolean) {
  return value ? "Sim" : "Nao";
}

function formatConfidence(value: number | undefined) {
  if (typeof value !== "number") return "-";
  return `${Math.round(value * 100)}%`;
}

export function AiBrainPanel({ prospect, diagnostic }: { prospect: ProspectRow; diagnostic: ProspectDiagnosticRow | null }) {
  const [leadMessage, setLeadMessage] = useState("");
  const [objection, setObjection] = useState("");
  const [result, setResult] = useState<PanelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const payload = useMemo(() => ({
    prospect: toProspectContext(prospect),
    diagnostic: toDiagnosticContext(diagnostic)
  }), [prospect, diagnostic]);

  const runAction = (action: () => Promise<PanelResult>) => {
    setError(null);
    startTransition(async () => {
      try {
        setResult(await action());
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-white/5 bg-[#08080a]/40 backdrop-blur-md">
        <CardHeader className="border-b border-white/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
                  AI Brain Sandbox
                </CardTitle>
                <Badge className="bg-emerald-950/30 text-emerald-300 border-emerald-700/30 text-[10px] uppercase font-mono">
                  AI Brain Sandbox - custo zero
                </Badge>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Modo simulado. Nenhuma API externa sera chamada.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-3 py-2 text-[10px] font-mono uppercase text-emerald-300">
              <ShieldCheckIcon className="size-3.5" />
              Provider mock
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 lg:grid-cols-3">
          <Button type="button" onClick={() => runAction(async () => {
            const response = await analyzeLeadSandboxAction(payload);
            return {
              title: "Analise do Lead",
              items: [
                ["Nivel digital", response.result.digital_maturity],
                ["ICP provavel", response.result.icp_fit],
                ["Potencial comercial", `${response.result.priority_score_suggestion ?? prospect.priority_score ?? 0}/100`],
                ["Recomendacao", response.result.recommended_stage]
              ],
              lists: [
                { label: "Dores", values: response.result.risks.length ? response.result.risks : ["Sem riscos criticos no mock."] },
                { label: "Oportunidades", values: response.result.opportunities },
                { label: "Solucoes recomendadas", values: response.result.opportunities }
              ]
            };
          })} disabled={isPending} className="justify-start gap-2">
            <BrainCircuitIcon className="size-4" />
            Analisar Lead
          </Button>

          <Button type="button" variant="outline" onClick={() => runAction(async () => {
            const response = await qualifyLeadSandboxAction(payload);
            return {
              title: "Qualificacao do Lead",
              items: [
                ["Temperatura", response.result.temperature],
                ["Prioridade", `${prospect.priority_score ?? 0}/100`],
                ["ICP provavel", response.result.qualified ? "aderente" : "incerto"],
                ["Recomendacao", response.result.next_action]
              ],
              lists: [
                { label: "Sinais de compra", values: response.result.missing_information.length ? ["Contexto ainda incompleto."] : ["Presenca digital mapeada.", "Canal de contato disponivel."] },
                { label: "Motivo", values: [response.result.reason] }
              ]
            };
          })} disabled={isPending} className="justify-start gap-2">
            <SparklesIcon className="size-4" />
            Qualificar Lead
          </Button>

          <Button type="button" variant="outline" onClick={() => runAction(async () => {
            const response = await decideMeetingSandboxAction({ ...payload, message: leadMessage });
            return {
              title: "Decisao de Reuniao",
              items: [
                ["Deve marcar reuniao?", formatBoolean(response.result.should_schedule)],
                ["Motivo", response.result.reason],
                ["Confidence", formatConfidence(response.result.confidence)],
                ["Proxima acao", response.result.should_schedule ? "schedule_meeting" : "follow_up"]
              ],
              lists: [{ label: "Bloqueios", values: response.result.blocked_by.length ? response.result.blocked_by : ["Nenhum bloqueio no mock."] }]
            };
          })} disabled={isPending} className="justify-start gap-2">
            <CalendarCheckIcon className="size-4" />
            Decidir Reuniao
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-white/5 bg-[#08080a]/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Gerar Resposta SDR</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Mensagem recebida do lead</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <textarea
              value={leadMessage}
              onChange={(event) => setLeadMessage(event.target.value)}
              className="min-h-28 resize-none rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-sm text-white outline-none focus:border-purple-500/40"
              placeholder="Ex: Tenho interesse, como funciona?"
            />
            <Button type="button" onClick={() => runAction(async () => {
              const response = await generateReplySandboxAction({ ...payload, message: leadMessage });
              return {
                title: "Resposta SDR sugerida",
                items: [
                  ["Resposta sugerida", response.result.reply],
                  ["Intent", response.result.intent],
                  ["Stage", response.result.stage],
                  ["Confidence", formatConfidence(response.result.confidence)],
                  ["Next action", response.result.next_action]
                ]
              };
            })} disabled={isPending || !leadMessage.trim()} className="gap-2">
              <MessageSquareIcon className="size-4" />
              Gerar Resposta SDR
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#08080a]/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Tratar Objecao</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Objecao do lead</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <textarea
              value={objection}
              onChange={(event) => setObjection(event.target.value)}
              className="min-h-28 resize-none rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-sm text-white outline-none focus:border-purple-500/40"
              placeholder="Ex: Esta caro"
            />
            <Button type="button" variant="outline" onClick={() => runAction(async () => {
              const response = await handleObjectionSandboxAction({ ...payload, objection });
              return {
                title: "Estrategia de objecao",
                items: [
                  ["Resposta consultiva", response.result.recommended_reply],
                  ["Estrategia", response.result.reasoning_summary],
                  ["Proximos passos", response.result.next_action],
                  ["Handoff humano", formatBoolean(response.result.handoff_required)]
                ]
              };
            })} disabled={isPending || !objection.trim()} className="gap-2">
              <MessageSquareIcon className="size-4" />
              Tratar Objecao
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/5 bg-[#08080a]/40 backdrop-blur-md">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xs font-bold font-mono text-white uppercase tracking-wider">Brief de Proposta</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Gera um brief para revisao humana, sem proposta final automatica.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => runAction(async () => {
            const response = await generateProposalBriefSandboxAction({ ...payload, message: leadMessage });
            return {
              title: "Brief de Proposta",
              items: [
                ["Diagnostico resumido", response.result.problem_summary],
                ["Missao recomendada", response.result.title],
                ["Beneficio esperado", response.result.recommended_scope[0] || "Validar escopo com humano."],
                ["Proximo passo", response.result.next_steps[0] || "Revisar brief"]
              ],
              lists: [
                { label: "Escopo provavel", values: response.result.recommended_scope },
                { label: "Riscos", values: response.result.risks }
              ]
            };
          })} disabled={isPending} className="gap-2">
            <FileTextIcon className="size-4" />
            Brief de Proposta
          </Button>
        </CardHeader>
      </Card>

      {error ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3 text-xs text-rose-200">{error}</div>
      ) : null}

      {result ? (
        <Card className="border-purple-500/20 bg-purple-950/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold font-mono text-white uppercase tracking-wider">{result.title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Resultado mockado em sandbox. Custo: zero.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {result.items.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/5 bg-zinc-950/30 p-3">
                  <p className="text-[10px] font-mono uppercase text-zinc-500">{label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white">{value}</p>
                </div>
              ))}
            </div>
            {result.lists?.map((list) => (
              <div key={list.label} className="rounded-lg border border-white/5 bg-zinc-950/20 p-3">
                <p className="text-[10px] font-mono uppercase text-zinc-500">{list.label}</p>
                <ul className="mt-2 grid gap-2 text-sm text-zinc-200">
                  {list.values.map((value) => (
                    <li key={value} className="rounded-md bg-white/[0.03] px-3 py-2">{value}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
