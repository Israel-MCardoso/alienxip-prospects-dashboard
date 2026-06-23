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

const evolution = () => loadTsModule("app-next/src/lib/outreach/evolution/index.ts", new Map());
const rateLimit = () => loadTsModule("app-next/src/lib/outreach/rate-limit/index.ts", new Map());
const retry = () => loadTsModule("app-next/src/lib/outreach/retry/index.ts", new Map());
const deadLetter = () => loadTsModule("app-next/src/lib/outreach/dead-letter.ts", new Map());
const optOut = () => loadTsModule("app-next/src/lib/outreach/opt-out.ts", new Map());
const alerts = () => loadTsModule("app-next/src/lib/outreach/alerts.ts", new Map());

test("E.164 validator accepts Brazilian digits and rejects unsafe phone shapes", () => {
  const { validateE164Phone } = evolution();

  assert.equal(validateE164Phone("5512988887777").valid, true);
  assert.equal(validateE164Phone("+5512988887777").valid, false);
  assert.equal(validateE164Phone("55 12 98888 7777").valid, false);
  assert.equal(validateE164Phone("abc5512988887777").valid, false);
  assert.equal(validateE164Phone("123").valid, false);
});

test("Evolution status mapper normalizes production outreach states", () => {
  const { mapEvolutionStatus, OUTREACH_PRODUCTION_STATUSES } = evolution();

  assert.deepEqual(OUTREACH_PRODUCTION_STATUSES, [
    "queued",
    "sent",
    "delivered",
    "read",
    "replied",
    "meeting_scheduled",
    "failed",
    "paused",
    "stopped",
    "opt_out"
  ]);
  assert.equal(mapEvolutionStatus("PENDING"), "queued");
  assert.equal(mapEvolutionStatus("DELIVERY_ACK"), "delivered");
  assert.equal(mapEvolutionStatus("READ"), "read");
  assert.equal(mapEvolutionStatus("unknown-status"), "failed");
});

test("WhatsApp provider factory keeps Evolution real provider disabled by default", async () => {
  const { EvolutionProvider, getWhatsAppProvider } = evolution();

  const provider = getWhatsAppProvider({ env: { EVOLUTION_PROVIDER_ENABLED: "false" } });
  assert.equal(provider.name, "mock-whatsapp");
  assert.equal(provider.enabled, true);

  const real = new EvolutionProvider({ baseUrl: "https://evolution.example", instance: "sandbox", apiKey: "secret" });
  assert.equal(real.name, "evolution");
  assert.equal(real.enabled, false);
  await assert.rejects(() => real.sendMessage({ to: "5512988887777", message: "teste" }), /disabled/);
});

test("rate limit blocks outside business window and when hourly or daily caps are reached", () => {
  const { canSendMessage, getRandomDelayMs } = rateLimit();
  const config = {
    messagesPerHour: 2,
    messagesPerDay: 3,
    minDelaySeconds: 30,
    maxDelaySeconds: 180,
    businessStartHour: 8,
    businessEndHour: 18,
    timezone: "America/Sao_Paulo"
  };

  assert.equal(canSendMessage({ config, sentAt: [], now: new Date("2026-06-13T06:59:00-03:00") }).allowed, false);
  assert.equal(canSendMessage({ config, sentAt: [new Date("2026-06-13T10:00:00-03:00"), new Date("2026-06-13T10:15:00-03:00")], now: new Date("2026-06-13T10:30:00-03:00") }).reason, "hourly_limit_reached");
  assert.equal(canSendMessage({ config, sentAt: [new Date("2026-06-13T08:10:00-03:00"), new Date("2026-06-13T09:00:00-03:00"), new Date("2026-06-13T10:00:00-03:00")], now: new Date("2026-06-13T11:00:00-03:00") }).reason, "daily_limit_reached");
  assert.equal(getRandomDelayMs(config, () => 0), 30_000);
  assert.equal(getRandomDelayMs(config, () => 1), 180_000);
});

test("retry engine applies exponential backoff and routes exhausted failures to dead letter", () => {
  const { getRetryDecision } = retry();

  assert.deepEqual(getRetryDecision({ failedAttempt: 1, maxAttempts: 3, baseDelaySeconds: 30 }), {
    action: "retry",
    nextAttempt: 2,
    delayMs: 30_000
  });
  assert.deepEqual(getRetryDecision({ failedAttempt: 2, maxAttempts: 3, baseDelaySeconds: 30 }), {
    action: "retry",
    nextAttempt: 3,
    delayMs: 60_000
  });
  assert.equal(getRetryDecision({ failedAttempt: 3, maxAttempts: 3, baseDelaySeconds: 30 }).action, "dead_letter");
});

test("dead letter factory preserves payload, source, attempt and sanitized error", () => {
  const { createDeadLetter } = deadLetter();
  const entry = createDeadLetter({
    payload: { prospect_id: "p1", phone: "5512988887777" },
    error: new Error("Evolution offline"),
    source: "evolution",
    attempt: 3
  });

  assert.equal(entry.source, "evolution");
  assert.equal(entry.attempt, 3);
  assert.equal(entry.error, "Evolution offline");
  assert.match(entry.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(entry.payload, { prospect_id: "p1", phone: "5512988887777" });
});

test("opt-out engine detects stop messages and blocks future sends", () => {
  const { detectOptOut, shouldBlockOutboundForStatus } = optOut();

  for (const message of ["pare", "parar", "nao tenho interesse", "não tenho interesse", "remover", "cancelar", "stop", "unsubscribe"]) {
    assert.equal(detectOptOut(message).isOptOut, true, message);
  }
  assert.equal(detectOptOut("Pode me explicar melhor?").isOptOut, false);
  assert.equal(shouldBlockOutboundForStatus("opt_out"), true);
  assert.equal(shouldBlockOutboundForStatus("stopped"), true);
  assert.equal(shouldBlockOutboundForStatus("replied"), false);
});

test("operational alert factory creates local, unsent alerts for production readiness", () => {
  const { createOperationalAlert } = alerts();
  const alert = createOperationalAlert({
    type: "evolution_offline",
    severity: "critical",
    message: "Evolution heartbeat atrasado",
    metadata: { instance: "production" }
  });

  assert.equal(alert.delivered, false);
  assert.equal(alert.type, "evolution_offline");
  assert.match(alert.created_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("production readiness files avoid external calls and real provider activation", () => {
  for (const relativePath of [
    "app-next/src/lib/outreach/evolution/client.ts",
    "app-next/src/lib/outreach/evolution/provider.ts",
    "app-next/src/lib/outreach/rate-limit/index.ts",
    "app-next/src/lib/outreach/retry/index.ts",
    "app-next/src/lib/outreach/dead-letter.ts",
    "app-next/src/lib/outreach/opt-out.ts",
    "app-next/src/lib/outreach/alerts.ts"
  ]) {
    const sourcePath = join(root, relativePath);
    assert.equal(existsSync(sourcePath), true, `${relativePath} should exist`);
    const source = readFileSync(sourcePath, "utf8");
    assert.doesNotMatch(source, /fetch\(|axios|new OpenAI\(|from ["']openai["']|sendWhatsApp|evolution\.send/i);
  }
});
