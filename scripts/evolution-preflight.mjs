#!/usr/bin/env node
import { accessSync, writeFileSync } from "node:fs";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = process.env.EVOLUTION_SANDBOX_REPORT_PATH || join(root, "docs", "EVOLUTION_API_SANDBOX_HOMOLOGATION_REPORT.md");

function redact(value) {
  return String(value || "")
    .replace(/ev-[A-Za-z0-9_-]+/g, "ev-***redacted***")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***redacted***");
}

function maskPhone(phone) {
  const digits = String(phone || "");
  if (digits.length <= 4) return "****";
  return `${digits.slice(0, 4)}******${digits.slice(-2)}`;
}

function validTestPhone(phone) {
  return /^[1-9]\d{9,14}$/.test(String(phone || ""));
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validatePreflight(env = process.env) {
  const checks = [];
  const add = (name, passed, detail) => checks.push({ name, passed, detail });

  add("EVOLUTION_API_BASE_URL", Boolean(env.EVOLUTION_API_BASE_URL), env.EVOLUTION_API_BASE_URL ? "presente" : "ausente");
  add("EVOLUTION_API_BASE_URL valida", validUrl(env.EVOLUTION_API_BASE_URL || ""), env.EVOLUTION_API_BASE_URL || "ausente");
  add("EVOLUTION_API_KEY", Boolean(env.EVOLUTION_API_KEY), env.EVOLUTION_API_KEY ? "presente, sanitizada" : "ausente");
  add("EVOLUTION_INSTANCE_NAME", Boolean(env.EVOLUTION_INSTANCE_NAME), env.EVOLUTION_INSTANCE_NAME || "ausente");
  add("EVOLUTION_TEST_PHONE", validTestPhone(env.EVOLUTION_TEST_PHONE), env.EVOLUTION_TEST_PHONE ? maskPhone(env.EVOLUTION_TEST_PHONE) : "ausente");
  add("EVOLUTION_PROVIDER_ENABLED=true", env.EVOLUTION_PROVIDER_ENABLED === "true", `atual=${env.EVOLUTION_PROVIDER_ENABLED || "undefined"}`);

  try {
    accessSync(dirname(reportPath), constants.W_OK);
    add("relatorio gravavel", true, reportPath);
  } catch (error) {
    add("relatorio gravavel", false, error.message);
  }

  return {
    passed: checks.every((check) => check.passed),
    checks
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
    `Resultado: ${state.preflight.passed ? "passou" : "falhou"}`,
    ""
  ];

  for (const check of state.preflight.checks) {
    lines.push(`- ${check.name}: ${check.passed ? "ok" : "falhou"} (${redact(check.detail)})`);
  }

  lines.push(
    "",
    "## Health Check",
    "",
    "Status: nao executado neste preflight.",
    "",
    "## Test Message",
    "",
    "Envio de mensagem: nao executado",
    "Mensagens enviadas: 0",
    `Telefone de teste: ${maskPhone(process.env.EVOLUTION_TEST_PHONE)}`,
    "",
    "## Rate Limit",
    "",
    "Validacao: pendente do harness de envio aprovado.",
    "",
    "## Opt-Out",
    "",
    "Validacao local: preparada.",
    "",
    "## Dead Letter",
    "",
    "Validacao local: preparada. Migration nao aplicada.",
    "",
    "## Seguranca",
    "",
    "- Token exposto: nao",
    "- Campanha real enviada: nao",
    "- Lead real contatado: nao",
    "- OpenAI: desligada",
    "- Claude: desligado",
    "- Gemini: desligado",
    "- Production workflow: nao ativado",
    "",
    "## Proximo Passo",
    "",
    state.preflight.passed
      ? "Executar health check/mensagem somente com numero proprio de teste e flag explicita."
      : "Corrigir preflight antes de qualquer tentativa."
  );

  writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

const preflight = validatePreflight();
renderReport({ preflight });

if (!preflight.passed) {
  console.error(redact(`preflight_failed: ${preflight.checks.filter((check) => !check.passed).map((check) => check.name).join(", ")}`));
  process.exitCode = 1;
} else {
  console.log("preflight_passed: no Evolution message was sent");
}
