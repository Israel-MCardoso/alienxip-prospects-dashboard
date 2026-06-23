import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const ts = require(join(root, "app-next/node_modules/typescript"));

function loadTsModule(relativePath, cache = new Map()) {
  const absolutePath = join(root, relativePath);
  if (cache.has(absolutePath)) return cache.get(absolutePath).exports;
  const source = readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      skipLibCheck: true
    }
  }).outputText;

  const module = { exports: {} };
  cache.set(absolutePath, module);
  const localRequire = (specifier) => {
    if (specifier.startsWith("./")) {
      return loadTsModule(join(dirname(relativePath), `${specifier.slice(2)}.ts`), cache);
    }
    if (specifier.startsWith("../")) {
      return loadTsModule(join(dirname(relativePath), `${specifier}.ts`), cache);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", output)(localRequire, module, module.exports);
  return module.exports;
}

const utils = () => loadTsModule("app-next/src/features/outreach/sdr-command-center-utils.ts", new Map());

const prospects = [
  {
    id: "p1",
    nome: "Odontoclinic - Jacarei",
    empresa: "Odontoclinic - Jacarei",
    cidade: "Jacarei",
    segmento: "Clinica odontologica",
    temperatura: "hot",
    status: "prospect",
    telefone: "5512988887777",
    prospect_outreach: [
      {
        status: "waiting_reply",
        channel: "whatsapp",
        last_message_preview: "Tenho interesse",
        last_message_at: "2026-06-13T13:00:00.000Z",
        n8n_execution_id: "exec-1",
        updated_at: "2026-06-13T13:10:00.000Z"
      }
    ],
    outreach_events: [
      { event_type: "dispatch", status: "queued", message: "Entrou no lote", created_at: "2026-06-13T12:00:00.000Z", n8n_execution_id: "exec-1" },
      { event_type: "replied", status: "replied", message: "Tenho interesse", created_at: "2026-06-13T13:00:00.000Z", n8n_execution_id: "exec-1" }
    ]
  },
  {
    id: "p2",
    nome: "Studio Smile",
    cidade: "Sao Jose dos Campos",
    segmento: "Clinica odontologica",
    temperatura: "warm",
    status: "prospect",
    telefone: "5512999998888",
    prospect_outreach: [{ status: "meeting_scheduled", meeting_scheduled_at: "2026-06-14T15:00:00.000Z", channel: "whatsapp" }],
    outreach_events: [{ event_type: "meeting_scheduled", status: "meeting_scheduled", created_at: "2026-06-13T14:00:00.000Z" }]
  },
  {
    id: "p3",
    nome: "Opt Out Clinica",
    cidade: "Jacarei",
    segmento: "Clinica medica",
    temperatura: "cold",
    status: "prospect",
    telefone: "5512977776666",
    prospect_outreach: [{ status: "opt_out", channel: "whatsapp" }],
    outreach_events: [{ event_type: "opt_out", status: "opt_out", created_at: "2026-06-13T15:00:00.000Z" }]
  },
  {
    id: "p4",
    nome: "Falha Sem Telefone",
    cidade: "Jacarei",
    segmento: "Clinica odontologica",
    temperatura: "hot",
    status: "prospect",
    telefone: "123",
    prospect_outreach: [{ status: "failed", error_message: "Telefone invalido", channel: "whatsapp" }]
  }
];

test("SDR Command Center helper filters prospects by CRM, automation and safety criteria", () => {
  const { filterSdrLeads } = utils();

  assert.deepEqual(filterSdrLeads(prospects, { city: "Jacarei" }).map((lead) => lead.id), ["p1", "p3", "p4"]);
  assert.deepEqual(filterSdrLeads(prospects, { segment: "odontologica", validPhone: true }).map((lead) => lead.id), ["p1", "p2"]);
  assert.deepEqual(filterSdrLeads(prospects, { waitingReply: true }).map((lead) => lead.id), ["p1"]);
  assert.deepEqual(filterSdrLeads(prospects, { meetingScheduled: true }).map((lead) => lead.id), ["p2"]);
  assert.deepEqual(filterSdrLeads(prospects, { optOut: true }).map((lead) => lead.id), ["p3"]);
  assert.deepEqual(filterSdrLeads(prospects, { failure: true }).map((lead) => lead.id), ["p4"]);
});

test("SDR Command Center metrics, eligibility and production block stay sandbox-only", () => {
  const { buildSdrDashboardMetrics, getEligibleLeads, isEligibleForSdrAutomation, productionDispatchAllowed } = utils();

  const metrics = buildSdrDashboardMetrics(prospects, [{ batch_id: "batch-1", status: "dispatched" }]);
  assert.equal(metrics.eligible, 1);
  assert.equal(metrics.inAutomation, 4);
  assert.equal(metrics.activeConversations, 1);
  assert.equal(metrics.waitingReply, 1);
  assert.equal(metrics.meetingsScheduled, 1);
  assert.equal(metrics.optOut, 1);
  assert.equal(metrics.failures, 1);
  assert.equal(metrics.activeBatches, 1);
  assert.deepEqual(getEligibleLeads(prospects).map((lead) => lead.id), ["p1"]);
  assert.equal(isEligibleForSdrAutomation(prospects[2]).eligible, false);
  assert.equal(productionDispatchAllowed(), false);
});

test("SDR Command Center timeline, inbox, batches and human takeover are normalized", () => {
  const {
    buildConversationInbox,
    buildMeetingDetections,
    buildSdrBatchRows,
    buildTimeline,
    createHumanTakeoverEvent
  } = utils();

  assert.deepEqual(buildTimeline(prospects[0]).map((entry) => entry.status), ["queued", "replied", "waiting_reply"]);
  assert.equal(buildConversationInbox(prospects)[0].n8n_execution_id, "exec-1");
  assert.equal(buildMeetingDetections(prospects)[0].company, "Studio Smile");
  assert.equal(buildSdrBatchRows([{ batch_id: "batch-1", status: "dispatched", automation_source: "sandbox", total_requested: 2, total_dispatched: 1, total_skipped: 1, created_by_email: "admin@motherxip.com", created_at: "2026-06-13T12:00:00.000Z" }])[0].environment, "sandbox");

  const event = createHumanTakeoverEvent({ prospectId: "p1", operatorEmail: "admin@motherxip.com" });
  assert.equal(event.event_type, "human_takeover");
  assert.equal(event.automation_should_stop, true);
  assert.equal(event.operator_email, "admin@motherxip.com");
});

test("SDR Command Center UI and route expose required sandbox surfaces", () => {
  const files = [
    "app-next/src/features/outreach/sdr-command-center.tsx",
    "app-next/src/app/os/(protected)/outreach/sdr-command-center/page.tsx",
    "app-next/src/components/layout/os-shell.tsx"
  ];

  for (const relativePath of files) {
    assert.equal(existsSync(join(root, relativePath)), true, `${relativePath} should exist`);
  }

  const source = readFileSync(join(root, "app-next/src/features/outreach/sdr-command-center.tsx"), "utf8");
  for (const requiredText of [
    "SDR Command Center",
    "Sandbox somente",
    "Enviar para Automação SDR",
    "Conversas",
    "Timeline",
    "Assumir Conversa",
    "human_takeover",
    "Reuniões Detectadas",
    "Aprovar",
    "Rejeitar",
    "Lotes",
    "Health Monitor",
    "Production bloqueada"
  ]) {
    assert.match(source, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const nav = readFileSync(join(root, "app-next/src/components/layout/os-shell.tsx"), "utf8");
  assert.match(nav, /\/os\/outreach\/sdr-command-center/);
  assert.match(nav, /SDR Command Center/);
});

test("SDR Command Center files avoid real external calls and provider activation", () => {
  for (const relativePath of [
    "app-next/src/features/outreach/sdr-command-center.tsx",
    "app-next/src/features/outreach/sdr-command-center-utils.ts",
    "app-next/src/app/os/(protected)/outreach/sdr-command-center/page.tsx"
  ]) {
    const source = readFileSync(join(root, relativePath), "utf8");
    assert.doesNotMatch(source, /new OpenAI|from ["']openai["']|claude|gemini|EvolutionProvider|sendWhatsApp|fetch\(/i);
    assert.doesNotMatch(source, /PROVIDER_ENABLED\s*=\s*true|AI_DRY_RUN\s*=\s*false|EVOLUTION_PROVIDER_ENABLED\s*=\s*true/);
  }
});
