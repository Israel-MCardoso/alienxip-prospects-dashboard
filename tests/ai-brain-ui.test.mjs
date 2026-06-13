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
  const source = readFileSync(absolutePath, "utf8").replace(/^"use server";\s*/m, "");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      skipLibCheck: true
    }
  }).outputText;

  const module = { exports: {} };
  cache.set(absolutePath, module);
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      const target = `app-next/src/${specifier.slice(2)}`;
      return loadTsModule(`${target}.ts`, cache);
    }
    if (specifier.startsWith("./")) {
      return loadTsModule(join(dirname(relativePath), `${specifier.slice(2)}.ts`), cache);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", output)(localRequire, module, module.exports);
  return module.exports;
}

const sampleProspect = {
  id: "prospect-ui-1",
  name: "Odontoclinic",
  segment: "Clinica odontologica",
  city: "Jacarei",
  temperature: "warm",
  priority_score: 80,
  website_url: "https://example.com",
  instagram_url: "https://instagram.com/odontoclinic",
  whatsapp: "5512999999999"
};

const sampleDiagnostic = {
  website_notes: "Site lento e sem CTA claro.",
  instagram_notes: "Bio sem oferta objetiva.",
  whatsapp_notes: "Atendimento manual."
};

test("AI Brain sandbox actions return mock results for a real prospect payload", async () => {
  const actions = loadTsModule("app-next/src/features/ai/actions.ts");

  const analysis = await actions.analyzeLeadSandboxAction({ prospect: sampleProspect, diagnostic: sampleDiagnostic });
  assert.equal(analysis.provider, "mock");
  assert.equal(analysis.result.prospect_id, sampleProspect.id);
  assert.ok(analysis.result.opportunities.length > 0);

  const qualification = await actions.qualifyLeadSandboxAction({ prospect: sampleProspect, diagnostic: sampleDiagnostic });
  assert.equal(qualification.provider, "mock");
  assert.equal(qualification.result.qualified, true);

  const reply = await actions.generateReplySandboxAction({
    prospect: sampleProspect,
    message: "Tenho interesse, como funciona?"
  });
  assert.equal(reply.provider, "mock");
  assert.match(reply.result.reply, /diagnostico|presenca digital|operacao/i);
});

test("AI Brain sandbox meeting, objection and proposal actions expose safe mock output", async () => {
  const actions = loadTsModule("app-next/src/features/ai/actions.ts");

  const objection = await actions.handleObjectionSandboxAction({
    prospect: sampleProspect,
    objection: "Esta caro"
  });
  assert.equal(objection.result.objection_type, "price_objection");
  assert.equal(objection.result.handoff_required, true);

  const meeting = await actions.decideMeetingSandboxAction({
    prospect: sampleProspect,
    message: "Quero agendar uma reuniao de diagnostico"
  });
  assert.equal(meeting.result.should_schedule, true);
  assert.equal(meeting.provider, "mock");

  const brief = await actions.generateProposalBriefSandboxAction({
    prospect: sampleProspect,
    diagnostic: sampleDiagnostic
  });
  assert.equal(brief.result.human_review_required, true);
  assert.ok(brief.result.recommended_scope.length > 0);
});

test("AI Brain panel source renders sandbox badge, required fields and all action buttons", () => {
  const panelPath = join(root, "app-next/src/features/ai/ai-brain-panel.tsx");
  assert.equal(existsSync(panelPath), true, "ai-brain-panel.tsx should exist");
  const source = readFileSync(panelPath, "utf8");

  for (const expected of [
    "AI Brain Sandbox",
    "AI Brain Sandbox - custo zero",
    "Modo simulado. Nenhuma API externa sera chamada.",
    "Mensagem recebida do lead",
    "Objecao do lead",
    "Analisar Lead",
    "Qualificar Lead",
    "Gerar Resposta SDR",
    "Tratar Objecao",
    "Decidir Reuniao",
    "Brief de Proposta"
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Prospect workspace exposes the AI Brain tab and panel", () => {
  const workspacePath = join(root, "app-next/src/features/prospects/prospect-workspace.tsx");
  const source = readFileSync(workspacePath, "utf8");

  assert.match(source, /TabsTrigger value="ai-brain"/);
  assert.match(source, />AI Brain</);
  assert.match(source, /<AiBrainPanel/);
});

test("AI Brain UI layer does not use external HTTP calls or real provider SDKs", () => {
  for (const relativePath of [
    "app-next/src/features/ai/actions.ts",
    "app-next/src/features/ai/ai-brain-panel.tsx"
  ]) {
    const source = readFileSync(join(root, relativePath), "utf8");
    assert.doesNotMatch(source, /fetch\(|axios|from ["']openai["']|new OpenAI|from ["']@anthropic|from ["']@google/i);
  }
});
