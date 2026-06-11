import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import {
  buildProspectImportRows,
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
console.log("       MOTHERXIP LEADS MIGRATION ENGINE          ");
console.log("=================================================");
console.log(`Modo: ${isDryRun ? "SIMULAÇÃO (DRY-RUN)" : "REAL (MIGRANDO)"}`);
console.log(`GOOGLE_SHEET_CSV_URL: ${sheetUrl ? "Carregada" : "FALHA"}`);
console.log(`Supabase URL: ${supabaseUrl ? "Carregada" : "FALHA"}`);
console.log("=================================================");

if (!supabaseUrl || !serviceRoleKey || !sheetUrl) {
  console.error("Erro: Variáveis de ambiente faltando em .env.local.");
  process.exit(1);
}

// 1. Fetch Google Sheet Data
console.log("Buscando dados da Google Sheet...");
const sheetResponse = await fetch(sheetUrl, {
  headers: { "user-agent": "Alienxip prospects importer" }
});

if (!sheetResponse.ok) {
  console.error(`Erro ao buscar planilha: ${sheetResponse.status} ${sheetResponse.statusText}`);
  process.exit(1);
}

const csv = await sheetResponse.text();
const rawRows = parseCsv(csv);

// 2. Perform Audit & Validation
console.log("\n--- [AUDITORIA E VALIDAÇÃO DA PLANILHA] ---");
const totalRaw = rawRows.length;
console.log(`Total de registros brutos encontrados: ${totalRaw}`);

let emptyTitles = 0;
let invalidPhones = 0;
const seenExternalIds = new Map();
const duplicateRecords = [];
const uniqueNormalizedRows = [];

for (const row of rawRows) {
  if (!row.title || !row.title.trim()) {
    emptyTitles++;
  }
  
  if (row.phoneNumber === "#ERROR!") {
    invalidPhones++;
  }

  const extId = buildProspectExternalId(row);
  if (seenExternalIds.has(extId)) {
    duplicateRecords.push({
      title: row.title,
      city: row.address,
      phoneNumber: row.phoneNumber,
      external_source_id: extId
    });
  } else {
    seenExternalIds.set(extId, true);
    // Normalize row
    const normalized = buildProspectImportRows([row])[0];
    if (normalized) {
      normalized.id = deterministicUuid(extId); // Assign deterministic UUID
      uniqueNormalizedRows.push(normalized);
    }
  }
}

console.log(`Registros sem nome: ${emptyTitles}`);
console.log(`Telefones com #ERROR!: ${invalidPhones}`);
console.log(`Registros duplicados identificados: ${duplicateRecords.length}`);
duplicateRecords.forEach((dup, i) => {
  console.log(`  ${i + 1}. ${dup.title} (ID: ${dup.external_source_id})`);
});
console.log(`Registros únicos após deduplicação: ${uniqueNormalizedRows.length}`);

// Print sample mapping mapping
if (uniqueNormalizedRows.length > 0) {
  console.log("\nExemplo de Mapeamento (Primeiro Registro):");
  console.log(JSON.stringify(uniqueNormalizedRows[0], null, 2));
}

// 3. Check Initial DB State
console.log("\n--- [ESTADO INICIAL DO BANCO SUPABASE] ---");
const initialCounts = await getDbCounts();
console.log(`Tabela prospects: ${initialCounts.prospects}`);
console.log(`Tabela companies: ${initialCounts.companies}`);
console.log(`Tabela clients: ${initialCounts.clients}`);

if (isDryRun) {
  console.log("\n[DRY RUN] Finalizado com sucesso. Nenhuma alteração foi realizada no banco.");
  process.exit(0);
}

// 4. Perform Real Import
console.log("\n--- [MIGRAÇÃO DE LEADS - IMPORTAÇÃO REAL] ---");
console.log(`Iniciando importação de ${uniqueNormalizedRows.length} leads para 'prospects'...`);

const upserted = await supabaseRest(
  "/rest/v1/prospects?on_conflict=id",
  {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(uniqueNormalizedRows)
  }
);

console.log(`Importação concluída. ${upserted?.length || 0} registros inseridos/atualizados.`);

// Write activities
if (upserted && upserted.length > 0) {
  const activities = upserted.map((prospect) => ({
    prospect_id: prospect.id,
    actor_id: null,
    action_type: "imported",
    description: "Prospect importado ou atualizado da Google Sheet durante migração oficial.",
    metadata: {
      imported_from: prospect.imported_from,
      external_source_id: prospect.external_source_id
    }
  }));

  await supabaseRest("/rest/v1/prospect_activities", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(activities)
  });
}

// 5. Check Final DB State & Report
console.log("\n--- [ESTADO FINAL DO BANCO SUPABASE] ---");
const finalCounts = await getDbCounts();
console.log(`Tabela prospects: ${finalCounts.prospects}`);
console.log(`Tabela companies: ${finalCounts.companies}`);
console.log(`Tabela clients: ${finalCounts.clients}`);

console.log("\n=================================================");
console.log("       MIGRAÇÃO CONCLUÍDA COM SUCESSO!           ");
console.log("=================================================");

// Save report file
const reportContent = `
# RELATÓRIO DE MIGRAÇÃO - PROSPECTS MOTHERXIP

- Data: ${new Date().toISOString()}
- Total Bruto Encontrado na Google Sheet: ${totalRaw}
- Total Único Identificado: ${uniqueNormalizedRows.length}
- Duplicados Ignorados: ${duplicateRecords.length}
- Registros Sem Nome: ${emptyTitles}
- Telefones com #ERROR!: ${invalidPhones}

## Contagens no Banco de Dados:
- Inicial: prospects=${initialCounts.prospects}, companies=${initialCounts.companies}, clients=${initialCounts.clients}
- Final: prospects=${finalCounts.prospects}, companies=${finalCounts.companies}, clients=${finalCounts.clients}

## Duplicados Encontrados:
${duplicateRecords.map(d => `- ${d.title} (ID: ${d.external_source_id})`).join("\n")}

## Exemplos de Registros Importados:
${JSON.stringify(uniqueNormalizedRows.slice(0, 3), null, 2)}
`;
writeFileSync(join(root, "MIGRATION_REPORT.md"), reportContent, "utf8");
console.log("Relatório salvo em MIGRATION_REPORT.md");


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

async function getDbCounts() {
  const [prospectsRes, companiesRes, clientsRes] = await Promise.all([
    supabaseRest("/rest/v1/prospects?select=id", { method: "GET" }),
    supabaseRest("/rest/v1/companies?select=id", { method: "GET" }),
    supabaseRest("/rest/v1/clients?select=id", { method: "GET" })
  ]);
  
  return {
    prospects: getCount(prospectsRes),
    companies: getCount(companiesRes),
    clients: getCount(clientsRes)
  };
}

function getCount(res) {
  return res ? res.length : 0;
}

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
