#!/usr/bin/env node
import { accessSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { constants } from "node:fs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = process.env.OPENAI_SINGLE_CALL_REPORT_PATH || join(root, "docs", "OPENAI_SINGLE_CALL_SANDBOX_REPORT.md");
const args = new Set(process.argv.slice(2));
const callFlag = "--i-approve-one-openai-call";
const preflightFlag = "--preflight";
const model = process.env.OPENAI_SDR_MODEL || "gpt-4.1-mini";
const promptPath = join(root, "prompts", "sdr.md");
const schemaPath = join(root, "schemas", "ai", "ConversationState.schema.json");

const scenario = {
  feature: "Gerar Resposta SDR",
  message: "Tenho interesse, como funciona?",
  lead: {
    company_name: "Clinica Exemplo",
    segment: "Clinica odontologica",
    city: "Sao Jose dos Campos",
    temperature: "hot",
    priority_score: 85
  }
};

const replySchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "intent", "stage", "confidence", "next_action", "channel", "handoff_required", "needs_human_review"],
  properties: {
    reply: { type: "string" },
    intent: { type: "string" },
    stage: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    next_action: {
      type: "string",
      enum: ["continue_diagnosis", "schedule_meeting", "handoff_human", "follow_up", "diagnose"]
    },
    channel: { type: "string", enum: ["whatsapp", "instagram", "email", "manual"] },
    handoff_required: { type: "boolean" },
    needs_human_review: { type: "boolean" }
  }
};

function redact(value) {
  return String(value || "").replace(/sk-[A-Za-z0-9_-]+/g, "sk-***redacted***");
}

function numberFromEnv(key) {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(JSON.stringify(value ?? "").length / 4));
}

function estimateCost(inputTokens, outputTokens, prices) {
  return Number(((inputTokens / 1_000_000 * prices.input) + (outputTokens / 1_000_000 * prices.output)).toFixed(8));
}

function loadPromptAndSchema() {
  const prompt = readFileSync(promptPath, "utf8");
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  return { prompt, schema };
}

function validatePriceRegistration() {
  const input = numberFromEnv("OPENAI_GPT41_MINI_INPUT_USD_PER_1M");
  const output = numberFromEnv("OPENAI_GPT41_MINI_OUTPUT_USD_PER_1M");
  const source = process.env.OPENAI_PRICE_SOURCE_URL || "";
  const validatedAt = process.env.OPENAI_PRICE_VALIDATED_AT || "";
  const sourceIsOfficial = /^https:\/\/(openai\.com|developers\.openai\.com|platform\.openai\.com)\//.test(source);
  const valid = input > 0 && output > 0 && sourceIsOfficial && validatedAt.length > 0;

  return {
    valid,
    input,
    output,
    source: source || "nao informado",
    validatedAt: validatedAt || "nao informado",
    reason: valid ? "price_validation_passed" : "price validation missing or unclear"
  };
}

function runPreflight() {
  const checks = [];
  const add = (name, passed, detail) => checks.push({ name, passed, detail });

  add("PROVIDER_ENABLED=true", process.env.PROVIDER_ENABLED === "true", `atual=${process.env.PROVIDER_ENABLED || "undefined"}`);
  add("AI_DRY_RUN=false", process.env.AI_DRY_RUN === "false", `atual=${process.env.AI_DRY_RUN || "undefined"}`);
  add("OPENAI_API_KEY", Boolean(process.env.OPENAI_API_KEY), process.env.OPENAI_API_KEY ? "presente, sanitizada" : "ausente");
  add("OPENAI_SDR_MODEL=gpt-4.1-mini", model === "gpt-4.1-mini", `atual=${model}`);
  add("MAX_COST_PER_CONVERSATION > 0", numberFromEnv("MAX_COST_PER_CONVERSATION") > 0, `atual=${process.env.MAX_COST_PER_CONVERSATION || "undefined"}`);
  add("MAX_DAILY_COST > 0", numberFromEnv("MAX_DAILY_COST") > 0, `atual=${process.env.MAX_DAILY_COST || "undefined"}`);

  try {
    accessSync(dirname(reportPath), constants.W_OK);
    add("relatorio gravavel", true, reportPath);
  } catch (error) {
    add("relatorio gravavel", false, error.message);
  }

  try {
    const { prompt, schema } = loadPromptAndSchema();
    add("prompts carregados", prompt.includes("SDR PRO"), promptPath);
    add("schema carregado", schema.title === "ConversationState", schemaPath);
  } catch (error) {
    add("prompts/schema carregados", false, error.message);
  }

  return {
    passed: checks.every((check) => check.passed),
    checks
  };
}

