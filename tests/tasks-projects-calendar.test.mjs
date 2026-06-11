import test from "node:test";
import assert from "node:assert/strict";

import {
  projectSchema,
  groupTasksByDateBucket,
  groupProjectsByStatus,
  calculateProjectProgress
} from "../app-next/src/features/operations/operations-helpers.mjs";

test("projectSchema validates project creation input", () => {
  const project = projectSchema.parse({
    name: "Novo site cliente",
    description: "Entrega institucional",
    status: "planning",
    priority: "high",
    due_date: "2026-06-30"
  });

  assert.equal(project.name, "Novo site cliente");
  assert.equal(project.priority, "high");
  assert.throws(() => projectSchema.parse({ name: "", status: "planning", priority: "medium" }));
});

test("groupTasksByDateBucket groups overdue today next7 and unscheduled tasks", () => {
  const grouped = groupTasksByDateBucket([
    { title: "Vencida", due_date: "2026-06-01", status: "pending" },
    { title: "Hoje", due_date: "2026-06-09", status: "pending" },
    { title: "Semana", due_date: "2026-06-14", status: "pending" },
    { title: "Sem data", due_date: null, status: "pending" },
    { title: "Concluida", due_date: "2026-06-01", status: "completed" }
  ], "2026-06-09");

  assert.equal(grouped.overdue.length, 1);
  assert.equal(grouped.today.length, 1);
  assert.equal(grouped.next7.length, 1);
  assert.equal(grouped.unscheduled.length, 1);
});

test("project helpers group by status and calculate progress", () => {
  const grouped = groupProjectsByStatus([
    { id: "1", status: "active" },
    { id: "2", status: "planning" },
    { id: "3", status: "active" }
  ]);

  assert.equal(grouped.active.length, 2);
  assert.equal(grouped.completed.length, 0);
  assert.equal(calculateProjectProgress([
    { status: "completed" },
    { status: "pending" },
    { status: "completed" }
  ]), 67);
});
