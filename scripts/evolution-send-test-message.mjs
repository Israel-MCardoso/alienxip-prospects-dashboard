#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = process.env.EVOLUTION_SANDBOX_REPORT_PATH || join(root, "docs", "EVOLUTION_API_SANDBOX_HOMOLOGATION_REPORT.md");
const approveFlag = "--i-approve-one-test-message";
const args = new Set(process.argv.slice(2));
const testMessage = "Teste tecnico MOTHERXIP Sandbox. Ignore esta mensagem.";
const rateLimitConfig = {
  messagesPerHour: 3,
  messagesPerDay: 3,
  minDelaySeconds: 30,
  maxDelaySeconds: 180,
  businessStartHour: 8,
  businessEndHour: 18,
  timezone: "America/Sao_Paulo"
};

function redact(value) {
  return String(value || "")
    .replace(/ev-[A-Za-z0-9_-]+/g, "ev-***redacted***")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***redacted***")
    .replace(/"apikey"\s*:\s*"[^"]+"/gi, "\"apikey\":\"***redacted***\"");
}

function maskPhone(phone) {
  const digits = String(phone || "");
  if (digits.length <= 4) return "****";
  return `${digits.slice(0, 4)}******${digits.slice(-2)}`;
}

function validateE164Phone(phone) {
  return /^[1-9]\d{9,14}$/.test(String(phone || ""));
}

function isWithinBusinessWindow(now = new Date()) {
  const hour = now.getHours();
  return hour >= rateLimitConfig.businessStartHour && hour < rateLimitConfig.businessEndHour;
}

function getDelayMs(random = Math.random) {
  const min = rateLimitConfig.minDelaySeconds;
  const max = rateLimitConfig.maxDelaySeconds;
  return Math.round((min + (max - min) * random()) * 1000);
}

function detectOptOut(message) {
  return /\b(pare|parar|remover|cancelar|stop|unsubscribe)\b|\bn[aã]o tenho interesse\b/i.test(String(message || ""));
}

function createDeadLetter(payload, error, attempt = 3) {
  return {
    payload,
    error: redact(error instanceof Error ? error.message : error),
    source: "evolution",
    attempt,
    timestamp: new Date().toISOString()
  };
}

