import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const commercialActions = readFileSync("app-next/src/features/commercial/actions.ts", "utf8");
const operationsActions = readFileSync("app-next/src/features/operations/actions.ts", "utf8");
const workspaceData = readFileSync("app-next/src/features/workspace/data.ts", "utf8");
const companyPage = readFileSync("app-next/src/app/os/(protected)/companies/[id]/page.tsx", "utf8");
const clientPage = readFileSync("app-next/src/app/os/(protected)/clients/[id]/page.tsx", "utf8");

test("company detail can create linked clients through a safe server action", () => {
  assert.match(commercialActions, /export async function createClientFromCompanyAction/);
  assert.match(commercialActions, /auth\.getUser\(\)/);
  assert.match(commercialActions, /Usuario nao autenticado/);
  assert.match(commercialActions, /\.from\("companies"\)/);
  assert.match(commercialActions, /\.from\("clients"\)/);
  assert.match(commercialActions, /company_id: company\.id/);
  assert.match(commercialActions, /entity_type: "client"/);
  assert.match(commercialActions, /entity_type: "company"/);
  assert.match(commercialActions, /revalidatePath\(`\/os\/companies\/\$\{company\.id\}`\)/);
  assert.match(commercialActions, /revalidatePath\("\/os\/clients"\)/);
});

test("task creation revalidates client and company record pages", () => {
  assert.match(operationsActions, /if \(task\.client_id\) revalidatePath\(`\/os\/clients\/\$\{task\.client_id\}`\)/);
  assert.match(operationsActions, /if \(task\.company_id\) revalidatePath\(`\/os\/companies\/\$\{task\.company_id\}`\)/);
  assert.match(operationsActions, /company_id: task\.company_id/);
});

test("client and company timelines use real activity entity filters", () => {
  assert.match(workspaceData, /company_id\?: string/);
  assert.match(workspaceData, /filters\.company_id/);
  assert.match(companyPage, /getActivities\(\{ entity_type: "company", company_id: id \}\)/);
  assert.match(clientPage, /getActivities\(\{ entity_type: "client", client_id: id \}\)/);
});

test("company right panel exposes a real create client form with custom selects", () => {
  assert.match(companyPage, /function CompactClientForm/);
  assert.match(companyPage, /createClientFromCompanyAction\.bind\(null, companyId\)/);
  assert.match(companyPage, /<CustomSelect name="status"/);
  assert.match(companyPage, /<CustomSelect name="contract_status"/);
  assert.doesNotMatch(companyPage, /TODO: acao segura de criacao de cliente/);
});
