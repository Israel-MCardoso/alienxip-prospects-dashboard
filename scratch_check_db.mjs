import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Checking Supabase connection...");
console.log(`URL: ${supabaseUrl}`);

try {
  // Query all tables to see what exists
  const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`
    }
  });
  console.log(`Connection test: ${tablesResponse.status} ${tablesResponse.statusText}`);
  const tables = await tablesResponse.json();
  console.log("Available REST resources:", Object.keys(tables.paths || {}));

  // Query prospects count
  const prospectsResponse = await fetch(`${supabaseUrl}/rest/v1/prospects?select=id`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "count=exact"
    }
  });
  console.log(`Prospects query: ${prospectsResponse.status}`);
  const rangeHeader = prospectsResponse.headers.get("content-range");
  console.log(`Content-Range header: ${rangeHeader}`);

  const sampleResponse = await fetch(`${supabaseUrl}/rest/v1/prospects?limit=5`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`
    }
  });
  const samples = await sampleResponse.json();
  console.log("Sample records count:", samples.length);
  if (samples.length > 0) {
    console.log("Sample record fields:", Object.keys(samples[0]));
    console.log("Sample record status/temp:", samples.map(s => ({ name: s.name, status: s.status, temp: s.temperature })));
  }
} catch (err) {
  console.error("Error executing check:", err);
}

function loadLocalEnv(fileName) {
  const filePath = join(__dirname, fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
