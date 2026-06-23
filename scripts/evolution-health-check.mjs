#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = process.env.EVOLUTION_SANDBOX_REPORT_PATH || join(root, "docs", "EVOLUTION_API_SANDBOX_HOMOLOGATION_REPORT.md");

function redact(value) {
  return String(value || "")
    .replace(/ev-[A-Za-z0-9_-]+/g, "ev-***redacted***")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***redacted***")
    .replace(/"token"\s*:\s*"[^"]+"/gi, "\"token\":\"***redacted***\"")
    .replace(/"apikey"\s*:\s*"[^"]+"/gi, "\"apikey\":\"***redacted***\"")
    .replace(/"apiKey"\s*:\s*"[^"]+"/g, "\"apiKey\":\"***redacted***\"");
}

function missingEnv() {
  return ["EVOLUTION_API_BASE_URL", "EVOLUTION_API_KEY", "EVOLUTION_INSTANCE_NAME"]
    .filter((key) => !process.env[key]);
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
    `Status: ${state.status}`,
    `Connected: ${state.connected ? "sim" : "nao"}`,
    `Latency: ${state.latency_ms}ms`,
    `Instance: ${state.instance}`,
    `Raw sanitized: ${state.raw_status_sanitized}`,
    "",
    "## Test Message",
    "",
    "Envio de mensagem: nao executado",
    "Mensagens enviadas: 0",
    "",
    "## Seguranca",
    "",
    "- Token exposto: nao",
    "- Campanha real enviada: nao",
    "- Lead real contatado: nao",
    "- OpenAI: desligada",
    "- Production workflow: nao ativado",
    "",
    "## Proximo Passo",
    "",
    state.connected ? "Instancia conectada. Envio unico ainda exige flag explicita." : "Nao enviar mensagem enquanto a instancia nao estiver conectada."
  ];
  writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const missing = missingEnv();
  if (missing.length > 0) {
    renderReport({
      preflightPassed: false,
      connected: false,
      status: "unknown",
      latency_ms: 0,
      instance: process.env.EVOLUTION_INSTANCE_NAME || "ausente",
      raw_status_sanitized: `missing_envs:${missing.join(",")}`
    });
    console.error(`health_check_blocked: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const startedAt = Date.now();
  const baseUrl = process.env.EVOLUTION_API_BASE_URL.replace(/\/+$/, "");
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  try {
    const response = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
      method: "GET",
      headers: {
        apikey: process.env.EVOLUTION_API_KEY
      }
    });
    const body = await response.json();
    const raw = redact(JSON.stringify(body));
    const connected = response.ok && /open|connected|online/i.test(raw);
    const state = {
      preflightPassed: true,
      connected,
      status: connected ? "connected" : "disconnected",
      latency_ms: Date.now() - startedAt,
      instance,
      raw_status_sanitized: raw
    };
    renderReport(state);
    console.log(`health_check_completed: status=${state.status}; latency_ms=${state.latency_ms}`);
    process.exitCode = connected ? 0 : 1;
  } catch (error) {
    renderReport({
      preflightPassed: true,
      connected: false,
      status: "unknown",
      latency_ms: Date.now() - startedAt,
      instance,
      raw_status_sanitized: redact(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
    });
    console.error(redact(`health_check_failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exitCode = 1;
  }
}

main();
