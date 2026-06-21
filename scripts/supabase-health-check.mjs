import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

const checks = [];

await check("env: public URL", () => {
  assertPresent(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
  const url = new URL(supabaseUrl);
  if (url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use https.");
  }
  if (url.hostname.includes("YOUR_PROJECT_REF")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL still contains the placeholder project ref.");
  }
  return `host=${url.hostname}`;
});

await check("env: anon key", () => {
  assertPresent(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (anonKey.includes("YOUR_")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY still contains a placeholder.");
  }
  return "loaded";
});

await check("env: service role", () => {
  assertPresent(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey.includes("YOUR_")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY still contains a placeholder.");
  }
  return "loaded";
});

await check("auth endpoint", async () => {
  const response = await supabaseFetch("/auth/v1/settings", {
    headers: anonHeaders()
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return "reachable";
});

await check("admin auth API", async () => {
  const response = await supabaseFetch("/auth/v1/admin/users?page=1&per_page=1", {
    headers: serviceHeaders()
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await safeText(response)}`);
  }
  return "service role accepted";
});

await check("profiles table", async () => {
  const response = await supabaseFetch("/rest/v1/profiles?select=id,email,role,is_active&limit=1", {
    headers: serviceHeaders({ Prefer: "count=exact" })
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await safeText(response)}`);
  }
  return "readable via service role";
});

const failed = checks.filter((item) => item.status === "FAIL");

console.log("MOTHERXIP Supabase health check");
for (const item of checks) {
  console.log(`${item.status === "PASS" ? "PASS" : "FAIL"} ${item.name}: ${item.detail}`);
}

if (failed.length > 0) {
  process.exit(1);
}

function readEnv(name) {
  return process.env[name]?.trim();
}

async function check(name, fn) {
  try {
    const detail = await fn();
    checks.push({ name, status: "PASS", detail });
  } catch (error) {
    checks.push({
      name,
      status: "FAIL",
      detail: error instanceof Error ? sanitize(error.message) : "Unexpected error"
    });
  }
}

function assertPresent(value, name) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
}

async function supabaseFetch(path, init = {}) {
  return fetch(`${supabaseUrl}${path}`, init);
}

function anonHeaders(extra = {}) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
    ...extra
  };
}

function serviceHeaders(extra = {}) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    ...extra
  };
}

async function safeText(response) {
  const body = await response.text();
  return sanitize(body.slice(0, 500));
}

function sanitize(value) {
  return String(value)
    .replaceAll(anonKey || "__NO_ANON_KEY__", "[anon-key]")
    .replaceAll(serviceRoleKey || "__NO_SERVICE_ROLE_KEY__", "[service-role-key]");
}

function loadLocalEnv(fileName) {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
