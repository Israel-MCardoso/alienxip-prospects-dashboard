import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scriptPath = join(root, "scripts/test-openai-single-call.mjs");
const reportPath = "C:\\tmp\\openai-single-call-harness-report.md";

const passingPreflightEnv = {
  ...process.env,
  PROVIDER_ENABLED: "true",
  AI_DRY_RUN: "false",
  OPENAI_API_KEY: "sk-test-secret-that-must-not-print",
  OPENAI_SDR_MODEL: "gpt-4.1-mini",
  MAX_COST_PER_CONVERSATION: "0.01",
  MAX_DAILY_COST: "0.05",
  OPENAI_GPT41_MINI_INPUT_USD_PER_1M: "0.40",
  OPENAI_GPT41_MINI_OUTPUT_USD_PER_1M: "1.60",
  OPENAI_PRICE_SOURCE_URL: "https://openai.com/api/pricing/",
  OPENAI_PRICE_VALIDATED_AT: "2026-06-12",
  OPENAI_SINGLE_CALL_REPORT_PATH: reportPath
};

function runScript(args, env = passingPreflightEnv) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    env,
    encoding: "utf8"
  });
}

test("single-call harness exists and exposes preflight mode", () => {
  assert.equal(existsSync(scriptPath), true);
  const source = readFileSync(scriptPath, "utf8");

  assert.match(source, /--preflight/);
  assert.match(source, /--i-approve-one-openai-call/);
});

test("preflight validates required flags without exposing the API key", () => {
  const result = runScript(["--preflight"]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /preflight_passed/);
  assert.doesNotMatch(result.stdout + result.stderr, /sk-test-secret-that-must-not-print/);
});

test("preflight fails safely when provider flags remain in zero-cost mode", () => {
  const result = runScript(["--preflight"], {
    ...passingPreflightEnv,
    PROVIDER_ENABLED: "false",
    AI_DRY_RUN: "true",
    MAX_COST_PER_CONVERSATION: "0",
    MAX_DAILY_COST: "0"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /PROVIDER_ENABLED=true|AI_DRY_RUN=false|MAX_COST_PER_CONVERSATION|MAX_DAILY_COST/);
  assert.doesNotMatch(result.stdout + result.stderr, /sk-test-secret-that-must-not-print/);
});

test("approval flag is required before any OpenAI network call path", () => {
  const result = runScript([]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /Use --preflight|--i-approve-one-openai-call/);
});

test("single-call mode is blocked when official pricing has not been validated", () => {
  const result = runScript(["--i-approve-one-openai-call"], {
    ...passingPreflightEnv,
    OPENAI_GPT41_MINI_INPUT_USD_PER_1M: undefined,
    OPENAI_GPT41_MINI_OUTPUT_USD_PER_1M: undefined
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /price validation/i);
  assert.doesNotMatch(result.stdout + result.stderr, /sk-test-secret-that-must-not-print/);
});

test("harness report is created with sanitized fields after preflight", () => {
  const result = runScript(["--preflight"]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(reportPath), true);
  const report = readFileSync(reportPath, "utf8");

  assert.match(report, /Preflight/);
  assert.match(report, /OPENAI_API_KEY: ok \(presente, sanitizada\)/);
  assert.doesNotMatch(report, /sk-test-secret-that-must-not-print/);
  assert.match(report, /Chamadas OpenAI executadas: 0/);
});