function validateReply(value) {
  const errors = [];
  const nextActions = new Set(["continue_diagnosis", "schedule_meeting", "handoff_human", "follow_up", "diagnose"]);
  if (!value || typeof value !== "object") errors.push("response must be object");
  if (typeof value?.reply !== "string" || value.reply.trim().length === 0) errors.push("reply must be a non-empty string");
  if (typeof value?.intent !== "string" || value.intent.trim().length === 0) errors.push("intent must be a non-empty string");
  if (typeof value?.stage !== "string" || value.stage.trim().length === 0) errors.push("stage must be a non-empty string");
  if (!nextActions.has(value?.next_action)) errors.push("next_action invalid");
  if (typeof value?.confidence !== "number" || value.confidence < 0 || value.confidence > 1) errors.push("confidence must be between 0 and 1");
  if (!["whatsapp", "instagram", "email", "manual"].includes(value?.channel)) errors.push("channel invalid");
  if (typeof value?.handoff_required !== "boolean") errors.push("handoff_required must be boolean");
  if (typeof value?.needs_human_review !== "boolean") errors.push("needs_human_review must be boolean");
  if (!/(perfeito|legal|entendo|podemos|diagnostico|diagnóstico|presenca|presença|sua|voce|você|clinica|clínica)/i.test(value?.reply || "")) {
    errors.push("reply should be in Portuguese and consultative");
  }
  if (/(garantid[oa]|ultima chance|última chance|so hoje|só hoje|obrigatorio|obrigatório|imperdivel|imperdível)/i.test(value?.reply || "")) {
    errors.push("reply contains aggressive pressure or guarantee");
  }
  return { valid: errors.length === 0, errors };
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  const content = responseJson.output?.flatMap((item) => item.content || []) || [];
  const textItem = content.find((item) => typeof item.text === "string");
  return textItem?.text || "";
}

function safeFallback() {
  return {
    reply: "Legal. Antes de falar em escopo, faz sentido entendermos rapidamente sua presenca digital, canais atuais e objetivo comercial. Assim a recomendacao fica mais precisa para sua operacao.",
    intent: "interested",
    stage: "replied",
    confidence: 0.74,
    next_action: "continue_diagnosis",
    channel: "whatsapp",
    handoff_required: false,
    needs_human_review: false
  };
}

