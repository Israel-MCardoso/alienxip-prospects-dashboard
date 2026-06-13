import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import {
  parseCsv,
  buildProspectExternalId
} from "../src/features/prospects/prospect-normalization.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;

const isDryRun = process.argv.includes("--dry-run");

console.log("=================================================");
console.log("       MOTHERXIP LEADS CONSOLIDATION ENGINE      ");
console.log("=================================================");
console.log(`Modo: ${isDryRun ? "SIMULAÇÃO (DRY-RUN)" : "REAL (EXECUÇÃO)"}`);
console.log(`GOOGLE_SHEET_CSV_URL: ${sheetUrl ? "Carregada" : "FALHA"}`);
console.log(`Supabase URL: ${supabaseUrl ? "Carregada" : "FALHA"}`);
console.log("=================================================");

if (!supabaseUrl || !serviceRoleKey || !sheetUrl) {
  console.error("Erro: Variáveis de ambiente faltando em .env.local.");
  process.exit(1);
}

// 1. Fetch Google Sheet Data & compute unique deterministic UUIDs (Grupo B)
console.log("Buscando dados da Google Sheet...");
const sheetResponse = await fetch(sheetUrl, {
  headers: { "user-agent": "Alienxip prospects consolidator" }
});

if (!sheetResponse.ok) {
  console.error(`Erro ao buscar planilha: ${sheetResponse.status} ${sheetResponse.statusText}`);
  process.exit(1);
}

const csv = await sheetResponse.text();
const rawRows = parseCsv(csv);

const uniqueNewIds = new Set();
for (const row of rawRows) {
  if (!row.title || !row.title.trim()) continue;
  const extId = buildProspectExternalId(row);
  const id = deterministicUuid(extId);
  uniqueNewIds.add(id);
}

console.log(`Total de registros únicos na Google Sheet: ${uniqueNewIds.size}`);

// 2. Fetch Prospects and Diagnostics from DB
console.log("\nBuscando registros do Supabase...");
const dbProspects = await supabaseRest("/rest/v1/prospects?select=*");
const dbDiagnostics = await supabaseRest("/rest/v1/prospect_diagnostics?select=*");

console.log(`Total de prospects no banco: ${dbProspects.length}`);
console.log(`Total de diagnósticos no banco: ${dbDiagnostics.length}`);

// 3. Classify prospects into Grupo A (legacy) and Grupo B (new PlaceID-based)
const grupoA = [];
const grupoB = [];

for (const p of dbProspects) {
  if (uniqueNewIds.has(p.id)) {
    grupoB.push(p);
  } else {
    grupoA.push(p);
  }
}

console.log(`Grupo A (Legado): ${grupoA.length} registros no banco`);
console.log(`Grupo B (Novo): ${grupoB.length} registros no banco`);

// 4. Audit diagnostics linked to legacy prospects (Grupo A)
const legacyDiagnosticsToMigrate = [];
for (const diag of dbDiagnostics) {
  const legacyProspect = grupoA.find(p => p.id === diag.prospect_id);
  if (legacyProspect) {
    // Find matching new prospect in Grupo B
    const nameA = cleanString(legacyProspect.name);
    const cityA = cleanString(legacyProspect.city);
    
    const targetProspect = grupoB.find(p => {
      const nameB = cleanString(p.name);
      const cityB = cleanString(p.city);
      return nameA === nameB && cityA === cityB;
    });

    legacyDiagnosticsToMigrate.push({
      diagnostic: diag,
      legacyProspect,
      newProspect: targetProspect || null
    });
  }
}

console.log(`Diagnósticos ligados ao Grupo A: ${legacyDiagnosticsToMigrate.length}`);

for (const item of legacyDiagnosticsToMigrate) {
  console.log(`  - Diagnóstico ID: ${item.diagnostic.id}`);
  console.log(`    Vinculado ao legado: "${item.legacyProspect.name}" em ${item.legacyProspect.city} (ID: ${item.legacyProspect.id})`);
  if (item.newProspect) {
    console.log(`    Novo prospect correspondente encontrado: "${item.newProspect.name}" em ${item.newProspect.city} (ID: ${item.newProspect.id})`);
  } else {
    console.warn(`    AVISO: Nenhum correspondente no Grupo B encontrado para "${item.legacyProspect.name}"!`);
  }
}

// 5. Check if consolidation is already completed (Idempotency)
if (grupoA.length === 0 && legacyDiagnosticsToMigrate.length === 0) {
  console.log("\n=================================================");
  console.log(" STATUS: BANCO JÁ ESTÁ CONSOLIDADO (IDEMPOTENTE) ");
  console.log(" Nenhum prospect legado encontrado.");
  console.log(" Nenhuma alteração necessária.");
  console.log(` Prospects finais: ${dbProspects.length} (esperado: 300)`);
  console.log("=================================================");
  process.exit(0);
}

