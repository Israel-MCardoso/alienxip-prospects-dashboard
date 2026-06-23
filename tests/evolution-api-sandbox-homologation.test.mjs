import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const ts = require(join(root, "app-next/node_modules/typescript"));
const nodeBin = process.execPath;
const preflightScript = join(root, "scripts/evolution-preflight.mjs");
const sendScript = join(root, "scripts/evolution-send-test-message.mjs");
const reportPath = "C:\\tmp\\evolution-sandbox-homologation-test-report.md";

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

const evolution = () => loadTsModule("app-next/src/lib/outreach/evolution/index.ts", new Map());

const validSandboxEnv = {
  ...process.env,
  EVOLUTION_API_BASE_URL: "https://evolution.sandbox.local",
  EVOLUTION_API_KEY: "ev-test-secret-should-not-print",
  EVOLUTION_INSTANCE_NAME: "motherxip-sandbox",
  EVOLUTION_PROVIDER_ENABLED: "true",
  EVOLUTION_TEST_PHONE: "5512988887777",
  EVOLUTION_SANDBOX_REPORT_PATH: reportPath
};

function runScript(script, args = [], env = validSandboxEnv) {
  return spawnSync(nodeBin, [script, ...args], {
    cwd: root,
    env,
    encoding: "utf8"
  });
}

test("EvolutionProvider health check returns safe status when disabled or unconfigured", async () => {
  const { EvolutionProvider } = evolution();
  const provider = new EvolutionProvider();
  const health = await provider.checkInstanceHealth();

  assert.equal(health.status, "unknown");
  assert.equal(health.connected, false);
  assert.equal(health.raw_status_sanitized, "not_configured");
});

test("EvolutionProvider health check sanitizes transport responses and tokens", async () => {
  const { EvolutionProvider } = evolution();
  const provider = new EvolutionProvider({
    baseUrl: "https://evolution.sandbox.local",
    instance: "motherxip-sandbox",
    apiKey: "ev-test-secret-should-not-print",
    transport: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ instance: "motherxip-sandbox", state: "open", token: "ev-test-secret-should-not-print" })
    })
  });
  const health = await provider.checkInstanceHealth();

  assert.equal(health.status, "connected");
  assert.equal(health.connected, true);
  assert.ok(health.latency_ms >= 0);
  assert.doesNotMatch(health.raw_status_sanitized, /ev-test-secret-should-not-print/);
  assert.match(health.raw_status_sanitized, /\*\*\*redacted\*\*\*/);
});

test("evolution preflight validates envs, writes sanitized report and never sends", () => {
  const result = runScript(preflightScript);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /preflight_passed/);
  assert.doesNotMatch(result.stdout + result.stderr, /ev-test-secret-should-not-print/);
  assert.equal(existsSync(reportPath), true);
  const report = readFileSync(reportPath, "utf8");
  assert.match(report, /Envio de mensagem: nao executado/);
  assert.match(report, /EVOLUTION_API_KEY: ok \(presente, sanitizada\)/);
  assert.doesNotMatch(report, /ev-test-secret-should-not-print/);
});

test("evolution preflight fails safely when provider is not explicitly enabled for single test", () => {
  const result = runScript(preflightScript, [], {
    ...validSandboxEnv,
    EVOLUTION_PROVIDER_ENABLED: "false"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /EVOLUTION_PROVIDER_ENABLED=true/);
  assert.doesNotMatch(result.stdout + result.stderr, /ev-test-secret-should-not-print/);
});

test("test message harness requires explicit approval flag before any send path", () => {
  const result = runScript(sendScript);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /--i-approve-one-test-message/);
  assert.doesNotMatch(result.stdout + result.stderr, /ev-test-secret-should-not-print/);
});

test("test message harness blocks invalid or missing test phone before send", () => {
  const result = runScript(sendScript, ["--i-approve-one-test-message"], {
    ...validSandboxEnv,
    EVOLUTION_TEST_PHONE: "+55 12 98888-7777"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /EVOLUTION_TEST_PHONE/);
  assert.doesNotMatch(result.stdout + result.stderr, /ev-test-secret-should-not-print/);
});

test("Outreach Settings UI exposes sandbox Evolution health fields and warning", () => {
  const source = readFileSync(join(root, "app-next/src/features/outreach/outreach-settings-panel.tsx"), "utf8");

  for (const text of [
    "Evolution Provider Enabled",
    "Instance Name",
    "Health Status",
    "Last Check",
    "Test Mode",
    "Nao enviar para leads reais"
  ]) {
    assert.match(source, new RegExp(text));
  }
});

test("Evolution sandbox docs and scripts exist", () => {
  for (const relativePath of [
    "scripts/evolution-preflight.mjs",
    "scripts/evolution-health-check.mjs",
    "scripts/evolution-send-test-message.mjs",
    "docs/EVOLUTION_API_SANDBOX_SETUP.md",
    "docs/EVOLUTION_API_SANDBOX_HOMOLOGATION_REPORT.md"
  ]) {
    assert.equal(existsSync(join(root, relativePath)), true, `${relativePath} should exist`);
  }
});
