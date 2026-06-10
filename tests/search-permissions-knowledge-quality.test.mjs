import test from "node:test";
import assert from "node:assert/strict";

import {
  assertSearchResultShape,
  calculateSearchRank,
  canPerform,
  duplicatePlaybookDraft,
  markFileRemoved,
  normalizeReviewStatus,
  officialKnowledgeTemplates,
  reviewStatuses
} from "../app-next/src/features/governance/governance-helpers.mjs";

test("search result shape validates global search rows", () => {
  const row = assertSearchResultShape({
    entity_type: "project",
    entity_id: "p1",
    title: "Landing Page Reviva",
    subtitle: "Projeto",
    url: "/os/projects/p1",
    rank: 0.9,
    created_at: "2026-06-09T10:00:00.000Z"
  });

  assert.equal(row.entity_type, "project");
  assert.throws(() => assertSearchResultShape({ title: "sem entidade" }));
});

test("calculateSearchRank prioritizes exact title matches", () => {
  assert.ok(calculateSearchRank("deploy", { title: "Deploy Produção", subtitle: "" }) > calculateSearchRank("deploy", { title: "Checklist", subtitle: "deploy" }));
});

test("permission helper reflects admin operator viewer rules", () => {
  assert.equal(canPerform("admin", "delete", "files"), true);
  assert.equal(canPerform("operator", "create", "wiki"), true);
  assert.equal(canPerform("operator", "delete", "projects"), false);
  assert.equal(canPerform("viewer", "read", "playbooks"), true);
  assert.equal(canPerform("viewer", "update", "wiki"), false);
});

test("duplicatePlaybookDraft creates editable copy metadata", () => {
  const duplicate = duplicatePlaybookDraft({
    title: "Deploy Produção",
    description: "Checklist",
    content: "Passos",
    category: "desenvolvimento"
  });

  assert.equal(duplicate.title, "Cópia de Deploy Produção");
  assert.equal(duplicate.status, "draft");
});

test("markFileRemoved stores safe removal metadata", () => {
  const removed = markFileRemoved({ id: "f1", file_name: "briefing.pdf" }, "user-1", "duplicado", "2026-06-09T10:00:00.000Z");

  assert.equal(removed.removed_by, "user-1");
  assert.equal(removed.removal_reason, "duplicado");
  assert.equal(removed.removed_at, "2026-06-09T10:00:00.000Z");
});

test("knowledge review status normalizes quality states", () => {
  assert.deepEqual(reviewStatuses, ["needs_review", "approved", "outdated"]);
  assert.equal(normalizeReviewStatus("").review_status, "needs_review");
  assert.equal(normalizeReviewStatus("approved").review_status, "approved");
});

test("official templates include required ALIENXIP processes", () => {
  const titles = officialKnowledgeTemplates.map((template) => template.title);
  assert.ok(titles.includes("Processo de Prospecção"));
  assert.ok(titles.includes("Postmortem de Incidente"));
  assert.equal(officialKnowledgeTemplates.length, 7);
});
