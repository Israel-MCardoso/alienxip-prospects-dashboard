import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadLocalEnv(".env.local");
loadLocalEnv("app-next/.env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);

async function check() {
  try {
    // 1. Prospect statuses
    const prospectsResp = await fetch(`${supabaseUrl}/rest/v1/prospects?select=status`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`
      }
    });
    const prospects = await prospectsResp.json();
    const statusCounts = {};
    for (const p of prospects) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }
    console.log("Prospect statuses counts in database:", statusCounts);

    // 2. Playbooks
    const playbooksResp = await fetch(`${supabaseUrl}/rest/v1/playbooks?select=*`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`
      }
    });
    const playbooks = await playbooksResp.json();
    console.log(`Found ${playbooks.length} playbooks in database:`);
    for (const pb of playbooks) {
      console.log(`- ID: ${pb.id}, Title: "${pb.title}", Category: "${pb.category}", Status: "${pb.status}"`);
    }
  } catch (err) {
    console.error("Error running check:", err);
  }
}

check();

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
