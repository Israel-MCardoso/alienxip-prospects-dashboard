import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGlobalSearchResults,
  calculateDashboardMetrics,
  filterOwnedItems,
  groupActivitiesByPeriod,
  isOwnedBy
} from "../app-next/src/features/workspace/workspace-helpers.mjs";

test("ownership helpers identify owned records consistently", () => {
  const items = [
    { id: "1", owner_id: "user-a", status: "active" },
    { id: "2", owner_id: "user-b", status: "active" },
    { id: "3", responsible_user_id: "user-a", status: "diagnostico" }
  ];

  assert.equal(isOwnedBy(items[0], "user-a"), true);
  assert.equal(isOwnedBy(items[1], "user-a"), false);
  assert.deepEqual(filterOwnedItems(items, "user-a").map((item) => item.id), ["1", "3"]);
});

test("groupActivitiesByPeriod groups today yesterday and last seven days", () => {
  const grouped = groupActivitiesByPeriod([
    { id: "today", created_at: "2026-06-09T10:00:00.000Z" },
    { id: "yesterday", created_at: "2026-06-08T10:00:00.000Z" },
    { id: "week", created_at: "2026-06-05T10:00:00.000Z" },
    { id: "old", created_at: "2026-05-01T10:00:00.000Z" }
  ], "2026-06-09");

  assert.deepEqual(grouped.today.map((item) => item.id), ["today"]);
  assert.deepEqual(grouped.yesterday.map((item) => item.id), ["yesterday"]);
  assert.deepEqual(grouped.last7.map((item) => item.id), ["week"]);
});

test("calculateDashboardMetrics returns operational counters", () => {
  const metrics = calculateDashboardMetrics({
    prospects: [
      { status: "diagnostico", owner_id: "user-a", converted_at: null },
      { status: "fechado", owner_id: "user-a", converted_at: "2026-06-02T10:00:00.000Z" },
      { status: "perdido", owner_id: "user-b", converted_at: null }
    ],
    clients: [{ status: "active" }, { status: "paused" }],
    projects: [{ status: "active" }, { status: "completed", completed_at: "2026-06-03T10:00:00.000Z" }],
    tasks: [
      { status: "pending", due_date: "2026-06-01", assigned_to: "user-a" },
      { status: "pending", due_date: "2026-06-09", assigned_to: "user-a" },
      { status: "completed", due_date: "2026-06-01", assigned_to: "user-a" }
    ]
  }, { userId: "user-a", today: "2026-06-09" });

  assert.equal(metrics.activeProspects, 2);
  assert.equal(metrics.activeClients, 1);
  assert.equal(metrics.activeProjects, 1);
  assert.equal(metrics.openTasks, 2);
  assert.equal(metrics.overdueTasks, 1);
  assert.equal(metrics.todayTasks, 1);
  assert.equal(metrics.monthConversions, 1);
  assert.equal(metrics.completedProjects, 1);
  assert.equal(metrics.myOpenTasks, 2);
});

test("buildGlobalSearchResults finds prospects companies clients projects and tasks", () => {
  const results = buildGlobalSearchResults("reviva", {
    prospects: [{ id: "p1", name: "Reviva Estetica" }],
    companies: [{ id: "c1", name: "Reviva Ltda" }],
    clients: [{ id: "cl1", main_contact_name: "Equipe Reviva" }],
    projects: [{ id: "pr1", name: "Landing Reviva" }],
    tasks: [{ id: "t1", title: "Follow-up Reviva" }]
  });

  assert.deepEqual(results.map((item) => item.type), ["prospect", "company", "client", "project", "task"]);
  assert.equal(results[0].href, "/os/prospects/p1");
  assert.equal(results.at(-1).href, "/os/tasks");
});
