import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prospectsCrm = readFileSync("app-next/src/features/prospects/prospects-crm.tsx", "utf8");
const pipelineBoard = readFileSync("app-next/src/features/commercial/pipeline-board.tsx", "utf8");
const prospectWorkspace = readFileSync("app-next/src/features/prospects/prospect-workspace.tsx", "utf8");

test("prospects CRM presents prospects as commercial opportunities without deals data model", () => {
  assert.match(prospectsCrm, /PROSPECTS & OPORTUNIDADES/);
  assert.match(prospectsCrm, /Valor potencial/);
  assert.match(prospectsCrm, /Filtros reativos/);
  assert.match(prospectsCrm, /getProspectPotentialValue/);
  assert.match(prospectsCrm, /Enviar para SDR/);
});

test("pipeline board is visually framed as a deal board while keeping prospect status flow", () => {
  assert.match(pipelineBoard, /DEAL BOARD/);
  assert.match(pipelineBoard, /oportunidades/);
  assert.match(pipelineBoard, /Potencial total/);
  assert.match(pipelineBoard, /Oportunidade/);
  assert.match(pipelineBoard, /updateProspectStatusAction/);
  assert.match(pipelineBoard, /handleDrop/);
});

test("prospect workspace keeps real conversion action and custom selects for commercial task flow", () => {
  assert.match(prospectWorkspace, /convertProspectAction/);
  assert.match(prospectWorkspace, /createTaskAction/);
  assert.match(prospectWorkspace, /<CustomSelect/);
  assert.match(prospectWorkspace, /name="contract_status"/);
  assert.doesNotMatch(prospectWorkspace, /deals/i);
});
