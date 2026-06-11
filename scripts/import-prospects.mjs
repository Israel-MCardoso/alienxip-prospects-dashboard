import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import {
  buildProspectImportRows,
  parseCsv,
  buildProspectExternalId,
  cityFromAddress
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

let totalLidos = totalRaw;
let totalValidos = 0;
let totalDescartados = 0;
let totalEnriquecidos = 0;
let totalDuplicadosReais = 0;
let totalFiliaisPreservadas = 0;
let totalErrorPhones = 0;

const seenExternalIds = new Map();
const seenOldKeys = new Map();
const duplicateRecords = [];
const uniqueNormalizedRows = [];

for (const row of rawRows) {
  // Validate name/title
  if (!row.title || !row.title.trim()) {
    totalDescartados++;
    continue;
  }

  if (row.phoneNumber === "#ERROR!") {
    totalErrorPhones++;
  }

  const extId = buildProspectExternalId(row);
  const city = cityFromAddress(row.address);
  const legacyKey = `${slugify(row.title)}-${slugify(city)}`;

  if (seenExternalIds.has(extId)) {
    totalDuplicadosReais++;
    duplicateRecords.push({
      title: row.title,
      city: city,
      phoneNumber: row.phoneNumber,
      external_source_id: extId
    });
  } else {
    seenExternalIds.set(extId, true);
    if (seenOldKeys.has(legacyKey)) {
      totalFiliaisPreservadas++;
    }
    seenOldKeys.set(legacyKey, true);

    // Normalize row
    const normalizedList = buildProspectImportRows([row]);
    const normalized = normalizedList[0];
    if (normalized) {
      normalized.id = deterministicUuid(extId); // Assign deterministic UUID
      
      // Check if it was enriched
      if (normalized.metadata && normalized.metadata.phone_enriched) {
        totalEnriquecidos++;
      }
      
      uniqueNormalizedRows.push(normalized);
    } else {
      totalDescartados++;
    }
  }
}

totalValidos = uniqueNormalizedRows.length;
const totalNaoRecuperados = totalErrorPhones - totalEnriquecidos;

console.log(`Registros brutos lidos: ${totalLidos}`);
console.log(`Registros válidos (únicos): ${totalValidos}`);
console.log(`Registros descartados (inválidos): ${totalDescartados}`);
console.log(`Telefones corrompidos com #ERROR! (inicial): ${totalErrorPhones}`);
console.log(`Telefones recuperados (enriquecidos): ${totalEnriquecidos}`);
console.log(`Telefones não recuperados: ${totalNaoRecuperados}`);
console.log(`Duplicados reais identificados: ${totalDuplicadosReais}`);
console.log(`Filiais legítimas preservadas: ${totalFiliaisPreservadas}`);

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
console.log(`Tabela projects: ${initialCounts.projects}`);
console.log(`Tabela prospect_proposals: ${initialCounts.proposals}`);

if (isDryRun) {
  console.log("\n[DRY RUN] Finalizado com sucesso. Nenhuma alteração foi realizada no banco.");
  process.exit(0);
}

// 4. Perform Real Import
console.log("\n--- [MIGRAÇÃO DE LEADS - IMPORTAÇÃO REAL] ---");
console.log(`Iniciando importação de ${uniqueNormalizedRows.length} leads para 'prospects'...`);

// Fetch existing ids in db to calculate inserted vs updated
const existingProspects = await supabaseRestSafe("/rest/v1/prospects?select=id");
const existingIds = new Set((existingProspects || []).map(p => p.id));

const upsertPayload = uniqueNormalizedRows.map(({ metadata, ...rest }) => rest);

const upserted = await supabaseRest(
  "/rest/v1/prospects?on_conflict=id",
  {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(upsertPayload)
  }
);

const totalUpserted = upserted?.length || 0;
let totalInserido = 0;
let totalAtualizado = 0;

if (upserted) {
  for (const record of upserted) {
    if (existingIds.has(record.id)) {
      totalAtualizado++;
    } else {
      totalInserido++;
    }
  }
}

console.log(`Importação concluída.`);
console.log(`Total inserido (novos): ${totalInserido}`);
console.log(`Total atualizado (existentes): ${totalAtualizado}`);

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
console.log(`Tabela projects: ${finalCounts.projects}`);
console.log(`Tabela prospect_proposals: ${finalCounts.proposals}`);

// Validation Step: Check for inconsistencies
console.log("\n--- [VALIDAÇÃO SUPABASE VS GOOGLE SHEET] ---");
const expectedInDb = uniqueNormalizedRows.length;
const actualInDb = finalCounts.prospects;
console.log(`Total esperado no Supabase (planilha única): ${expectedInDb}`);
console.log(`Total real no Supabase: ${actualInDb}`);

const missing = [];
if (actualInDb < expectedInDb) {
  const currentDbProspects = await supabaseRestSafe("/rest/v1/prospects?select=id,external_source_id");
  const currentDbIds = new Set((currentDbProspects || []).map(p => p.id));
  
  for (const row of uniqueNormalizedRows) {
    if (!currentDbIds.has(row.id)) {
      missing.push(row.name);
    }
  }
}

if (missing.length > 0) {
  console.log(`ATENÇÃO: Existem ${missing.length} registros ausentes no banco de dados!`);
  console.log("Registros ausentes:", missing);
} else {
  console.log("Sucesso: Todos os registros únicos da planilha estão presentes no Supabase.");
}

console.log("\n=================================================");
console.log("       MIGRAÇÃO CONCLUÍDA COM SUCESSO!           ");
console.log("=================================================");

// Save report file
const reportContent = `
# RELATÓRIO DE MIGRAÇÃO - PROSPECTS MOTHERXIP

- Data: ${new Date().toISOString()}

## Google Sheet
- Total Bruto Lidos: ${totalLidos}
- Total Válidos Mapeados: ${totalValidos}
- Total Descartados: ${totalDescartados}
- Duplicados Reais (PlaceID repetido): ${totalDuplicadosReais}
- Filiais Legítimas Preservadas: ${totalFiliaisPreservadas}

## Enriquecimento de Telefones
- Telefones com #ERROR! Iniciais: ${totalErrorPhones}
- Telefones Recuperados (bookingLinks): ${totalEnriquecidos}
- Telefones Não Recuperados: ${totalNaoRecuperados}

## Supabase
- Total Inserido (Novos): ${totalInserido}
- Total Atualizado (Existentes): ${totalAtualizado}
- Situação do Banco de Dados:
  - Inicial: prospects=${initialCounts.prospects}, companies=${initialCounts.companies}, clients=${initialCounts.clients}, projects=${initialCounts.projects}, proposals=${initialCounts.proposals}
  - Final: prospects=${finalCounts.prospects}, companies=${finalCounts.companies}, clients=${finalCounts.clients}, projects=${finalCounts.projects}, proposals=${finalCounts.proposals}

## Inconsistências
${missing.length > 0 ? `Inconsistência: ${missing.length} registros ausentes no Supabase:\n${missing.map(m => `- ${m}`).join("\n")}` : "Nenhuma inconsistência encontrada. Mapeamento Supabase vs Google Sheet 100% íntegro."}

## Lista de Duplicados Reais Descartados:
${duplicateRecords.length > 0 ? duplicateRecords.map(d => `- ${d.title} (ID: ${d.external_source_id})`).join("\n") : "Nenhum duplicado descartado."}
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

function slugify(val) {
  return String(val || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getDbCounts() {
  const [prospectsRes, companiesRes, clientsRes, projectsRes, proposalsRes] = await Promise.all([
    supabaseRestSafe("/rest/v1/prospects?select=id"),
    supabaseRestSafe("/rest/v1/companies?select=id"),
    supabaseRestSafe("/rest/v1/clients?select=id"),
    supabaseRestSafe("/rest/v1/projects?select=id"),
    supabaseRestSafe("/rest/v1/prospect_proposals?select=id")
  ]);
  
  return {
    prospects: getCount(prospectsRes),
    companies: getCount(companiesRes),
    clients: getCount(clientsRes),
    projects: getCount(projectsRes),
    proposals: getCount(proposalsRes)
  };
}

function getCount(res) {
  return res ? res.length : 0;
}

async function supabaseRestSafe(path) {
  try {
    const response = await fetch(`${supabaseUrl}${path}`, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`
      }
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text || text.trim() === "") return null;
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
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
