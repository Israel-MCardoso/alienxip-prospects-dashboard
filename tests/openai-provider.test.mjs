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

const ai = () => loadTsModule("app-next/src/lib/ai/index.ts", new Map());

const safeEnv = {
  PROVIDER_ENABLED: "false",
  AI_DRY_RUN: "true",
  MAX_COST_PER_CONVERSATION: "0",
  MAX_DAILY_COST: "0",
  OPENAI_API_KEY: undefined
};

const productionReadyEnv = {
  PROVIDER_ENABLED: "true",
  AI_DRY_RUN: "false",
  MAX_COST_PER_CONVERSATION: "1",
  MAX_DAILY_COST: "5",
  OPENAI_API_KEY: "sk-test-placeholder"
};

test("provider factory keeps MockAIProvider active in zero cost mode", () => {
  const provider = ai().getAIProvider({ env: safeEnv });

  assert.equal(provider.name, "mock");
  assert.equal(provider.enabled, true);
});

test("provider factory blocks OpenAI when dry run is enabled or API key is missing", () => {
  assert.equal(ai().getAIProvider({ env: { ...productionReadyEnv, AI_DRY_RUN: "true" } }).name, "mock");
  assert.equal(ai().getAIProvider({ env: { ...productionReadyEnv, OPENAI_API_KEY: undefined } }).name, "mock");
  assert.equal(ai().getAIProvider({ env: { ...productionReadyEnv, PROVIDER_ENABLED: "false" } }).name, "mock");
});

test("provider factory only selects OpenAIProvider when every activation guard is explicitly open", () => {
  const provider = ai().getAIProvider({ env: productionReadyEnv });

  assert.equal(provider.name, "openai");
  assert.equal(provider.enabled, false);
});

test("budget guard reports blockers for zero-cost and missing-key modes", () => {
  const { assertBudgetAllowed, realProviderIsBlocked } = ai();

  assert.throws(
    () => assertBudgetAllowed({ provider: "openai", estimatedCost: 0.000001, env: safeEnv }),
    /PROVIDER_ENABLED=false|AI_DRY_RUN=true|MAX_COST_PER_CONVERSATION=0|MAX_DAILY_COST=0|OPENAI_API_KEY/
  );
  assert.equal(realProviderIsBlocked(safeEnv), true);
  assert.doesNotThrow(() => assertBudgetAllowed({ provider: "mock", estimatedCost: 0, env: safeEnv }));
});

test("OpenAIProvider delegates to safe mock-shaped results and enforces schemas without external calls", async () => {
  const { OpenAIProvider, validateLeadAnalysis } = ai();
  const provider = new OpenAIProvider({ model: "gpt-4.1-mini" });
  const result = await provider.analyzeLead({
    prospect: {
      id: "prospect-openai-1",
      name: "Odontoclinic - Jacarei",
      segment: "Clinica odontologica",
      city: "Jacarei",
      priority_score: 82,
      website_url: "https://example.com"
    },
    diagnostics: { website_notes: "Site sem CTA claro." }
  });

  assert.equal(result.prospect_id, "prospect-openai-1");
  assert.equal(validateLeadAnalysis(result).valid, true);
});

test("OpenAIProvider exposes generateSDRReply compatibility alias", async () => {
  const provider = new (ai().OpenAIProvider)();
  const result = await provider.generateSDRReply({
    prospect: { id: "prospect-openai-2", name: "Clinica Exemplo" },
    conversation: { last_message: "Quero entender como funciona", stage: "replied" }
  });

  assert.match(result.reply, /diagnostico|presenca digital|operacao/i);
  assert.equal(result.channel, "whatsapp");
});

test("prompt registry loads prompt files centrally instead of hardcoding prompt text", () => {
  const { loadPrompt, getPromptDescriptor } = ai();
  const descriptor = getPromptDescriptor("sdr");
  const prompt = loadPrompt("sdr", { rootDir: root });

  assert.equal(descriptor.path, "/prompts/sdr.md");
  assert.equal(prompt.key, "sdr");
  assert.match(prompt.content, /SDR PRO|ALIENXIP|MOTHERXIP/i);
});

test("cost engine estimates GPT-4.1 Mini costs from a single central config", () => {
  const { AI_MODEL_PRICING, estimateOpenAICost } = ai();

  assert.ok(AI_MODEL_PRICING["gpt-4.1-mini"]);
  assert.equal(estimateOpenAICost({ model: "gpt-4.1-mini", inputTokens: 0, outputTokens: 0 }), 0);
  assert.ok(estimateOpenAICost({ model: "gpt-4.1-mini", inputTokens: 1000, outputTokens: 1000 }) > 0);
});

test("usage tracker stores zero-cost dry-run events in memory only", () => {
  const { clearAIUsageLogs, getAIUsageLogs, trackAIUsage } = ai();

  clearAIUsageLogs();
  const log = trackAIUsage({
    provider: "openai",
    model: "gpt-4.1-mini",
    feature: "analyzeLead",
    estimated_input_tokens: 120,
    estimated_output_tokens: 80,
    estimated_cost: 0
  });

  assert.equal(log.provider, "openai");
  assert.equal(log.estimated_cost, 0);
  assert.match(log.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(getAIUsageLogs().length, 1);
});

test("OpenAI provider infrastructure does not import SDKs or perform HTTP calls", () => {
  for (const relativePath of [
    "app-next/src/lib/ai/openai-provider.ts",
    "app-next/src/lib/ai/provider.ts",
    "app-next/src/lib/ai/cost-engine.ts",
    "app-next/src/lib/ai/usage-tracker.ts",
    "app-next/src/lib/ai/cost-guard.ts"
  ]) {
    const sourcePath = join(root, relativePath);
    assert.equal(existsSync(sourcePath), true, `${relativePath} should exist`);
    const source = readFileSync(sourcePath, "utf8");
    assert.doesNotMatch(source, /from ["']openai["']|new OpenAI\(|fetch\(|axios|from ["']@anthropic|from ["']@google/i);
  }
});