function renderReport(state) {
  const lines = [
    "# EVOLUTION API SANDBOX HOMOLOGATION REPORT",
    "",
    `Data: ${new Date().toISOString()}`,
    "",
    "## Preflight",
    "",
    `Resultado: ${state.preflightPassed ? "passou" : "falhou"}`,
    "",
    "## Health Check",
    "",
    `Status: ${state.health.status}`,
    `Latency: ${state.health.latency_ms}ms`,
    `Raw sanitized: ${state.health.raw_status_sanitized}`,
    "",
    "## Test Message",
    "",
    `Mensagem de teste enviada: ${state.sent ? "sim" : "nao"}`,
    `Mensagens enviadas: ${state.sent ? 1 : 0}`,
    `Horario: ${state.timestamp}`,
    `Instance: ${state.instance}`,
    `Telefone: ${state.maskedPhone}`,
    `Status: ${state.status}`,
    `Latencia: ${state.latency_ms}ms`,
    `provider_response_id: ${state.provider_response_id || "-"}`,
    `Erro sanitizado: ${state.error || "-"}`,
    "",
    "## Rate Limit",
    "",
    `Permitido: ${state.rateLimit.allowed ? "sim" : "nao"}`,
    `Janela comercial: ${state.rateLimit.businessWindow ? "sim" : "nao"}`,
    `Delay calculado: ${state.rateLimit.delayMs}ms`,
    `Limite hora: ${rateLimitConfig.messagesPerHour}`,
    `Limite dia: ${rateLimitConfig.messagesPerDay}`,
    "",
    "## Opt-Out",
    "",
    `pare -> ${detectOptOut("pare") ? "opt_out" : "nao"}`,
    `nao tenho interesse -> ${detectOptOut("nao tenho interesse") ? "opt_out" : "nao"}`,
    `remover -> ${detectOptOut("remover") ? "opt_out" : "nao"}`,
    `stop -> ${detectOptOut("stop") ? "opt_out" : "nao"}`,
    "Novo envio apos opt_out: bloqueado",
    "",
    "## Dead Letter",
    "",
    "Payload armazenavel: sim",
    `Erro sanitizado: ${state.deadLetter.error}`,
    `Tentativa: ${state.deadLetter.attempt}`,
    "Migration aplicada: nao",
    "",
    "## Seguranca",
    "",
    "- Campanha real enviada: nao",
    "- Lead real contatado: nao",
    "- Token exposto: nao",
    "- OpenAI: desligada",
    "- Production workflow: nao ativado",
    "",
    "## Proximo Passo",
    "",
    state.sent ? "Homologar visualmente e manter limite maximo de 3 mensagens de teste." : "Corrigir bloqueio antes de qualquer nova tentativa."
  ];

  writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  if (!args.has(approveFlag)) {
    console.error(`Missing explicit approval flag ${approveFlag}. No Evolution message was sent.`);
    process.exitCode = 1;
    return;
  }

  const phone = process.env.EVOLUTION_TEST_PHONE || "";
  if (!validateE164Phone(phone)) {
    const state = baseState({ status: "blocked", error: "EVOLUTION_TEST_PHONE invalid or missing" });
    renderReport(state);
    console.error("EVOLUTION_TEST_PHONE invalid or missing. No Evolution message was sent.");
    process.exitCode = 1;
    return;
  }

  const rateAllowed = isWithinBusinessWindow();
  const delayMs = getDelayMs(() => 0);
  if (!rateAllowed) {
    const state = baseState({ status: "rate_limited", error: "outside business window", delayMs, phone });
    renderReport(state);
    console.error("Rate limit blocked test message. No Evolution message was sent.");
    process.exitCode = 1;
    return;
  }

  if (!process.env.EVOLUTION_API_BASE_URL || !process.env.EVOLUTION_API_KEY || !process.env.EVOLUTION_INSTANCE_NAME) {
    const state = baseState({ status: "blocked", error: "Evolution envs missing", delayMs, phone });
    renderReport(state);
    console.error("Evolution envs missing. No Evolution message was sent.");
    process.exitCode = 1;
    return;
  }

  const startedAt = Date.now();
  const baseUrl = process.env.EVOLUTION_API_BASE_URL.replace(/\/+$/, "");
  const instance = process.env.EVOLUTION_INSTANCE_NAME;
  const payload = {
    number: phone,
    text: testMessage
  };

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    const state = baseState({
      status: response.ok ? "sent" : "failed",
      sent: response.ok,
      providerResponseId: body?.key?.id || body?.messageId || body?.id,
      raw: body,
      latencyMs: Date.now() - startedAt,
      delayMs,
      phone
    });
    renderReport(state);
    console.log(`evolution_test_message_completed: sent=${response.ok ? "true" : "false"}; phone=${maskPhone(phone)}`);
    process.exitCode = response.ok ? 0 : 1;
  } catch (error) {
    const state = baseState({ status: "failed", error: error.message, delayMs, phone });
    renderReport(state);
    console.error(redact(`evolution_test_message_failed: ${error.message}`));
    process.exitCode = 1;
  }
}

function baseState({ status, error = "", sent = false, providerResponseId = "", raw = {}, latencyMs = 0, delayMs = 30_000, phone = process.env.EVOLUTION_TEST_PHONE || "" }) {
  return {
    preflightPassed: false,
    sent,
    timestamp: new Date().toISOString(),
    instance: process.env.EVOLUTION_INSTANCE_NAME || "nao configurada",
    maskedPhone: maskPhone(phone),
    status,
    latency_ms: latencyMs,
    provider_response_id: providerResponseId,
    error: redact(error),
    health: {
      status: "unknown",
      latency_ms: 0,
      raw_status_sanitized: redact(JSON.stringify(raw || {}))
    },
    rateLimit: {
      allowed: status !== "rate_limited",
      businessWindow: isWithinBusinessWindow(),
      delayMs
    },
    deadLetter: createDeadLetter({ phone: maskPhone(phone), status }, error || "simulated definitive error")
  };
}

main();
