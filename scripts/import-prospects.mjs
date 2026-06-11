import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildProspectImportRows,
  parseCsv
} from "../src/features/prospects/prospect-normalization.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;

console.log(`GOOGLE_SHEET_CSV_URL carregada: ${sheetUrl ? "sim" : "não"}`);
console.log(`Supabase URL carregada: ${supabaseUrl ? "sim" : "não"}`);

if (!supabaseUrl || supabaseUrl.includes("YOUR_PROJECT_REF")) {
  fail("NEXT_PUBLIC_SUPABASE_URL is required.");
}

if (supabaseUrl.includes("/rest/v1/")) {
  fail("NEXT_PUBLIC_SUPABASE_URL must not contain '/rest/v1/'.");
}

if (!serviceRoleKey || serviceRoleKey.includes("YOUR_")) {
  fail("SUPABASE_SERVICE_ROLE_KEY is required for local import scripts. Never expose it in frontend code.");
}

if (!sheetUrl || sheetUrl.includes("YOUR_SHEET_ID")) {
  fail("GOOGLE_SHEET_CSV_URL is required.");
}

const sheetResponse = await fetch(sheetUrl, {
  headers: {
    "user-agent": "Alienxip prospects importer"
  }
});

console.log(`HTTP status da Google Sheet: ${sheetResponse.status}`);

if (!sheetResponse.ok) {
  fail(`Could not fetch Google Sheet: ${sheetResponse.status} ${sheetResponse.statusText}`);
}

const csv = await sheetResponse.text();
const rows = buildProspectImportRows(parseCsv(csv));

if (rows.length === 0) {
  console.log("No prospects found to import.");
  process.exit(0);
}

const upserted = await supabaseRest(
  "/rest/v1/prospects?on_conflict=imported_from,external_source_id",
  {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(rows)
  }
);

const activities = upserted.map((prospect) => ({
  prospect_id: prospect.id,
  actor_id: null,
  action_type: "imported",
  description: "Prospect imported or updated from Google Sheet.",
  metadata: {
    imported_from: prospect.imported_from,
    external_source_id: prospect.external_source_id
  }
}));

if (activities.length) {
  await supabaseRest("/rest/v1/prospect_activities", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(activities)
  });
}

console.log(`Imported or updated ${upserted.length} prospects from Google Sheet.`);

async function supabaseRest(path, init) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`Supabase request failed: ${response.status} ${response.statusText}\n${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