// 6. Preview of changes (Dry-Run / Execution plan)
console.log("\n--- [PLANO DE AÇÃO / PREVIEW] ---");
console.log(`Prospects antes da limpeza: ${dbProspects.length}`);
console.log(`Grupo A (Legado) a ser removido: ${grupoA.length} registros`);
console.log(`Grupo B (Novo) a ser preservado: ${grupoB.length} registros`);
console.log(`Diagnósticos a migrar do legado para o novo: ${legacyDiagnosticsToMigrate.length}`);
console.log(`Total esperado de prospects após a limpeza: ${dbProspects.length - grupoA.length}`);

if (isDryRun) {
  console.log("\n[DRY RUN] Finalizado com sucesso. Nenhuma escrita realizada no banco.");
  process.exit(0);
}

// 7. Real Execution
console.log("\n--- [EXECUÇÃO REAL DE CONSOLIDAÇÃO] ---");

// Step 7.1: Re-link diagnostics
if (legacyDiagnosticsToMigrate.length > 0) {
  console.log("Passo 1: Re-vinculando diagnósticos dos prospects legados para os novos correspondentes...");
  for (const item of legacyDiagnosticsToMigrate) {
    if (!item.newProspect) {
      console.error(`Erro crítico: Não é possível migrar diagnóstico ID ${item.diagnostic.id} porque nenhum correspondente novo foi encontrado.`);
      process.exit(1);
    }
    
    console.log(`Atualizando diagnóstico ${item.diagnostic.id}: ${item.legacyProspect.id} -> ${item.newProspect.id}`);
    await supabaseRest(`/rest/v1/prospect_diagnostics?id=eq.${item.diagnostic.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        prospect_id: item.newProspect.id,
        updated_at: new Date().toISOString()
      })
    });
  }
  console.log("Re-vinculação concluída com sucesso.");
}

// Step 7.2: Delete legacy prospects
if (grupoA.length > 0) {
  console.log(`Passo 2: Removendo ${grupoA.length} prospects legados...`);
  const legacyIds = grupoA.map(p => p.id);
  
  // Chunk deletions to be absolutely safe (e.g. groups of 100)
  const chunkSize = 100;
  for (let i = 0; i < legacyIds.length; i += chunkSize) {
    const chunk = legacyIds.slice(i, i + chunkSize);
    console.log(`Excluindo lote ${Math.floor(i / chunkSize) + 1} (${chunk.length} registros)...`);
    await supabaseRest(`/rest/v1/prospects?id=in.(${chunk.join(",")})`, {
      method: "DELETE"
    });
  }
  console.log("Remoção de prospects legados concluída com sucesso.");
}

// 8. Validate final state
console.log("\n--- [VALIDAÇÃO DO ESTADO FINAL] ---");
const finalProspects = await supabaseRest("/rest/v1/prospects?select=*");
const finalDiagnostics = await supabaseRest("/rest/v1/prospect_diagnostics?select=*");

console.log(`Contagem final de prospects no banco: ${finalProspects.length}`);
console.log(`Contagem final de diagnósticos no banco: ${finalDiagnostics.length}`);

if (finalProspects.length !== 300) {
  console.error(`Erro de validação: Esperava exatamente 300 prospects no banco, mas encontrou ${finalProspects.length}.`);
  process.exit(1);
}

if (finalDiagnostics.length !== dbDiagnostics.length) {
  console.error(`Erro de validação: A quantidade de diagnósticos mudou! Esperava ${dbDiagnostics.length}, mas encontrou ${finalDiagnostics.length}.`);
  process.exit(1);
}

// Check that the migrated diagnostics now point to Grupo B
for (const diag of finalDiagnostics) {
  const isLinkedToNew = uniqueNewIds.has(diag.prospect_id);
  if (!isLinkedToNew) {
    console.error(`Erro de validação: Diagnóstico ${diag.id} ainda aponta para um prospect fora do Grupo B (prospect_id: ${diag.prospect_id}).`);
    process.exit(1);
  }
}

console.log("Sucesso: Diagnósticos preservados e apontando corretamente para registros do Grupo B.");
console.log("Sucesso: Banco consolidated com exatamente 300 prospects.");
console.log("\n=================================================");
console.log("     CONSOLIDAÇÃO CONCLUÍDA COM SUCESSO!         ");
console.log("=================================================");

// Helper functions
function deterministicUuid(str) {
  const hash = createHash("sha256").update(str).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16),
    "a" + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join("-");
}

function cleanString(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

async function supabaseRest(path, init = {}) {
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
    console.error(`Falha na API Rest: ${response.status} ${response.statusText}\n${body}`);
    process.exit(1);
  }

  if (response.status === 204) return null;
  
  const text = await response.text();
  if (!text || text.trim() === "") return null;
  return JSON.parse(text);
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
