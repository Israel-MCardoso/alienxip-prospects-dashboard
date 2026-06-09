import test from "node:test";
import assert from "node:assert/strict";

import {
  bugSchema,
  incidentSchema,
  backlogItemSchema,
  technicalDecisionSchema,
  projectNoteSchema,
  normalizeSeverityPriority,
  buildTechSearchResults,
  documentedRlsRules
} from "../app-next/src/features/tech/tech-helpers.mjs";

test("bugSchema validates technical bugs", () => {
  const bug = bugSchema.parse({
    title: "Login quebra no Safari",
    description: "Tela fica em branco apos autenticar",
    status: "open",
    severity: "critical",
    priority: "urgent"
  });

  assert.equal(bug.status, "open");
  assert.equal(bug.severity, "critical");
  assert.throws(() => bugSchema.parse({ title: "", severity: "critical" }));
});

test("incidentSchema validates incidents and defaults status", () => {
  const incident = incidentSchema.parse({
    title: "Supabase latency",
    severity: "high",
    started_at: "2026-06-09"
  });

  assert.equal(incident.status, "investigating");
  assert.equal(incident.severity, "high");
});

test("backlog and decision schemas validate operational tech records", () => {
  const backlog = backlogItemSchema.parse({
    title: "Refatorar activity feed",
    type: "refactor",
    priority: "high"
  });
  const decision = technicalDecisionSchema.parse({
    title: "Usar Supabase Storage",
    context: "Arquivos precisam ficar fora do banco",
    decision: "Usar bucket alienxip-files",
    status: "accepted"
  });

  assert.equal(backlog.type, "refactor");
  assert.equal(decision.status, "accepted");
});

test("normalizeSeverityPriority ranks severity and priority", () => {
  assert.equal(normalizeSeverityPriority("critical", "urgent").score, 100);
  assert.equal(normalizeSeverityPriority("low", "low").label, "Baixo");
});

test("projectNoteSchema validates persistent project notes", () => {
  const note = projectNoteSchema.parse({
    project_id: "project-1",
    title: "Arquitetura",
    content: "Decisao inicial",
    type: "technical"
  });

  assert.equal(note.type, "technical");
});

test("buildTechSearchResults includes bugs incidents backlog roadmap decisions and notes", () => {
  const results = buildTechSearchResults("storage", {
    bugs: [{ id: "b1", title: "Erro no storage" }],
    incidents: [{ id: "i1", title: "Storage fora" }],
    backlog: [{ id: "bl1", title: "Melhorar storage" }],
    roadmap: [{ id: "r1", title: "Storage v2" }],
    decisions: [{ id: "d1", title: "Usar storage", decision: "Supabase Storage" }],
    projectNotes: [{ id: "n1", project_id: "p1", title: "Storage notes" }]
  });

  assert.deepEqual(results.map((item) => item.type), ["bug", "incident", "backlog", "roadmap", "decision", "project_note"]);
  assert.equal(results[0].href, "/os/tech/bugs");
  assert.equal(results.at(-1).href, "/os/projects/p1");
});

test("documentedRlsRules documents owner assigned creator admin model", () => {
  assert.ok(documentedRlsRules.some((rule) => rule.includes("owner_id")));
  assert.ok(documentedRlsRules.some((rule) => rule.includes("assigned_to")));
  assert.ok(documentedRlsRules.some((rule) => rule.includes("created_by")));
  assert.ok(documentedRlsRules.some((rule) => rule.includes("admin")));
});
