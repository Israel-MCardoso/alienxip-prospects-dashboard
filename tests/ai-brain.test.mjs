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
    return require(specifier);
  };
  new Function("require", "module", "exports", output)(localRequire, module, module.exports);
  return module.exports;
}

const ai = () => loadTsModule("app-next/src/lib/ai/index.ts");

function withEnv(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

test("getAIProvider returns MockAIProvider when provider is disabled and dry run is enabled", async () => {
  await withEnv({ PROVIDER_ENABLED: "false", AI_DRY_RUN: "true" }, async () => {
    const provider = ai().getAIProvider();
    assert.equal(provider.name, "mock");
    assert.equal(provider.enabled, true);
  });
});

test("MockAIProvider.analyzeLead returns a valid deterministic LeadAnalysis result", async () => {
  const result = await new (ai().MockAIProvider)().analyzeLead({
    prospect: {
      id: "prospect-1",
      name: "Clinica Exemplo",
      segment: "Clinica odontologica",
      city: "Jacarei",
      temperature: "warm",
      priority_score: 72,
      website_url: "https://example.com",
      instagram_url: "https://instagram.com/exemplo",
      whatsapp: "5512999999999"
    },
    diagnostics: {
      website_notes: "Site lento e sem CTA claro.",
      instagram_notes: "Bio sem oferta objetiva.",
      whatsapp_notes: "Atendimento manual."
    }
  });

  assert.equal(result.prospect_id, "prospect-1");
  assert.match(result.recommended_stage, /diagnostico|diagnose/i);
  assert.ok(result.opportunities.length >= 2);
  assert.equal(ai().validateLeadAnalysis(result).valid, true);
});

test("MockAIProvider.generateReply returns a consultative SDR response without pressure", async () => {
  const result = await new (ai().MockAIProvider)().generateReply({
    prospect: { id: "prospect-2", name: "Odontoclinic", segment: "Clinica odontologica" },
    conversation: {
      conversation_id: "conv-1",
      prospect_id: "prospect-2",
      stage: "replied",
      last_message: "Tenho interesse, como funciona?"
    }
  });

  assert.match(result.reply, /diagnostico|entender|presenca digital|opera/i);
  assert.equal(result.handoff_required, false);
  assert.equal(result.channel, "whatsapp");
});

test("MockAIProvider.handleObjection treats price objections without pressure", async () => {
  const result = await new (ai().MockAIProvider)().handleObjection({
    prospect: { id: "prospect-3", name: "Lead Preco" },
    objection: "Esta caro",
    conversation: { stage: "negotiating" }
  });

  assert.equal(result.objection_type, "price_objection");
  assert.match(result.recommended_reply, /escopo|diagnostico|operacao/i);
  assert.equal(result.handoff_required, true);
  assert.doesNotMatch(result.recommended_reply, /desconto garantido|ultima chance|so hoje/i);
});

test("MockAIProvider.decideMeeting only schedules when intent is clear", async () => {
  const provider = new (ai().MockAIProvider)();
  const clear = await provider.decideMeeting({
    conversation: { last_message: "Quero agendar uma reuniao para entender a proposta", stage: "negotiating" }
  });
  const unclear = await provider.decideMeeting({
    conversation: { last_message: "Agora nao tenho interesse", stage: "replied" }
  });

  assert.equal(clear.should_schedule, true);
  assert.equal(ai().validateMeetingDecision(clear).valid, true);
  assert.equal(unclear.should_schedule, false);
  assert.ok(unclear.blocked_by.length > 0);
});

test("assertBudgetAllowed blocks real providers with zero budget or dry-run flags", () => {
  const { assertBudgetAllowed } = ai();

  assert.throws(() => assertBudgetAllowed({ provider: "openai", estimatedCost: 0.01 }), /PROVIDER_ENABLED|AI_DRY_RUN|MAX_COST/);
  assert.doesNotThrow(() => assertBudgetAllowed({ provider: "mock", estimatedCost: 0 }));
});

test("AI Brain files do not import real provider SDKs or external HTTP clients", () => {
  const aiDir = join(root, "app-next/src/lib/ai");
  const files = ["provider.ts", "mock-provider.ts", "registry.ts", "cost-guard.ts", "prompts.ts", "schemas.ts"];
  for (const file of files) {
    const path = join(aiDir, file);
    assert.equal(existsSync(path), true, `${file} should exist`);
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /from ["']openai["']|new OpenAI\(|fetch\(|axios|from ["']@anthropic|from ["']@google/i);
  }
});
