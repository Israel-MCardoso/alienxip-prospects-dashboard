import test from "node:test";
import assert from "node:assert/strict";

import {
  wikiPageSchema,
  playbookSchema,
  fileMetadataSchema,
  buildKnowledgeSearchResults,
  normalizeStoragePath,
  wikiCategories,
  storageBucketName
} from "../app-next/src/features/knowledge/knowledge-helpers.mjs";

test("wikiPageSchema validates wiki pages and categories", () => {
  const page = wikiPageSchema.parse({
    title: "Processo de Prospecção",
    slug: "processo-prospeccao",
    content: "Etapas do processo",
    category: "prospeccao",
    status: "draft"
  });

  assert.equal(page.status, "draft");
  assert.equal(page.category, "prospeccao");
  assert.ok(wikiCategories.includes("desenvolvimento"));
  assert.throws(() => wikiPageSchema.parse({ title: "", content: "x", category: "geral" }));
});

test("playbookSchema validates operational playbooks", () => {
  const playbook = playbookSchema.parse({
    title: "Deploy Produção",
    description: "Checklist seguro",
    content: "1. Build\n2. Deploy",
    category: "desenvolvimento",
    status: "published"
  });

  assert.equal(playbook.title, "Deploy Produção");
  assert.equal(playbook.status, "published");
});

test("fileMetadataSchema normalizes storage metadata", () => {
  const file = fileMetadataSchema.parse({
    file_name: "briefing.pdf",
    file_type: "application/pdf",
    file_size: "1234",
    entity_type: "project",
    entity_id: "project-1"
  });

  assert.equal(file.bucket, storageBucketName);
  assert.equal(file.file_size, 1234);
});

test("normalizeStoragePath creates safe entity paths", () => {
  assert.equal(normalizeStoragePath("Project", "abc-123", "Briefing Final.pdf"), "project/abc-123/briefing-final.pdf");
});

test("buildKnowledgeSearchResults includes wiki playbooks and files", () => {
  const results = buildKnowledgeSearchResults("deploy", {
    wikiPages: [{ id: "w1", title: "Deploy Seguro", slug: "deploy-seguro", content: "Checklist" }],
    playbooks: [{ id: "p1", title: "Deploy Produção", content: "Vercel" }],
    files: [{ id: "f1", file_name: "deploy.pdf", entity_type: "project", entity_id: "pr1" }]
  });

  assert.deepEqual(results.map((item) => item.type), ["wiki", "playbook", "file"]);
  assert.equal(results[0].href, "/os/wiki/deploy-seguro");
  assert.equal(results.at(-1).href, "/os/files");
});
