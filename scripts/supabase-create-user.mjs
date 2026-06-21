import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const allowedRoles = new Set(["owner", "admin", "operator", "manager", "member", "viewer"]);

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
const email = readEnv("MOTHERXIP_USER_EMAIL");
const password = readEnv("MOTHERXIP_USER_PASSWORD");
const fullName = readEnv("MOTHERXIP_USER_FULL_NAME") || email?.split("@")[0] || "MOTHERXIP User";
const role = readEnv("MOTHERXIP_USER_ROLE") || "member";

assertPresent(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
assertPresent(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
assertPresent(email, "MOTHERXIP_USER_EMAIL");
assertPresent(password, "MOTHERXIP_USER_PASSWORD");

if (!allowedRoles.has(role)) {
  fail(`MOTHERXIP_USER_ROLE must be one of: ${Array.from(allowedRoles).join(", ")}`);
}

const createdUser = await createAuthUser();
await upsertProfile(createdUser.id);

console.log("MOTHERXIP user ready");
console.log(`email=${email}`);
console.log(`role=${role}`);
console.log(`profile=active`);

async function createAuthUser() {
  const response = await supabaseFetch("/auth/v1/admin/users", {
    method: "POST",
    headers: serviceHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })
  });

  const body = await readJson(response);

  if (response.ok) {
    return body;
  }

  const message = JSON.stringify(body).toLowerCase();
  if (!message.includes("already") && !message.includes("registered") && !message.includes("exists")) {
    fail(`Failed to create auth user: ${response.status} ${response.statusText} ${sanitize(JSON.stringify(body))}`);
  }

  const existing = await findUserByEmail();
  if (!existing) {
    fail("Auth user already exists, but could not be found by Admin API.");
  }
  return existing;
}

async function findUserByEmail() {
  let page = 1;
  while (page <= 20) {
    const response = await supabaseFetch(`/auth/v1/admin/users?page=${page}&per_page=100`, {
      headers: serviceHeaders()
    });
    const body = await readJson(response);
    if (!response.ok) {
      fail(`Failed to list auth users: ${response.status} ${response.statusText} ${sanitize(JSON.stringify(body))}`);
    }

    const users = Array.isArray(body?.users) ? body.users : [];
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 100) return null;
    page++;
  }
  return null;
}

async function upsertProfile(userId) {
  const response = await supabaseFetch("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: serviceHeaders({
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    }),
    body: JSON.stringify({
      id: userId,
      email,
      full_name: fullName,
      role,
      is_active: true
    })
  });

  if (!response.ok) {
    fail(`Failed to upsert profile: ${response.status} ${response.statusText} ${await safeText(response)}`);
  }
}

function readEnv(name) {
  return process.env[name]?.trim();
}

function assertPresent(value, name) {
  if (!value || value.includes("YOUR_")) {
    fail(`${name} is required.`);
  }
}

async function supabaseFetch(path, init = {}) {
  return fetch(`${supabaseUrl}${path}`, init);
}

function serviceHeaders(extra = {}) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    ...extra
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function safeText(response) {
  return sanitize((await response.text()).slice(0, 500));
}

function sanitize(value) {
  return String(value).replaceAll(serviceRoleKey || "__NO_SERVICE_ROLE_KEY__", "[service-role-key]");
}

function fail(message) {
  console.error(message);
  process.exit(1);
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