function renderReport(state) {
  const lines = [
    "# OPENAI SINGLE CALL SANDBOX REPORT",
    "",
    `Data: ${new Date().toISOString()}`,
    "",
    "## Preflight",
    "",
    `Resultado: ${state.preflight?.passed ? "passou" : "falhou"}`,
    ""
  ];

  for (const check of state.preflight?.checks || []) {
    lines.push(`- ${check.name}: ${check.passed ? "ok" : "falhou"} (${redact(check.detail)})`);
  }

  lines.push(
    "",
    "## Validacao de Preco Oficial",
    "",
    `Input price: ${state.price?.input || "nao validado"} USD / 1M tokens`,
    `Output price: ${state.price?.output || "nao validado"} USD / 1M tokens`,
    `Data da validacao: ${state.price?.validatedAt || "nao informado"}`,
    `Fonte usada: ${state.price?.source || "nao informado"}`,
    `Status: ${state.price?.valid ? "claro" : "nao claro"}`,
    "",
    "## Execucao",
    "",
    `Chamada foi executada: ${state.callExecuted ? "sim" : "nao"}`,
    `Chamadas OpenAI executadas: ${state.callCount}`,
    `Modelo usado: ${model}`,
    `Tokens de entrada: ${state.inputTokens ?? 0}`,
    `Tokens de saida: ${state.outputTokens ?? 0}`,
    `Custo estimado: ${state.estimatedCost ?? 0}`,
    "",
    "## Resposta Bruta Sanitizada",
    "",
    "```json",
    state.rawSanitized || "{}",
    "```",
    "",
    "## Resposta Parseada",
    "",
    "```json",
    JSON.stringify(state.parsedResponse || null, null, 2),
    "```",
    "",
    "## Validacao de Schema",
    "",
    `Valida: ${state.validation?.valid ? "sim" : "nao"}`,
    `Erros: ${(state.validation?.errors || []).join("; ") || "nenhum"}`,
    "",
    "## Fallback",
    "",
    `Fallback usado: ${state.fallbackUsed ? "sim" : "nao"}`,
    "",
    "## Seguranca",
    "",
    "- WhatsApp real: nao",
    "- Evolution API: nao",
    "- Callback real: nao",
    "- Supabase alterado: nao",
    "- n8n alterado: nao",
    "- API key exposta: nao",
    "",
    "## Recomendacao",
    "",
    state.recommendation
  );

  writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function executeSingleCall() {
  const preflight = runPreflight();
  const price = validatePriceRegistration();
  const state = {
    preflight,
    price,
    callExecuted: false,
    callCount: 0,
    fallbackUsed: false,
    validation: { valid: false, errors: [] },
    recommendation: "bloquear provider real"
  };

  if (!preflight.passed) {
    state.validation.errors.push("preflight failed");
    state.fallbackUsed = true;
    state.parsedResponse = safeFallback();
    renderReport(state);
    throw new Error("Preflight failed. No OpenAI call was made.");
  }

  if (!price.valid) {
    state.validation.errors.push(price.reason);
    state.fallbackUsed = true;
    state.parsedResponse = safeFallback();
    renderReport(state);
    throw new Error("OpenAI price validation is missing or unclear. No OpenAI call was made.");
  }

  const { prompt } = loadPromptAndSchema();
  const payload = {
    model,
    input: [
      {
        role: "system",
        content: `${prompt}\n\nResponda somente JSON valido no schema solicitado. Nao prometa resultado garantido. Nao pressione o lead.`
      },
      {
        role: "user",
        content: JSON.stringify(scenario)
      }
    ],
    max_output_tokens: 220,
    text: {
      format: {
        type: "json_schema",
        name: "motherxip_sdr_reply",
        schema: replySchema,
        strict: true
      }
    }
  };

  state.inputTokens = estimateTokens(payload);

  let responseJson;
  state.callCount = 1;
  state.callExecuted = true;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  responseJson = await response.json();
  state.rawSanitized = redact(JSON.stringify(responseJson, null, 2));
  state.inputTokens = responseJson.usage?.input_tokens ?? state.inputTokens;
  state.outputTokens = responseJson.usage?.output_tokens ?? estimateTokens(responseJson);
  state.estimatedCost = estimateCost(state.inputTokens, state.outputTokens, price);

  if (!response.ok) {
    state.fallbackUsed = true;
    state.parsedResponse = safeFallback();
    state.validation = { valid: false, errors: [`OpenAI HTTP ${response.status}`] };
    state.recommendation = "bloquear provider real";
    renderReport(state);
    throw new Error(`OpenAI call failed with HTTP ${response.status}. No retry was attempted.`);
  }

  try {
    state.parsedResponse = JSON.parse(extractOutputText(responseJson));
    state.validation = validateReply(state.parsedResponse);
  } catch (error) {
    state.parsedResponse = safeFallback();
    state.fallbackUsed = true;
    state.validation = { valid: false, errors: [`JSON parse failed: ${error.message}`] };
  }

  if (!state.validation.valid) {
    state.fallbackUsed = true;
    state.recommendation = "ajustar prompt";
  } else {
    state.recommendation = "aprovado para 5 chamadas";
  }

  renderReport(state);
  return state;
}

async function main() {
  if (args.has(preflightFlag)) {
    const preflight = runPreflight();
    const price = validatePriceRegistration();
    renderReport({
      preflight,
      price,
      callExecuted: false,
      callCount: 0,
      fallbackUsed: false,
      rawSanitized: "{}",
      parsedResponse: null,
      validation: { valid: preflight.passed, errors: preflight.passed ? [] : preflight.checks.filter((check) => !check.passed).map((check) => check.name) },
      recommendation: preflight.passed ? "aguardar aprovacao explicita para chamada unica" : "bloquear provider real"
    });

    if (!preflight.passed) {
      console.error(redact(`preflight_failed: ${preflight.checks.filter((check) => !check.passed).map((check) => check.name).join(", ")}`));
      process.exitCode = 1;
      return;
    }

    console.log("preflight_passed: no OpenAI call was made");
    return;
  }

  if (!args.has(callFlag)) {
    console.error(`Use ${preflightFlag} first. To execute exactly one paid OpenAI call, rerun with ${callFlag}.`);
    process.exitCode = 1;
    return;
  }

  try {
    const state = await executeSingleCall();
    console.log(`single_call_completed: calls=${state.callCount}; validation=${state.validation.valid ? "passed" : "failed"}`);
  } catch (error) {
    console.error(redact(error.message));
    process.exitCode = 1;
  }
}

const runningAsNodeTestFile = process.execArgv.includes("--test") && process.argv[1]?.endsWith("test-openai-single-call.mjs");

if (!runningAsNodeTestFile && (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("test-openai-single-call.mjs"))) {
  main();
}
